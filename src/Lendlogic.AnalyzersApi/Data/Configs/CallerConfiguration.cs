using Lendlogic.AnalyzersApi.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Lendlogic.AnalyzersApi.Data.Configs;

public class CallerConfiguration : BaseEntityConfiguration<Caller>
{
    public override void Configure(EntityTypeBuilder<Caller> builder)
    {
        base.Configure(builder);

        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.HasIndex(e => e.Name).IsUnique();
    }
}
