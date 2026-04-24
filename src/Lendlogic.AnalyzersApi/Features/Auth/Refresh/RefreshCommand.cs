using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Auth.Refresh;

public sealed record RefreshCommand(string RefreshToken) : ICommand<ErrorOr<RefreshResult>>;

public sealed record RefreshResult(
    string AccessToken,
    string RefreshToken,
    DateTime SessionExpiresAt,
    TimeSpan AccessTokenLifetime,
    TimeSpan RefreshTokenLifetime);
