using System.Text.Json;
using ErrorOr;
using Lendlogic.Analyzers.DataAccess;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.Analyzers.DataAccess.Enums;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Claim;

public sealed class ClaimJobHandler(ApplicationDbContext db)
    : ICommandHandler<ClaimJobCommand, ErrorOr<ClaimJobResult>>
{
    public async ValueTask<ErrorOr<ClaimJobResult>> Handle(
        ClaimJobCommand command, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database
            .BeginTransactionAsync(cancellationToken);

        var pendingStatus = JobStatus.Pending.ToString();

        var job = await db.Jobs
            .FromSqlRaw(
                """
                SELECT id, caller_id, job_type, job_status, machine_id,
                       started_at, finished_at, content, attachments,
                       created_at, updated_at, xmin
                FROM app.jobs
                WHERE job_status = {0}
                ORDER BY created_at
                LIMIT 1
                FOR UPDATE SKIP LOCKED
                """,
                pendingStatus)
            .AsTracking()
            .FirstOrDefaultAsync(cancellationToken);

        if (job is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new ClaimJobResult(null);
        }

        job.JobStatus = JobStatus.InProgress;
        job.MachineId = command.MachineId;
        job.StartedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        JsonElement? content = null;
        if (job.Content is not null)
        {
            content = JsonDocument.Parse(job.Content.RootElement.GetRawText()).RootElement;
        }

        return new ClaimJobResult(new ClaimedJob(job.Id, job.JobType, content, job.Attachments));
    }
}
