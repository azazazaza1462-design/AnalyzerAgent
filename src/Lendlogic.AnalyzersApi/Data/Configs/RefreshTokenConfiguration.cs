using Lendlogic.AnalyzersApi.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Lendlogic.AnalyzersApi.Data.Configs;

public class RefreshTokenConfiguration : BaseEntityConfiguration<RefreshToken>
{
    public override void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        base.Configure(builder);

        builder.Property(e => e.TokenHash).IsRequired().HasMaxLength(128);
        builder.Property(e => e.ExpiresAt).IsRequired();
        builder.Property(e => e.SessionStartedAt).IsRequired();
        builder.Property(e => e.RevokedAt);

        builder.HasOne(e => e.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.TokenHash).IsUnique();
        builder.HasIndex(e => e.UserId);
    }
}
