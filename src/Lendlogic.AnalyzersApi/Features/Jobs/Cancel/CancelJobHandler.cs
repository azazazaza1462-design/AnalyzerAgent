using ErrorOr;
using Lendlogic.Analyzers.DataAccess;
using Lendlogic.Analyzers.DataAccess.Enums;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Cancel;

public sealed class CancelJobHandler(ApplicationDbContext db)
    : ICommandHandler<CancelJobCommand, ErrorOr<Success>>
{
    public async ValueTask<ErrorOr<Success>> Handle(
        CancelJobCommand command, CancellationToken cancellationToken)
    {
        var job = await db.Jobs
            .FirstOrDefaultAsync(j => j.Id == command.JobId, cancellationToken);

        if (job is null)
            return Error.NotFound("Job.NotFound", $"Job '{command.JobId}' does not exist.");

        if (job.JobStatus is JobStatus.Completed or JobStatus.Failed or JobStatus.Cancelled)
            return Error.Conflict(
                "Job.InvalidTransition",
                $"Job is in {job.JobStatus} state and cannot be cancelled.");

        job.JobStatus = JobStatus.Cancelled;
        job.FinishedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return Result.Success;
    }
}
