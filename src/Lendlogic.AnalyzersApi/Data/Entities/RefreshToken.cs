namespace Lendlogic.AnalyzersApi.Data.Entities;

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public required string TokenHash { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime SessionStartedAt { get; set; }
    public DateTime? RevokedAt { get; set; }

    public User User { get; set; } = null!;

    public bool IsActive => RevokedAt is null && ExpiresAt > DateTime.UtcNow;
}
