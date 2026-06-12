namespace Lendlogic.Agent.Core.Contracts;

/// <summary>
/// Fields extracted from an identity document (step 3). All nullable —
/// extraction is best-effort and a missing field is itself a signal.
/// Dates are ISO 8601 strings (yyyy-MM-dd) to survive JSON round-trips
/// without timezone ambiguity.
/// </summary>
public sealed record IdFields
{
    public string? FullName { get; init; }
    public string? DateOfBirth { get; init; }
    public string? DocumentNumber { get; init; }
    public string? IssueDate { get; init; }
    public string? ExpiryDate { get; init; }
    public string? Address { get; init; }
    public string? Country { get; init; }
    public string? State { get; init; }

    /// <summary>Kind of document, e.g. "drivers_license", "passport", "national_id".</summary>
    public string? DocumentKind { get; init; }
}
