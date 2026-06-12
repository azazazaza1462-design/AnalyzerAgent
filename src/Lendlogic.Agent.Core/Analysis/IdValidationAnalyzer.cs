using Lendlogic.Agent.Core.Contracts;
using Lendlogic.Analyzers.DataAccess.Enums;

namespace Lendlogic.Agent.Core.Analysis;

/// <summary>
/// Phase 1 skeleton. Returns a canned result so the
/// LOS → API → bus → agent → job_results loop can be exercised end-to-end
/// before Claude vision is wired. In Phase 2 the body is replaced by the six
/// pipeline steps (ingest, classify, extract, authenticity, cross-check,
/// eligibility features), each recorded as an <see cref="AnalyzerCall"/>.
/// </summary>
public sealed class IdValidationAnalyzer : IDocumentAnalyzer
{
    public JobType JobType => JobType.IdValidation;

    public Task<object> AnalyzeAsync(
        AnalyzerMessagePayload payload,
        IReadOnlyList<AnalyzerFile> files,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var result = new IdValidationResult
        {
            Fields = new IdFields
            {
                FullName = payload.LosData?.FullName,
                DateOfBirth = payload.LosData?.DateOfBirth,
                DocumentKind = "unknown",
            },
            Checks =
            [
                new IdCheck
                {
                    Name = "skeleton",
                    Status = CheckStatus.NotApplicable,
                    Detail = "Canned Phase 1 result — Claude vision not yet wired.",
                },
            ],
            Verdict = IdVerdict.NeedsReview,
            Confidence = 0,
            Calls =
            [
                new AnalyzerCall
                {
                    Step = "ingest",
                    Label = "Ingest + document-type & image-quality detection",
                    DurationMs = 0,
                    Success = true,
                    Error = null,
                },
            ],
        };

        return Task.FromResult<object>(result);
    }
}
