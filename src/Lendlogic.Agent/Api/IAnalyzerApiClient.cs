using System.Text.Json;
using Lendlogic.Agent.Core.Analysis;
using Lendlogic.Analyzers.DataAccess.Enums;

namespace Lendlogic.Agent.Api;

/// <summary>
/// The agent's view of the Analyzers API: the job-lifecycle endpoints the worker
/// drives (claim → download files → complete/fail). Authenticated with the
/// agent API key (X-Api-Key header, configured on the typed HttpClient).
/// </summary>
public interface IAnalyzerApiClient
{
    /// <summary>Claims the next pending job, or null if the queue is empty.</summary>
    Task<ClaimedJobDto?> ClaimAsync(string machineId, CancellationToken cancellationToken);

    /// <summary>Downloads an attachment, or null if it no longer exists.</summary>
    Task<AnalyzerFile?> DownloadFileAsync(Guid fileId, CancellationToken cancellationToken);

    /// <summary>Reports a successful result; stored as the job's result_data.</summary>
    Task CompleteAsync(Guid jobId, object resultData, CancellationToken cancellationToken);

    /// <summary>Marks the job failed with an error message.</summary>
    Task FailAsync(Guid jobId, string error, CancellationToken cancellationToken);
}

/// <summary>Wire shape returned by <c>POST /jobs/claim</c> (mirrors the API's ClaimedJob).</summary>
public sealed record ClaimedJobDto(
    Guid JobId,
    JobType JobType,
    JsonElement? Content,
    Guid[] Attachments);
