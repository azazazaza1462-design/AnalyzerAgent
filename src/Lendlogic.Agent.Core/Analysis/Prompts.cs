namespace Lendlogic.Agent.Core.Analysis;

/// <summary>
/// Versioned prompts and JSON schemas for the Claude vision steps. Bump
/// <see cref="Version"/> when a prompt changes so results stay reproducible.
/// </summary>
internal static class Prompts
{
    public const string Version = "id-v1";

    public const string ClassifySystem =
        "You are an identity-document classifier. Look at the provided document image(s) " +
        "and identify the document type, issuing country, issuing state/region, and image quality. " +
        "Respond only with the structured JSON. Use empty strings when a value is not present.";

    public const string ClassifyUser =
        "Classify this identity document. If country/state are unknown, return empty strings.";

    public const string ClassifySchema = """
    {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "documentKind": { "type": "string", "enum": ["drivers_license","passport","national_id","residence_permit","unknown"] },
        "country": { "type": "string" },
        "state": { "type": "string" },
        "imageQuality": { "type": "string", "enum": ["good","fair","poor"] }
      },
      "required": ["documentKind","country","state","imageQuality"]
    }
    """;

    public const string ExtractSystem =
        "You extract fields from an identity document image. Transcribe exactly what is printed. " +
        "Dates must be ISO 8601 (yyyy-MM-dd). For passports, copy the two machine-readable-zone (MRZ) " +
        "lines verbatim including '<' fillers. Use empty strings for fields that are absent or unreadable. " +
        "Respond only with the structured JSON.";

    public const string ExtractUser =
        "Extract the identity fields from this document.";

    public const string ExtractSchema = """
    {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "fullName": { "type": "string" },
        "dateOfBirth": { "type": "string" },
        "documentNumber": { "type": "string" },
        "issueDate": { "type": "string" },
        "expiryDate": { "type": "string" },
        "address": { "type": "string" },
        "mrzLine1": { "type": "string" },
        "mrzLine2": { "type": "string" }
      },
      "required": ["fullName","dateOfBirth","documentNumber","issueDate","expiryDate","address","mrzLine1","mrzLine2"]
    }
    """;

    public const string AuthenticitySystem =
        "You are a document-authenticity reviewer. Inspect the identity document image(s) for visual " +
        "signs of tampering or forgery: mismatched fonts, misaligned text, edited photos, inconsistent " +
        "backgrounds, or digital artifacts. This is a best-effort visual assessment, not a forensic " +
        "guarantee. Respond only with the structured JSON. authenticityScore is 0.0 (likely fake) to " +
        "1.0 (looks authentic).";

    public const string AuthenticityUser =
        "Assess this document for visible tampering and give an authenticity score.";

    public const string AuthenticitySchema = """
    {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "authenticityScore": { "type": "number" },
        "tamperingDetected": { "type": "boolean" },
        "notes": { "type": "string" }
      },
      "required": ["authenticityScore","tamperingDetected","notes"]
    }
    """;
}
