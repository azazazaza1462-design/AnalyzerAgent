using Lendlogic.AnalyzersApi.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Lendlogic.AnalyzersApi.Data.Configs;

public class JobConfiguration : BaseEntityConfiguration<Job>
{
    public override void Configure(EntityTypeBuilder<Job> builder)
    {
        base.Configure(builder);

        builder.Property(e => e.CallerId).IsRequired();
        builder.Property(e => e.JobType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.JobStatus).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.MachineId).HasMaxLength(200);
        builder.Property(e => e.StartedAt);
        builder.Property(e => e.FinishedAt);
        builder.Property(e => e.Content).HasColumnType("jsonb");
        builder.Property(e => e.Attachments).HasColumnType("uuid[]").IsRequired();

        builder.HasOne(e => e.Caller)
            .WithMany()
            .HasForeignKey(e => e.CallerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => new { e.CallerId, e.JobStatus });
        builder.HasIndex(e => e.JobStatus);
    }
}
