using ErrorOr;
using Lendlogic.AnalyzersApi.Common.Auth;
using Lendlogic.Analyzers.DataAccess;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Auth.Me;

public sealed class MeHandler(ApplicationDbContext db, ICurrentUserService currentUser)
    : IQueryHandler<MeQuery, ErrorOr<MeResponse>>
{
    public async ValueTask<ErrorOr<MeResponse>> Handle(
        MeQuery query, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Error.Unauthorized("Auth.NotAuthenticated", "User is not authenticated.");

        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Id == currentUser.UserId, cancellationToken);

        if (user is null)
            return Error.Unauthorized("Auth.UserNotFound", "Authenticated user no longer exists.");

        return new MeResponse(user.Id, user.Email, user.FullName, user.AzureId);
    }
}
