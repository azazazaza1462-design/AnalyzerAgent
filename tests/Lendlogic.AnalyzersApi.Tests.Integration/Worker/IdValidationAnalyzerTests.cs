using System.Text.Json;
using FluentAssertions;
using Lendlogic.Agent.Core.Analysis;
using Lendlogic.Agent.Core.Claude;
using Lendlogic.Agent.Core.Contracts;
using Lendlogic.Agent.Core.Imaging;
using Xunit;

namespace Lendlogic.AnalyzersApi.Tests.Integration.Worker;

/// <summary>
/// Unit tests for the six-step ID pipeline with a fake Claude vision client —
/// deterministic, no API calls. Verifies extraction mapping, the deterministic
/// checks (expiry/consistency/cross-check), and the verdict logic.
/// </summary>
public sealed class IdValidationAnalyzerTests
{
    private const string Classify =
        """{"documentKind":"drivers_license","country":"US","state":"TX","imageQuality":"good"}""";

    private const string Extract =
        """{"fullName":"Jane Doe","dateOfBirth":"1990-05-20","documentNumber":"D1234567","issueDate":"2020-01-01","expiryDate":"2035-01-01","address":"1 Main St","mrzLine1":"","mrzLine2":""}""";

    private static IdValidationAnalyzer CreateAnalyzer(string authenticityJson)
    {
        var vision = new FakeVision(Classify, Extract, authenticityJson);
        var options = new ClaudeOptions { ApiKey = "test", Model = "claude-sonnet-4-6" };
        return new IdValidationAnalyzer(vision, new FakeRasterizer(), options);
    }

    private static AnalyzerMessagePayload Payload(string? name, string? dob) => new()
    {
        DocumentType = "id_validation",
        LosData = new LosApplicantData { FullName = name, DateOfBirth = dob },
    };

    private static IReadOnlyList<AnalyzerFile> OneImage() =>
        [new AnalyzerFile(Guid.NewGuid(), "id.jpg", "image/jpeg", [1, 2, 3])];

    [Fact]
    public async Task Verifies_WhenEverythingMatches_AndDocumentLooksAuthentic()
    {
        var analyzer = CreateAnalyzer("""{"authenticityScore":0.95,"tamperingDetected":false,"notes":"clean"}""");

        var result = (IdValidationResult)await analyzer.AnalyzeAsync(
            Payload("Jane Doe", "1990-05-20"), OneImage(), CancellationToken.None);

        result.Fields.FullName.Should().Be("Jane Doe");
        result.Fields.DocumentKind.Should().Be("drivers_license");
        result.Verdict.Should().Be(IdVerdict.Verified);
        result.Calls.Should().HaveCount(6);
        result.Checks.Should().Contain(c => c.Name == "name_match" && c.Status == CheckStatus.Pass);
        result.Checks.Should().Contain(c => c.Name == "dob_match" && c.Status == CheckStatus.Pass);
        result.Checks.Should().Contain(c => c.Name == "mrz_checksum" && c.Status == CheckStatus.NotApplicable);
    }

    [Fact]
    public async Task Rejects_WhenTamperingDetected()
    {
        var analyzer = CreateAnalyzer("""{"authenticityScore":0.2,"tamperingDetected":true,"notes":"edited photo"}""");

        var result = (IdValidationResult)await analyzer.AnalyzeAsync(
            Payload("Jane Doe", "1990-05-20"), OneImage(), CancellationToken.None);

        result.Verdict.Should().Be(IdVerdict.Rejected);
        result.Checks.Should().Contain(c => c.Name == "authenticity" && c.Status == CheckStatus.Fail);
    }

    [Fact]
    public async Task Rejects_WhenNameMismatch()
    {
        var analyzer = CreateAnalyzer("""{"authenticityScore":0.95,"tamperingDetected":false,"notes":"clean"}""");

        var result = (IdValidationResult)await analyzer.AnalyzeAsync(
            Payload("John Smith", "1990-05-20"), OneImage(), CancellationToken.None);

        result.Verdict.Should().Be(IdVerdict.Rejected); // full name mismatch → name_match Fail
        result.Checks.Should().Contain(c => c.Name == "name_match" && c.Status == CheckStatus.Fail);
    }

    private sealed class FakeVision(string classify, string extract, string authenticity) : IClaudeVisionClient
    {
        public Task<ClaudeVisionResponse> ExtractAsync(ClaudeVisionRequest request, CancellationToken cancellationToken)
        {
            var json = request.SystemPrompt.Contains("classifier") ? classify
                : request.SystemPrompt.Contains("extract fields") ? extract
                : authenticity;
            return Task.FromResult(new ClaudeVisionResponse(
                JsonSerializer.Deserialize<JsonElement>(json), 100, 40));
        }
    }

    private sealed class FakeRasterizer : IImageRasterizer
    {
        public IReadOnlyList<ClaudeImage> ToImages(AnalyzerFile file) =>
            [new ClaudeImage("image/png", file.Content)];
    }
}
