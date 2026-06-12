namespace Lendlogic.Agent.Core.Contracts;

/// <summary>Overall eligibility conclusion from the ML model (stub for now).</summary>
public enum EligibilityVerdict
{
    Eligible,
    Conditional,
    Ineligible,
}

/// <summary>How one feature moved the eligibility score (signed).</summary>
public sealed record FeatureContribution(string Feature, double Contribution);

/// <summary>
/// The eligibility model's output for one applicant: a 0..1 score, a verdict,
/// and per-feature contributions. Produced by <see cref="EligibilityFeatures"/>
/// fed to the (stubbed) external model; persisted alongside the analyzer result.
/// </summary>
public sealed record EligibilityAssessment
{
    /// <summary>Eligibility probability, 0..1.</summary>
    public required double Score { get; init; }

    public required EligibilityVerdict Verdict { get; init; }

    public string ModelVersion { get; init; } = "stub-v1";

    public IReadOnlyList<FeatureContribution> Contributions { get; init; } = [];
}
