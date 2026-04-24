using System.Security.Claims;

namespace Lendlogic.AnalyzersApi.Common.Auth;

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public Guid? UserId =>
        Guid.TryParse(Principal?.FindFirst(AuthConstants.Claims.UserId)?.Value, out var id)
            ? id
            : null;

    public string? Email => Principal?.FindFirst(AuthConstants.Claims.Email)?.Value;

    public string? FullName => Principal?.FindFirst(AuthConstants.Claims.Name)?.Value;

    public string? AzureId => Principal?.FindFirst(AuthConstants.Claims.AzureOid)?.Value;
}
