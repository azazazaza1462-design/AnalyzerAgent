namespace Lendlogic.Agent.Core.Contracts;

/// <summary>
/// One pipeline step the agent executed, surfaced to the UI run timeline.
/// The six analyzer steps each emit one of these (mirrors the per-call
/// telemetry of the bank-statement reference project), so the UI shows
/// exactly what the agent did, how long it took, and what it cost.
/// </summary>
public sealed record AnalyzerCall
{
    /// <summary>Stable step id, e.g. "ingest", "classify", "extract".</summary>
    public required string Step { get; init; }

    /// <summary>Human-readable step name for the UI.</summary>
    public required string Label { get; init; }

    /// <summary>Claude model used, or null for deterministic (non-LLM) steps.</summary>
    public string? Model { get; init; }

    public long DurationMs { get; init; }
    public int InputTokens { get; init; }
    public int OutputTokens { get; init; }

    public bool Success { get; init; } = true;
    public string? Error { get; init; }
}
