using Lendlogic.Agent.Core.Contracts;

namespace Lendlogic.Agent.Core.Eligibility;

/// <summary>
/// Client for the external eligibility ML model. Today this is a stub
/// (<see cref="StubEligibilityModelClient"/>); swap the implementation for the
/// real trained-model HTTP endpoint when it exists — callers don't change.
/// </summary>
public interface IEligibilityModelClient
{
    Task<EligibilityAssessment> ScoreAsync(
        EligibilityFeatures features,
        CancellationToken cancellationToken);
}
