using System.Text;
using ErrorOr;
using Lendlogic.Analyzers.DataAccess;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Download;

public sealed class GetJobResultHandler(ApplicationDbContext db)
    : IQueryHandler<GetJobResultQuery, ErrorOr<JobResultDownload>>
{
    public async ValueTask<ErrorOr<JobResultDownload>> Handle(
        GetJobResultQuery query, CancellationToken cancellationToken)
    {
        var jobExists = await db.Jobs
            .AsNoTracking()
            .AnyAsync(j => j.Id == query.JobId, cancellationToken);

        if (!jobExists)
            return Error.NotFound("Job.NotFound", $"Job '{query.JobId}' does not exist.");

        var result = await db.JobResults
            .AsNoTracking()
            .Where(r => r.JobId == query.JobId)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (result?.ResultData is null)
            return Error.NotFound("JobResult.NotFound", $"Job '{query.JobId}' has no result available.");

        var bytes = Encoding.UTF8.GetBytes(result.ResultData.RootElement.GetRawText());

        return new JobResultDownload(
            bytes,
            "application/json",
            $"job-{query.JobId}.json");
    }
}
