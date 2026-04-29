using ErrorOr;
using Lendlogic.AnalyzersApi.Common.Auth;
using Lendlogic.Analyzers.DataAccess;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Auth.Logout;

public sealed class LogoutHandler(ApplicationDbContext db, IInternalJwtService jwtService)
    : ICommandHandler<LogoutCommand, ErrorOr<Success>>
{
    public async ValueTask<ErrorOr<Success>> Handle(
        LogoutCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken))
            return Result.Success;

        var hash = jwtService.HashRefreshToken(command.RefreshToken);

        var token = await db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == hash, cancellationToken);

        if (token is not null && token.RevokedAt is null)
        {
            token.RevokedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        return Result.Success;
    }
}
