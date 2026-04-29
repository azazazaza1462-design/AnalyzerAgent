using System.Text.Json;
using ErrorOr;
using Lendlogic.Analyzers.DataAccess.Enums;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Create;

public sealed record CreateJobCommand(
    string Caller,
    JobType JobType,
    JsonElement? Content,
    Guid[]? Attachments) : ICommand<ErrorOr<CreateJobResponse>>;
