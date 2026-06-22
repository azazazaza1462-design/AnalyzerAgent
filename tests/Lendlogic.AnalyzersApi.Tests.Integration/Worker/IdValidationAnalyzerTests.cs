using System.Text.Json;
using FluentAssertions;
using Lendlogic.Agent.Core.Analysis;
using Lendlogic.Agent.Core.Claude;
using Lendlogic.Agent.Core.Contracts;
using Xunit;

namespace Lendlogic.AnalyzersApi.Tests.Integration.Worker;

/// <summary>
/// Unit tests for the single-pass ID analyzer with a fake Claude vision client —
/// deterministic, no API calls. Verifies extraction mapping, the deterministic
/// MRZ checksum, and the manual-review gate.
/// </summary>
public sealed class IdValidationAnalyzerTests
{
    private static IdValidationAnalyzer CreateAnalyzer(string extractionJson)
    {
        var vision = new FakeVision(extractionJson);
        var options = new ClaudeOptions { ApiKey = "test", Model = "claude-sonnet-4-6" };
        return new IdValidationAnalyzer(vision, options);
    }

    private static AnalyzerMessagePayload Payload() => new() { DocumentType = "id_validation" };

    private static IReadOnlyList<AnalyzerFile> OneImage() =>
        [new AnalyzerFile(Guid.NewGuid(), "id.jpg", "image/jpeg", [1, 2, 3])];

    // Builds the single extraction-tool JSON the fake vision client returns.
    private static string Extraction(
        string documentType = "drivers_license",
        string firstName = "Jane",
        string lastName = "Doe",
        string dateOfBirth = "1990-05-20",
        string documentNumber = "D1234567",
        string nationality = "USA",
        string issuingCountry = "USA",
        string dateOfExpiry = "2035-01-01",
        string sex = "F",
        string mrz = "",
        double confidence = 0.95,
        string legibilityNotes = "")
    {
        var obj = new
        {
            documentType,
            firstName,
            lastName,
            dateOfBirth,
            documentNumber,
            nationality,
            issuingCountry,
            dateOfExpiry,
            sex,
            machineReadableZone = mrz,
            overallConfidence = confidence,
            legibilityNotes,
        };
        return JsonSerializer.Serialize(obj);
    }

    [Fact]
    public async Task MapsFields_AndPasses_WhenCleanAndConfident()
    {
        var analyzer = CreateAnalyzer(Extraction());

        var result = (IdentityDocumentResult)await analyzer.AnalyzeAsync(
            Payload(), OneImage(), CancellationToken.None);

        result.FirstName.Should().Be("Jane");
        result.LastName.Should().Be("Doe");
        result.DocumentType.Should().Be(DocumentType.DriversLicense);
        result.DocumentNumber.Should().Be("D1234567");
        result.MrzChecksumValid.Should().BeNull();        // no MRZ on this document
        result.RequiresManualReview.Should().BeFalse();
        result.ReviewReasons.Should().BeEmpty();
    }

    [Fact]
    public async Task Passes_WhenConfident_DespiteBenignLegibilityNote()
    {
        // A benign legibility note on an otherwise confident read must NOT flag review.
        var analyzer = CreateAnalyzer(Extraction(
            legibilityNotes: "All fields legible; sex field not present on this document."));

        var result = (IdentityDocumentResult)await analyzer.AnalyzeAsync(
            Payload(), OneImage(), CancellationToken.None);

        result.RequiresManualReview.Should().BeFalse();
        result.ReviewReasons.Should().BeEmpty();
        // The note is captured (informational) but does not gate review.
        result.LegibilityNotes.Should().Contain("sex field not present");
    }

    [Fact]
    public async Task FlagsReview_WhenConfidenceBelowThreshold()
    {
        var analyzer = CreateAnalyzer(Extraction(confidence: 0.50));

        var result = (IdentityDocumentResult)await analyzer.AnalyzeAsync(
            Payload(), OneImage(), CancellationToken.None);

        result.RequiresManualReview.Should().BeTrue();
        result.ReviewReasons.Should().Contain(r => r.Contains("confidence"));
    }

    [Fact]
    public async Task FlagsReview_WhenDocumentExpired()
    {
        var analyzer = CreateAnalyzer(Extraction(dateOfExpiry: "2000-01-01"));

        var result = (IdentityDocumentResult)await analyzer.AnalyzeAsync(
            Payload(), OneImage(), CancellationToken.None);

        result.RequiresManualReview.Should().BeTrue();
        result.ReviewReasons.Should().Contain(r => r.Contains("expired"));
    }

    [Fact]
    public async Task FlagsReview_WhenDocumentNumberMissing()
    {
        var analyzer = CreateAnalyzer(Extraction(documentNumber: ""));

        var result = (IdentityDocumentResult)await analyzer.AnalyzeAsync(
            Payload(), OneImage(), CancellationToken.None);

        result.DocumentNumber.Should().BeNull();
        result.RequiresManualReview.Should().BeTrue();
        result.ReviewReasons.Should().Contain(r => r.Contains("Document number"));
    }

    [Fact]
    public async Task ValidatesMrz_WhenChecksumPasses()
    {
        // Two 44-char all-zero lines: every check digit is 0 and validates.
        var mrz = new string('0', 44) + "\n" + new string('0', 44);
        var analyzer = CreateAnalyzer(Extraction(documentType: "passport", mrz: mrz));

        var result = (IdentityDocumentResult)await analyzer.AnalyzeAsync(
            Payload(), OneImage(), CancellationToken.None);

        result.DocumentType.Should().Be(DocumentType.Passport);
        result.MrzChecksumValid.Should().BeTrue();
        result.RequiresManualReview.Should().BeFalse();
    }

    [Fact]
    public async Task FlagsReview_WhenMrzChecksumFails()
    {
        // Line 2's composite check digit (position 43) is wrong, so validation fails.
        var badLine2 = new string('0', 43) + "5";
        var mrz = new string('0', 44) + "\n" + badLine2;
        var analyzer = CreateAnalyzer(Extraction(documentType: "passport", mrz: mrz));

        var result = (IdentityDocumentResult)await analyzer.AnalyzeAsync(
            Payload(), OneImage(), CancellationToken.None);

        result.MrzChecksumValid.Should().BeFalse();
        result.RequiresManualReview.Should().BeTrue();
        result.ReviewReasons.Should().Contain(r => r.Contains("MRZ"));
    }

    private sealed class FakeVision(string extractionJson) : IClaudeVisionClient
    {
        public Task<ClaudeVisionResponse> ExtractAsync(ClaudeVisionRequest request, CancellationToken cancellationToken)
            => Task.FromResult(new ClaudeVisionResponse(
                JsonSerializer.Deserialize<JsonElement>(extractionJson), 100, 40));
    }
}
