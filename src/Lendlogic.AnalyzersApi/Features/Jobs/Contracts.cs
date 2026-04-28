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
