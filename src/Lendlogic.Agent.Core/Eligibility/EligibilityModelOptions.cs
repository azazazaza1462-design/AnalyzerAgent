namespace Lendlogic.Agent.Core.Eligibility;

/// <summary>
/// Selects the eligibility model implementation. "stub" uses the deterministic
/// <see cref="StubEligibilityModelClient"/>; "http" calls the trained model's
/// HTTP endpoint via <see cref="HttpEligibilityModelClient"/>.
/// </summary>
public sealed class EligibilityModelOptions
{
    public const string SectionName = "Eligibility";

    /// <summary>"stub" (default) or "http".</summary>
    public string Mode { get; set; } = "stub";

    /// <summary>Full URL of the trained model's scoring endpoint (when Mode = http).</summary>
    public string? Endpoint { get; set; }

    /// <summary>Optional API key sent as X-Api-Key to the model endpoint.</summary>
    public string? ApiKey { get; set; }
}
