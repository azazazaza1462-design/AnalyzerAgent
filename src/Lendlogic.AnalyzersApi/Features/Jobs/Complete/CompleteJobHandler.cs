using System.Text.Json;
using ErrorOr;
using Lendlogic.Analyzers.DataAccess;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.Analyzers.DataAccess.Enums;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Complete;

public sealed class CompleteJobHandler(ApplicationDbContext db)
    : ICommandHandler<CompleteJobCommand, ErrorOr<JobCompletedResponse>>
{
    public async ValueTask<ErrorOr<JobCompletedResponse>> Handle(
        CompleteJobCommand command, CancellationToken cancellationToken)
    {
        var job = await db.Jobs
            .FirstOrDefaultAsync(j => j.Id == command.JobId, cancellationToken);

        if (job is null)
            return Error.NotFound("Job.NotFound", $"Job '{command.JobId}' does not exist.");

        if (job.JobStatus != JobStatus.InProgress)
            return Error.Conflict(
                "Job.InvalidTransition",
                $"Job is in {job.JobStatus} state and cannot be completed.");

        JsonDocument? resultDoc = null;
        if (command.ResultData is { } element &&
            element.ValueKind != JsonValueKind.Null &&
            element.ValueKind != JsonValueKind.Undefined)
        {
            resultDoc = JsonDocument.Parse(element.GetRawText());
        }

        var result = new JobResult
        {
            JobId = job.Id,
            ResultData = resultDoc,
            Status = ResultStatus.Success,
        };

        job.JobStatus = JobStatus.Completed;
        job.FinishedAt = DateTime.UtcNow;

        db.JobResults.Add(result);
        await db.SaveChangesAsync(cancellationToken);

        return new JobCompletedResponse(job.Id, result.Id);
    }
}
