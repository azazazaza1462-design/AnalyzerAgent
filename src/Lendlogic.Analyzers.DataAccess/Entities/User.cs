namespace Lendlogic.Analyzers.DataAccess.Entities;

public class User : BaseEntity
{
    public required string AzureId { get; set; }
    public required string Email { get; set; }
    public required string FullName { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
