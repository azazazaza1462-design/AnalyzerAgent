using Lendlogic.Agent.Core.Contracts;

namespace Lendlogic.Agent.Core.Eligibility;

/// <summary>
/// Deterministic stand-in for the trained eligibility model. Produces a 0..1
/// score from the emitted features with transparent per-feature contributions,
/// so the UI and downstream wiring work today. Replace with the real model
/// endpoint without touching callers.
/// </summary>
public sealed class StubEligibilityModelClient : IEligibilityModelClient
{
    public Task<EligibilityAssessment> ScoreAsync(
        EligibilityFeatures features,
        CancellationToken cancellationToken)
    {
        var contributions = new List<FeatureContribution>
        {
            new("identity_verified", features.IdentityVerified ? 0.35 : 0.0),
            new("document_valid", features.DocumentExpired ? -0.25 : 0.15),
            new("name_match", Math.Round(features.NameMatchScore * 0.20, 3)),
            new("dob_match", Math.Round(features.DobMatchScore * 0.20, 3)),
            new("authenticity", Math.Round(features.AuthenticityScore * 0.30, 3)),
        };

        var score = Math.Clamp(contributions.Sum(c => c.Contribution), 0, 1);

        var verdict = score >= 0.80 ? EligibilityVerdict.Eligible
            : score >= 0.50 ? EligibilityVerdict.Conditional
            : EligibilityVerdict.Ineligible;

        return Task.FromResult(new EligibilityAssessment
        {
            Score = Math.Round(score, 3),
            Verdict = verdict,
            ModelVersion = "stub-v1",
            Contributions = contributions,
        });
    }
}
