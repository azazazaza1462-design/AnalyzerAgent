using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Cancel;

public sealed record CancelJobCommand(Guid JobId) : ICommand<ErrorOr<Success>>;
