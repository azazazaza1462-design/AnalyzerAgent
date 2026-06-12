namespace Lendlogic.Agent.Core.Contracts;

/// <summary>Overall conclusion of the ID validation run.</summary>
public enum IdVerdict
{
    Verified,
    NeedsReview,
    Rejected,
}

/// <summary>
/// The agent's ID analysis result, persisted as the JSONB
/// <see cref="Lendlogic.Analyzers.DataAccess.Entities.JobResult.ResultData"/>.
/// Carries the extracted fields, the validation checks, the verdict, and the
/// per-step call telemetry the UI renders as the run timeline.
/// </summary>
public sealed record IdValidationResult
{
    public required IdFields Fields { get; init; }

    public IReadOnlyList<IdCheck> Checks { get; init; } = [];

    public required IdVerdict Verdict { get; init; }

    /// <summary>Overall confidence in the verdict, 0..1.</summary>
    public double Confidence { get; init; }

    /// <summary>The six pipeline steps the agent executed, in order.</summary>
    public IReadOnlyList<AnalyzerCall> Calls { get; init; } = [];
}
