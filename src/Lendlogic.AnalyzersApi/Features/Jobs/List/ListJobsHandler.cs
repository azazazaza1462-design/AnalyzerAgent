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

        if (query.From.HasValue)
            jobs = jobs.Where(j => j.CreatedAt >= query.From.Value);

        if (query.To.HasValue)
            jobs = jobs.Where(j => j.CreatedAt <= query.To.Value);

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
