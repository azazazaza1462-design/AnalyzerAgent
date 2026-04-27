using System.Text.Json;
using ErrorOr;
using Lendlogic.AnalyzersApi.Data;
using Lendlogic.AnalyzersApi.Data.Entities;
using Lendlogic.AnalyzersApi.Data.Enums;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Fail;

public sealed class FailJobHandler(ApplicationDbContext db)
    : ICommandHandler<FailJobCommand, ErrorOr<JobCompletedResponse>>
{
    public async ValueTask<ErrorOr<JobCompletedResponse>> Handle(
        FailJobCommand command, CancellationToken cancellationToken)
    {
        var job = await db.Jobs
            .FirstOrDefaultAsync(j => j.Id == command.JobId, cancellationToken);

        if (job is null)
            return Error.NotFound("Job.NotFound", $"Job '{command.JobId}' does not exist.");

        if (job.JobStatus != JobStatus.InProgress)
            return Error.Conflict(
                "Job.InvalidTransition",
                $"Job is in {job.JobStatus} state and cannot be failed.");

        JsonDocument? errorDoc = null;
        if (!string.IsNullOrWhiteSpace(command.Error))
        {
            errorDoc = JsonDocument.Parse(JsonSerializer.Serialize(new { error = command.Error }));
        }

        var result = new JobResult
        {
            JobId = job.Id,
            ResultData = errorDoc,
            Status = ResultStatus.Failure,
        };

        job.JobStatus = JobStatus.Failed;
        job.FinishedAt = DateTime.UtcNow;

        db.JobResults.Add(result);
        await db.SaveChangesAsync(cancellationToken);

        return new JobCompletedResponse(job.Id, result.Id);
    }
}
