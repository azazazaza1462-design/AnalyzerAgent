using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Auth.Me;

public sealed record MeQuery : IQuery<ErrorOr<MeResponse>>;

public sealed record MeResponse(
    Guid UserId,
    string Email,
    string FullName,
    string AzureId);
