namespace Lendlogic.Agent.Core.Contracts;

/// <summary>
/// The agent's ID analysis result, persisted as the JSONB
/// <see cref="Lendlogic.Analyzers.DataAccess.Entities.JobResult.ResultData"/>.
/// A flat, single-pass extraction (Claude vision) verified by the deterministic
/// MRZ checksum, with a manual-review gate for downstream automation.
/// Dates are kept as ISO 8601 strings (yyyy-MM-dd) so an unparseable value is
/// preserved verbatim rather than dropped.
/// </summary>
public sealed record IdentityDocumentResult
{
    public DocumentType DocumentType { get; init; }
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? DateOfBirth { get; init; }
    public string? DocumentNumber { get; init; }
    public string? Nationality { get; init; }
    public string? IssuingCountry { get; init; }
    public string? DateOfExpiry { get; init; }
    public string? Sex { get; init; }

    /// <summary>Raw machine-readable zone text, if the document had one.</summary>
    public string? MachineReadableZone { get; init; }

    /// <summary>Model's free-text note on anything unreadable or uncertain.
    /// Informational only — it does not by itself force manual review.</summary>
    public string? LegibilityNotes { get; init; }

    /// <summary>Every captured field keyed by name, with a confidence estimate.</summary>
    public IReadOnlyDictionary<string, FieldValue> RawFields { get; init; }
        = new Dictionary<string, FieldValue>();

    /// <summary>Model's overall confidence in the extraction, 0.0–1.0.</summary>
    public decimal OverallConfidence { get; init; }

    /// <summary>True when MRZ check digits were present and all validated; false
    /// when present but failing; null when the document has no MRZ.</summary>
    public bool? MrzChecksumValid { get; init; }

    /// <summary>Human-readable reasons the result was flagged (empty if clean).</summary>
    public IReadOnlyList<string> ReviewReasons { get; init; } = [];

    /// <summary>
    /// Gate for downstream automation. When true, do NOT auto-accept — route to a person.
    /// </summary>
    public bool RequiresManualReview { get; init; }
}
