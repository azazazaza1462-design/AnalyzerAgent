using Lendlogic.Analyzers.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Lendlogic.Analyzers.DataAccess.Configs;

public class JobResultConfiguration : BaseEntityConfiguration<JobResult>
{
    public override void Configure(EntityTypeBuilder<JobResult> builder)
    {
        base.Configure(builder);

        builder.Property(e => e.JobId).IsRequired();
        builder.Property(e => e.ResultData).HasColumnType("jsonb");
        builder.Property(e => e.Status).IsRequired().HasConversion<string>().HasMaxLength(50);

        builder.HasOne(e => e.Job)
            .WithMany(j => j.Results)
            .HasForeignKey(e => e.JobId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.JobId);
    }
}
