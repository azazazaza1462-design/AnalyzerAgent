using System.Text.Json;
using Lendlogic.Analyzers.DataAccess.Enums;

namespace Lendlogic.AnalyzersApi.Features.Jobs;

public sealed record CreateJobResponse(Guid JobId);

public sealed record ClaimedJob(
    Guid JobId,
    JobType JobType,
    JsonElement? Content,
    Guid[] Attachments);

public sealed record ClaimJobResult(ClaimedJob? Job);

public sealed record JobCompletedResponse(Guid JobId, Guid ResultId);

public sealed record JobSummary(
    Guid Id,
    JobType JobType,
    JobStatus JobStatus,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? StartedAt,
    DateTime? FinishedAt);

public sealed record JobDetail(
    Guid Id,
    JobType JobType,
    JobStatus JobStatus,
    string CallerName,
    string? MachineId,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? StartedAt,
    DateTime? FinishedAt,
    JsonElement? Content,
    Guid[] Attachments,
    bool HasResult);

public sealed record PagedJobs(
    JobSummary[] Items,
    int Total,
    int Page,
    int PageSize);

public sealed record JobResultDownload(
    byte[] Content,
    string ContentType,
    string FileName);
