using ErrorOr;
using Lendlogic.AnalyzersApi.Common.Auth;
using Lendlogic.Analyzers.DataAccess;
using Lendlogic.Analyzers.DataAccess.Entities;
using Mediator;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Lendlogic.AnalyzersApi.Features.Auth.Exchange;

public sealed class ExchangeHandler(
    ApplicationDbContext db,
    IEntraTokenValidator entraValidator,
    IInternalJwtService jwtService,
    IOptions<JwtOptions> jwtOptions)
    : ICommandHandler<ExchangeCommand, ErrorOr<ExchangeResult>>
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public async ValueTask<ErrorOr<ExchangeResult>> Handle(
        ExchangeCommand command, CancellationToken cancellationToken)
    {
        var principal = await entraValidator.ValidateAsync(command.EntraToken, cancellationToken);
        if (principal is null)
            return Error.Unauthorized("Auth.InvalidToken", "Entra ID token is invalid or expired.");

        var azureId = principal.FindFirst("oid")?.Value;
        var email = principal.FindFirst("preferred_username")?.Value
            ?? principal.FindFirst("email")?.Value;
        var fullName = principal.FindFirst("name")?.Value ?? email;

        if (string.IsNullOrWhiteSpace(azureId) || string.IsNullOrWhiteSpace(email))
            return Error.Unauthorized("Auth.MissingClaims", "Entra ID token is missing required claims.");

        var user = await db.Users.FirstOrDefaultAsync(u => u.AzureId == azureId, cancellationToken)
            ?? await db.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                AzureId = azureId,
                Email = email,
                FullName = fullName ?? email,
            };
            db.Users.Add(user);
        }
        else
        {
            user.AzureId = azureId;
            user.Email = email;
            user.FullName = fullName ?? email;
        }

        user.LastLoginAt = DateTime.UtcNow;

        var sessionStartedAt = DateTime.UtcNow;
        var accessLifetime = TimeSpan.FromMinutes(_jwtOptions.AccessTokenLifetimeMinutes);
        var refreshLifetime = TimeSpan.FromDays(_jwtOptions.RefreshTokenLifetimeDays);

        var accessToken = jwtService.CreateAccessToken(user, sessionStartedAt);
        var rawRefreshToken = jwtService.CreateRefreshToken();
        var refreshHash = jwtService.HashRefreshToken(rawRefreshToken);

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = DateTime.UtcNow.Add(refreshLifetime),
            SessionStartedAt = sessionStartedAt,
        });

        await db.SaveChangesAsync(cancellationToken);

        return new ExchangeResult(
            user.Id,
            user.Email,
            user.FullName,
            user.AzureId,
            accessToken,
            rawRefreshToken,
            sessionStartedAt,
            sessionStartedAt.AddHours(_jwtOptions.MaxSessionHours),
            accessLifetime,
            refreshLifetime);
    }
}
