using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Download;

public sealed record GetJobResultQuery(Guid JobId) : IQuery<ErrorOr<JobResultDownload>>;
