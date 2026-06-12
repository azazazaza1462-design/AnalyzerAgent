using Lendlogic.Agent.Core.Contracts;
using Lendlogic.Analyzers.DataAccess.Enums;

namespace Lendlogic.Agent.Core.Analysis;

/// <summary>
/// A document analyzer for one <see cref="JobType"/>. The worker dispatches a
/// claimed job to the analyzer whose <see cref="JobType"/> matches, then
/// persists the returned result as the job's <c>result_data</c>.
/// The result is returned as <see cref="object"/> because each analyzer emits
/// its own result DTO (ID → <see cref="IdValidationResult"/>); the worker
/// serializes it with the shared result options.
/// </summary>
public interface IDocumentAnalyzer
{
    JobType JobType { get; }

    Task<object> AnalyzeAsync(
        AnalyzerMessagePayload payload,
        IReadOnlyList<AnalyzerFile> files,
        CancellationToken cancellationToken);
}
