using Lendlogic.Analyzers.DataAccess.Entities;

namespace Lendlogic.AnalyzersApi.Common.Auth;

public interface IInternalJwtService
{
    string CreateAccessToken(User user, DateTime sessionStartedAt);
    string CreateRefreshToken();
    string HashRefreshToken(string rawToken);
}
