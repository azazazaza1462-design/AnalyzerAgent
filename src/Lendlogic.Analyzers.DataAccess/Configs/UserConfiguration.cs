using Lendlogic.Analyzers.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Lendlogic.Analyzers.DataAccess.Configs;

public class UserConfiguration : BaseEntityConfiguration<User>
{
    public override void Configure(EntityTypeBuilder<User> builder)
    {
        base.Configure(builder);

        builder.Property(e => e.AzureId).IsRequired().HasMaxLength(100);
        builder.Property(e => e.Email).IsRequired().HasMaxLength(256);
        builder.Property(e => e.FullName).IsRequired().HasMaxLength(200);
        builder.Property(e => e.LastLoginAt);

        builder.HasIndex(e => e.AzureId).IsUnique();
        builder.HasIndex(e => e.Email).IsUnique();
    }
}
