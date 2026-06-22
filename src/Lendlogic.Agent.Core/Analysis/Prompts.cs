namespace Lendlogic.Agent.Core.Analysis;

/// <summary>
/// Versioned prompt and JSON schema for the single Claude vision extraction call.
/// Bump <see cref="Version"/> when the prompt changes so results stay reproducible.
/// The schema IS the field set we want back; every field is required and the model
/// uses empty strings / "unknown" for anything it cannot read (the mapper turns
/// those into nulls and lowers the manual-review gate).
/// </summary>
internal static class Prompts
{
    public const string Version = "id-v2";

    public const string ExtractSystem =
        "You are reading a borrower's identity document (national ID, passport, residence permit, " +
        "or driver's license) for a KYC onboarding workflow. Read the visible fields and the " +
        "machine-readable zone (if any) and record them. Transcribe exactly what is printed — do not " +
        "infer, translate, or correct values. Dates must be ISO 8601 (yyyy-MM-dd). For documents with " +
        "an MRZ, copy the full raw MRZ verbatim including every '<' filler and line break. Use empty " +
        "strings for fields that are absent or unreadable, and lower overallConfidence rather than " +
        "guessing. Respond only with the structured JSON.";

    public const string ExtractUser =
        "Extract the identity fields from this document.";

    public const string ExtractSchema = """
    {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "documentType": { "type": "string", "enum": ["national_id","passport","drivers_license","residence_permit","unknown"] },
        "firstName": { "type": "string" },
        "lastName": { "type": "string" },
        "dateOfBirth": { "type": "string" },
        "documentNumber": { "type": "string" },
        "nationality": { "type": "string" },
        "issuingCountry": { "type": "string" },
        "dateOfExpiry": { "type": "string" },
        "sex": { "type": "string" },
        "machineReadableZone": { "type": "string" },
        "overallConfidence": { "type": "number" },
        "legibilityNotes": { "type": "string" }
      },
      "required": ["documentType","firstName","lastName","dateOfBirth","documentNumber","nationality","issuingCountry","dateOfExpiry","sex","machineReadableZone","overallConfidence","legibilityNotes"]
    }
    """;
}
