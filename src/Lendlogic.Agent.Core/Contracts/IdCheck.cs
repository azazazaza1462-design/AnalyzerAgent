namespace Lendlogic.Agent.Core.Contracts;

/// <summary>Outcome of a single validation check.</summary>
public enum CheckStatus
{
    Pass,
    Borderline,
    Fail,

    /// <summary>The check could not run (e.g. no MRZ present on the document).</summary>
    NotApplicable,
}

/// <summary>
/// One validation check run in step 4 (authenticity/verification) or step 5
/// (cross-check vs LOS): expiry, mrz_checksum, field_consistency,
/// authenticity, name_match, dob_match.
/// </summary>
public sealed record IdCheck
{
    /// <summary>Stable check id, e.g. "expiry", "mrz_checksum", "name_match".</summary>
    public required string Name { get; init; }

    public required CheckStatus Status { get; init; }

    /// <summary>Human-readable explanation of the outcome.</summary>
    public string? Detail { get; init; }
}
