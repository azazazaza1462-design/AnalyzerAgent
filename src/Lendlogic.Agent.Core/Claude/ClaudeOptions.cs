namespace Lendlogic.Agent.Core.Claude;

/// <summary>
/// Configuration for the Claude vision client (bound from the "Claude" config
/// section). The API key is a secret — provide it via user-secrets or
/// environment variables, never in committed appsettings.
/// </summary>
public sealed class ClaudeOptions
{
    public const string SectionName = "Claude";

    public string ApiKey { get; set; } = "";

    /// <summary>Model id, e.g. "claude-sonnet-4-6".</summary>
    public string Model { get; set; } = "claude-sonnet-4-6";

    /// <summary>SDK automatic retry count for 429/5xx/overloaded.</summary>
    public int MaxRetries { get; set; } = 3;

    public int MaxTokens { get; set; } = 2048;

    /// <summary>
    /// Extractions whose overall confidence falls below this are flagged for a
    /// human. A business risk control, not a model setting.
    /// </summary>
    public decimal ManualReviewConfidenceThreshold { get; set; } = 0.85m;

    /// <summary>True when an API key is configured; the analyzer requires this to run.</summary>
    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}
