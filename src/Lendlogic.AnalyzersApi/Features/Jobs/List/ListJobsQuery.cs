using ErrorOr;
using Lendlogic.Analyzers.DataAccess.Enums;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Jobs.List;

public sealed record ListJobsQuery(
    JobStatus? Status,
    DateTime? From,
    DateTime? To,
    int Page,
    int PageSize) : IQuery<ErrorOr<PagedJobs>>;
