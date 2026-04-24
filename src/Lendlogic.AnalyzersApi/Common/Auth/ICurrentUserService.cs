namespace Lendlogic.AnalyzersApi.Common.Auth;

public interface ICurrentUserService
{
    bool IsAuthenticated { get; }
    Guid? UserId { get; }
    string? Email { get; }
    string? FullName { get; }
    string? AzureId { get; }
}
