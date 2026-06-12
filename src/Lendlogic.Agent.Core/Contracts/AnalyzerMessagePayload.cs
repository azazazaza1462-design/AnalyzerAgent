namespace Lendlogic.Agent.Core.Contracts;

// Contract shapes shared between the API and the agent worker.
//
// Serialization policy (configured where these are read/written, in the
// agent + API JsonSerializerOptions): property names are camelCase and enum
// values are snake_case lowercase, so the persisted JSON matches the frontend
// unions in features/workspace/types.ts. Treat any reshape here as a
// cross-team contract change — the Service Bus JobMessage sits behind it.

/// <summary>
/// Shape of <see cref="Lendlogic.Analyzers.DataAccess.Entities.Job.Content"/>
/// for an analyzer job. The LOS/API writes this on job creation; the agent
/// reads it to know what to analyze and what to cross-check against.
/// </summary>
public sealed record AnalyzerMessagePayload
{
    /// <summary>Which analyzer should handle the job, e.g. "id_validation".</summary>
    public required string DocumentType { get; init; }

    /// <summary>Originating LOS application, when the job is tied to one.</summary>
    public string? ApplicationId { get; init; }

    /// <summary>
    /// File ids to analyze. The authoritative list is
    /// <see cref="Lendlogic.Analyzers.DataAccess.Entities.Job.Attachments"/>;
    /// this mirrors the LOS intent and is kept for self-contained payloads.
    /// </summary>
    public Guid[] Attachments { get; init; } = [];

    /// <summary>Applicant data from the LOS used for the cross-check step.</summary>
    public LosApplicantData? LosData { get; init; }
}

/// <summary>Applicant fields the LOS already holds, used to cross-check the ID.</summary>
public sealed record LosApplicantData
{
    public string? FullName { get; init; }

    /// <summary>Date of birth as ISO 8601 (yyyy-MM-dd).</summary>
    public string? DateOfBirth { get; init; }
}
