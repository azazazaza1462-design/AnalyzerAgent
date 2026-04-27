using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Fail;

public sealed record FailJobCommand(
    Guid JobId,
    string? Error) : ICommand<ErrorOr<JobCompletedResponse>>;
