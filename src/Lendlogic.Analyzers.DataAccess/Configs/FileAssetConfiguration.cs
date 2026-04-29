using Lendlogic.Analyzers.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Lendlogic.Analyzers.DataAccess.Configs;

public class FileAssetConfiguration : BaseEntityConfiguration<FileAsset>
{
    public override void Configure(EntityTypeBuilder<FileAsset> builder)
    {
        base.Configure(builder);

        builder.Property(e => e.FileName).IsRequired().HasMaxLength(260);
        builder.Property(e => e.ContentType).IsRequired().HasMaxLength(100);
        builder.Property(e => e.StoragePath).IsRequired().HasMaxLength(500);
        builder.Property(e => e.SizeBytes).IsRequired();
    }
}
