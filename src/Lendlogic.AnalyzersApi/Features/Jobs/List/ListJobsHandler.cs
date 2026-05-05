using ErrorOr;
using Lendlogic.Analyzers.DataAccess;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Jobs.List;

public sealed class ListJobsHandler(ApplicationDbContext db)
    : IQueryHandler<ListJobsQuery, ErrorOr<PagedJobs>>
{
    public async ValueTask<ErrorOr<PagedJobs>> Handle(
        ListJobsQuery query, CancellationToken cancellationToken)
    {
        var jobs = db.Jobs.AsNoTracking().AsQueryable();

        if (query.Status.HasValue)
            jobs = jobs.Where(j => j.JobStatus == query.Status.Value);

        // Inputs from <input type="date"> arrive as Kind=Unspecified, but
        // CreatedAt is stored as timestamptz, so Npgsql refuses anything but
        // UTC. Treat the incoming local-day boundaries as UTC.
        if (query.From.HasValue)
        {
            var from = DateTime.SpecifyKind(query.From.Value, DateTimeKind.Utc);
            jobs = jobs.Where(j => j.CreatedAt >= from);
        }

        if (query.To.HasValue)
        {
            var to = DateTime.SpecifyKind(query.To.Value, DateTimeKind.Utc);
            jobs = jobs.Where(j => j.CreatedAt <= to);
        }

        var total = await jobs.CountAsync(cancellationToken);

        var items = await jobs
            .OrderByDescending(j => j.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(j => new JobSummary(
                j.Id,
                j.JobType,
                j.JobStatus,
                j.CreatedAt,
                j.UpdatedAt,
                j.StartedAt,
                j.FinishedAt))
            .ToArrayAsync(cancellationToken);

        return new PagedJobs(items, total, query.Page, query.PageSize);
    }
}
