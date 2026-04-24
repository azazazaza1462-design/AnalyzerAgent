using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Auth.Exchange;

public sealed record ExchangeCommand(string EntraToken) : ICommand<ErrorOr<ExchangeResult>>;

public sealed record ExchangeResult(
    Guid UserId,
    string Email,
    string FullName,
    string AzureId,
    string AccessToken,
    string RefreshToken,
    DateTime SessionStartedAt,
    DateTime SessionExpiresAt,
    TimeSpan AccessTokenLifetime,
    TimeSpan RefreshTokenLifetime);

public sealed record ExchangeResponse(
    Guid UserId,
    string Email,
    string FullName,
    string AzureId,
    DateTime SessionExpiresAt);

public sealed record RefreshResponse(DateTime SessionExpiresAt);
