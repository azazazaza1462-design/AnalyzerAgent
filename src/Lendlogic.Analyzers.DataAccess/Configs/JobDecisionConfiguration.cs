using Lendlogic.Analyzers.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Lendlogic.Analyzers.DataAccess.Configs;

public class JobDecisionConfiguration : BaseEntityConfiguration<JobDecision>
{
    public override void Configure(EntityTypeBuilder<JobDecision> builder)
    {
        base.Configure(builder);

        builder.Property(e => e.JobId).IsRequired();
        builder.Property(e => e.Outcome).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.ReviewedBy).HasMaxLength(200);
        builder.Property(e => e.Note).HasMaxLength(2000);

        builder.HasOne(e => e.Job)
            .WithMany()
            .HasForeignKey(e => e.JobId)
            .OnDelete(DeleteBehavior.Cascade);

        // One decision per job (the latest label).
        builder.HasIndex(e => e.JobId).IsUnique();
    }
}
