using System.Globalization;
using System.Text.Json;
using Lendlogic.Agent.Core.Claude;
using Lendlogic.Agent.Core.Contracts;
using Lendlogic.Analyzers.DataAccess.Enums;

namespace Lendlogic.Agent.Core.Analysis;

/// <summary>
/// ID validation in a single pass: rasterize the attachment(s), send them to
/// Claude vision with one schema-constrained extraction call, then map the result
/// — parsing dates, recomputing the MRZ checksum (deterministic, the real
/// correctness check) and applying a manual-review gate (low confidence, missing
/// document number, expired document, or failed MRZ checksum).
/// </summary>
public sealed class IdValidationAnalyzer(
    IClaudeVisionClient vision,
    ClaudeOptions options) : IDocumentAnalyzer
{
    public JobType JobType => JobType.IdValidation;

    public async Task<object> AnalyzeAsync(
        AnalyzerMessagePayload payload,
        IReadOnlyList<AnalyzerFile> files,
        CancellationToken cancellationToken)
    {
        if (!options.IsConfigured)
            throw new InvalidOperationException("Claude is not configured (Claude:ApiKey is missing).");

        // ── Collect attachments as media (PDFs sent natively, images as-is) ──
        cancellationToken.ThrowIfCancellationRequested();
        var media = new List<ClaudeMedia>();
        foreach (var file in files)
            media.Add(new ClaudeMedia(ResolveMediaType(file), file.Content));
        if (media.Count == 0)
            throw new InvalidOperationException("No document to analyze.");

        // ── Single Claude vision extraction ──────────────────────────────────
        cancellationToken.ThrowIfCancellationRequested();
        var response = await vision.ExtractAsync(new ClaudeVisionRequest
        {
            SystemPrompt = Prompts.ExtractSystem,
            UserText = Prompts.ExtractUser,
            Media = media,
            OutputSchema = JsonSerializer.Deserialize<JsonElement>(Prompts.ExtractSchema),
            MaxTokens = options.MaxTokens,
        }, cancellationToken);

        return Map(response.Output, options.ManualReviewConfidenceThreshold);
    }

    // ── Mapping: raw extraction → domain result ──────────────────────────────
    private static IdentityDocumentResult Map(JsonElement e, decimal reviewThreshold)
    {
        var documentType = ParseDocType(Str(e, "documentType"));
        var firstName = Str(e, "firstName");
        var lastName = Str(e, "lastName");
        var dateOfBirth = Str(e, "dateOfBirth");
        var documentNumber = Str(e, "documentNumber");
        var nationality = Str(e, "nationality");
        var issuingCountry = Str(e, "issuingCountry");
        var dateOfExpiry = Str(e, "dateOfExpiry");
        var sex = Str(e, "sex");
        var mrz = Str(e, "machineReadableZone");
        var legibilityNotes = Str(e, "legibilityNotes");
        var confidence = Dec(e, "overallConfidence");

        var mrzValid = Mrz.Validate(mrz);
        var expiry = ParseDate(dateOfExpiry);

        // Manual-review gate: flag only on substantive problems. Genuine
        // illegibility surfaces as low confidence (the prompt tells the model to
        // lower confidence rather than guess), so a benign legibility note on an
        // otherwise confident read must NOT force review.
        var reasons = new List<string>();
        if (confidence < reviewThreshold)
            reasons.Add($"Model confidence {confidence:0.00} is below threshold {reviewThreshold:0.00}.");
        if (string.IsNullOrWhiteSpace(documentNumber))
            reasons.Add("Document number could not be read.");
        if (expiry is { } exp && exp < DateOnly.FromDateTime(DateTime.UtcNow))
            reasons.Add($"Document is expired (expiry {exp:yyyy-MM-dd}).");
        if (mrzValid == false)
            reasons.Add("MRZ check digits failed — transcription is suspect.");

        var rawFields = new Dictionary<string, FieldValue>
        {
            ["document_type"] = new(documentType.ToString(), confidence),
            ["first_name"] = new(firstName, confidence),
            ["last_name"] = new(lastName, confidence),
            ["date_of_birth"] = new(dateOfBirth, confidence),
            ["document_number"] = new(documentNumber, confidence),
            ["nationality"] = new(nationality, confidence),
            ["issuing_country"] = new(issuingCountry, confidence),
            ["date_of_expiry"] = new(dateOfExpiry, confidence),
            ["sex"] = new(sex, confidence),
        };

        return new IdentityDocumentResult
        {
            DocumentType = documentType,
            FirstName = firstName,
            LastName = lastName,
            DateOfBirth = dateOfBirth,
            DocumentNumber = documentNumber,
            Nationality = nationality,
            IssuingCountry = issuingCountry,
            DateOfExpiry = dateOfExpiry,
            Sex = sex,
            MachineReadableZone = mrz,
            LegibilityNotes = legibilityNotes,
            RawFields = rawFields,
            OverallConfidence = confidence,
            MrzChecksumValid = mrzValid,
            ReviewReasons = reasons,
            RequiresManualReview = reasons.Count > 0,
        };
    }

    // ── Parsing helpers ───────────────────────────────────────────────────────
    private static DocumentType ParseDocType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return DocumentType.Unknown;
        var compact = value.Replace("_", "").Replace(" ", "");
        return Enum.TryParse<DocumentType>(compact, ignoreCase: true, out var dt) ? dt : DocumentType.Unknown;
    }

    private static DateOnly? ParseDate(string? value) =>
        DateOnly.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d) ? d : null;

    // Maps an attachment to the media type Claude accepts: PDFs go natively as a
    // document block; images pass through as their image/* type.
    private static string ResolveMediaType(AnalyzerFile file)
    {
        var ct = (file.ContentType ?? string.Empty).Trim().ToLowerInvariant();
        if (ct == "application/pdf"
            || file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return "application/pdf";
        if (ct.StartsWith("image/"))
            return ct == "image/jpg" ? "image/jpeg" : ct;
        throw new NotSupportedException(
            $"Unsupported attachment '{file.FileName}' (content type '{ct}').");
    }

    // ── JSON readers ──────────────────────────────────────────────────────────
    private static string? Str(JsonElement obj, string name)
    {
        if (obj.ValueKind == JsonValueKind.Object && obj.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String)
        {
            var s = v.GetString();
            return string.IsNullOrWhiteSpace(s) ? null : s.Trim();
        }
        return null;
    }

    private static decimal Dec(JsonElement obj, string name) =>
        obj.ValueKind == JsonValueKind.Object && obj.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number
            ? v.GetDecimal() : 0m;
}
