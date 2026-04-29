using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Get;

public sealed record GetJobQuery(Guid Id) : IQuery<ErrorOr<JobDetail>>;
