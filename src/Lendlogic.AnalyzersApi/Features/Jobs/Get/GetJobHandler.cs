using System.Text.Json;
using ErrorOr;
using Lendlogic.Analyzers.DataAccess;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Get;

public sealed class GetJobHandler(ApplicationDbContext db)
    : IQueryHandler<GetJobQuery, ErrorOr<JobDetail>>
{
    public async ValueTask<ErrorOr<JobDetail>> Handle(
        GetJobQuery query, CancellationToken cancellationToken)
    {
        var job = await db.Jobs
            .AsNoTracking()
            .Include(j => j.Caller)
            .FirstOrDefaultAsync(j => j.Id == query.Id, cancellationToken);

        if (job is null)
            return Error.NotFound("Job.NotFound", $"Job '{query.Id}' does not exist.");

        var hasResult = await db.JobResults
            .AsNoTracking()
            .AnyAsync(r => r.JobId == job.Id, cancellationToken);

        JsonElement? content = null;
        if (job.Content is not null)
        {
            content = JsonDocument.Parse(job.Content.RootElement.GetRawText()).RootElement;
        }

        return new JobDetail(
            job.Id,
            job.JobType,
            job.JobStatus,
            job.Caller.Name,
            job.MachineId,
            job.CreatedAt,
            job.UpdatedAt,
            job.StartedAt,
            job.FinishedAt,
            content,
            job.Attachments,
            hasResult);
    }
}
