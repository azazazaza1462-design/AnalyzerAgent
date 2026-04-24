using System.Security.Claims;

namespace Lendlogic.AnalyzersApi.Common.Auth;

public interface IEntraTokenValidator
{
    Task<ClaimsPrincipal?> ValidateAsync(string token, CancellationToken cancellationToken = default);
}
