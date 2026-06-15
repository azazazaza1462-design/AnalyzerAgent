namespace Lendlogic.Agent.Core.Contracts;

/// <summary>
/// Features the agent emits in step 6 for the external eligibility ML model
/// (integrated via IEligibilityModelClient — a stub until the trained endpoint
/// exists). For the ID vertical these capture identity, expiry, and match
/// signals; the bank-statement and credit-report analyzers will contribute
/// their own features to the same model.
/// </summary>
public sealed record EligibilityFeatures
{
    public bool IdentityVerified { get; init; }
    public bool DocumentExpired { get; init; }

    /// <summary>How well the ID name matches the LOS applicant, 0..1.</summary>
    public double NameMatchScore { get; init; }

    /// <summary>How well the ID date of birth matches the LOS applicant, 0..1.</summary>
    public double DobMatchScore { get; init; }

    /// <summary>
    /// Face-match score, 0..1. Null until a biometric service + reference
    /// selfie are integrated (deferred from the MVP).
    /// </summary>
    public double? FaceMatchScore { get; init; }

    /// <summary>Best-effort document authenticity score from vision, 0..1.</summary>
    public double AuthenticityScore { get; init; }
}
