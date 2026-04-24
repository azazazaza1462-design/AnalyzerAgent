using ErrorOr;
using Lendlogic.AnalyzersApi.Common.Auth;
using Lendlogic.AnalyzersApi.Data;
using Lendlogic.AnalyzersApi.Data.Entities;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Lendlogic.AnalyzersApi.Features.Auth.Refresh;

public sealed class RefreshHandler(
    ApplicationDbContext db,
    IInternalJwtService jwtService,
    IOptions<JwtOptions> jwtOptions)
    : ICommandHandler<RefreshCommand, ErrorOr<RefreshResult>>
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public async ValueTask<ErrorOr<RefreshResult>> Handle(
        RefreshCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken))
            return Error.Unauthorized("Auth.MissingRefreshToken", "Refresh token is required.");

        var incomingHash = jwtService.HashRefreshToken(command.RefreshToken);

        var existing = await db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == incomingHash, cancellationToken);

        if (existing is null || !existing.IsActive)
            return Error.Unauthorized("Auth.InvalidRefreshToken", "Refresh token is invalid or expired.");

        var maxSessionDuration = TimeSpan.FromHours(_jwtOptions.MaxSessionHours);
        if (DateTime.UtcNow - existing.SessionStartedAt > maxSessionDuration)
        {
            existing.RevokedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            return Error.Unauthorized("Auth.SessionExpired", "Session has exceeded its maximum duration.");
        }

        existing.RevokedAt = DateTime.UtcNow;

        var accessLifetime = TimeSpan.FromMinutes(_jwtOptions.AccessTokenLifetimeMinutes);
        var refreshLifetime = TimeSpan.FromDays(_jwtOptions.RefreshTokenLifetimeDays);

        var accessToken = jwtService.CreateAccessToken(existing.User, existing.SessionStartedAt);
        var rawRefreshToken = jwtService.CreateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = existing.UserId,
            TokenHash = jwtService.HashRefreshToken(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.Add(refreshLifetime),
            SessionStartedAt = existing.SessionStartedAt,
        });

        await db.SaveChangesAsync(cancellationToken);

        return new RefreshResult(
            accessToken,
            rawRefreshToken,
            existing.SessionStartedAt.AddHours(_jwtOptions.MaxSessionHours),
            accessLifetime,
            refreshLifetime);
    }
}
