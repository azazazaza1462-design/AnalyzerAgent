using Lendlogic.Analyzers.DataAccess.Enums;

namespace Lendlogic.Analyzers.DataAccess.Entities;

/// <summary>
/// A reviewer's ground-truth decision for a job (the training label). One per
/// job; paired with the job's emitted features it forms a labeled example for
/// training the eligibility model.
/// </summary>
public class JobDecision : BaseEntity
{
    public Guid JobId { get; set; }
    public DecisionOutcome Outcome { get; set; }
    public string? ReviewedBy { get; set; }
    public string? Note { get; set; }

    public Job Job { get; set; } = null!;
}
