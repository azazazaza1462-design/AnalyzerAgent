using System.Text.Json;
using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Complete;

public sealed record CompleteJobCommand(
    Guid JobId,
    JsonElement? ResultData) : ICommand<ErrorOr<JobCompletedResponse>>;
