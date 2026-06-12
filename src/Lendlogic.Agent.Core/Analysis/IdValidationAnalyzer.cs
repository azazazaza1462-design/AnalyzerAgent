using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using Lendlogic.Agent.Core.Claude;
using Lendlogic.Agent.Core.Contracts;
using Lendlogic.Agent.Core.Eligibility;
using Lendlogic.Agent.Core.Imaging;
using Lendlogic.Analyzers.DataAccess.Enums;

namespace Lendlogic.Agent.Core.Analysis;

/// <summary>
/// Phase 2: the real ID validation pipeline. Six steps, each recorded as an
/// <see cref="AnalyzerCall"/> with duration and (for Claude steps) token usage:
/// 1 ingest/rasterize, 2 classify (Claude vision), 3 field extraction (Claude
/// vision), 4 authenticity (MRZ checksum + consistency + best-effort vision),
/// 5 cross-check vs LOS data (rules), 6 emit eligibility features.
/// Face match is out of scope (faceMatchScore stays null) until a biometric
/// service is integrated.
/// </summary>
public sealed class IdValidationAnalyzer(
    IClaudeVisionClient vision,
    IImageRasterizer rasterizer,
    IEligibilityModelClient eligibilityModel,
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

        var calls = new List<AnalyzerCall>();
        var checks = new List<IdCheck>();

        // ── Step 1: ingest + rasterize ───────────────────────────────────
        cancellationToken.ThrowIfCancellationRequested();
        var sw = Stopwatch.StartNew();
        var images = new List<ClaudeImage>();
        foreach (var file in files)
            images.AddRange(rasterizer.ToImages(file));
        sw.Stop();
        if (images.Count == 0)
            throw new InvalidOperationException("No document images to analyze.");
        calls.Add(Call("ingest", "Ingest + document-type & image-quality detection", sw, model: null));

        // ── Step 2: classification (Claude vision) ───────────────────────
        cancellationToken.ThrowIfCancellationRequested();
        var classify = await VisionStep(calls, "classify",
            "Classification (type, country/state, layout)",
            Prompts.ClassifySystem, Prompts.ClassifyUser, Prompts.ClassifySchema, images, cancellationToken);

        // ── Step 3: field extraction (Claude vision) ─────────────────────
        cancellationToken.ThrowIfCancellationRequested();
        var extract = await VisionStep(calls, "extract",
            "Field extraction (name, DOB, doc #, issue/expiry, address)",
            Prompts.ExtractSystem, Prompts.ExtractUser, Prompts.ExtractSchema, images, cancellationToken);

        var fields = new IdFields
        {
            FullName = Str(extract, "fullName"),
            DateOfBirth = Str(extract, "dateOfBirth"),
            DocumentNumber = Str(extract, "documentNumber"),
            IssueDate = Str(extract, "issueDate"),
            ExpiryDate = Str(extract, "expiryDate"),
            Address = Str(extract, "address"),
            Country = Str(classify, "country"),
            State = Str(classify, "state"),
            DocumentKind = Str(classify, "documentKind") ?? "unknown",
        };
        var mrzLine2 = Str(extract, "mrzLine2");

        // ── Step 4: authenticity / verification ──────────────────────────
        cancellationToken.ThrowIfCancellationRequested();

        // 4a. MRZ checksum (deterministic)
        var mrz = Mrz.ValidateTd3(mrzLine2);
        checks.Add(new IdCheck
        {
            Name = "mrz_checksum",
            Status = mrz switch { true => CheckStatus.Pass, false => CheckStatus.Fail, null => CheckStatus.NotApplicable },
            Detail = mrz switch
            {
                true => "MRZ check digits valid (TD3).",
                false => "MRZ check digits do not validate.",
                null => "No machine-readable zone present.",
            },
        });

        // 4b. expiry + field consistency (deterministic)
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var issue = ParseDate(fields.IssueDate);
        var expiry = ParseDate(fields.ExpiryDate);
        var documentExpired = expiry is { } e && e < today;
        checks.Add(BuildExpiryCheck(expiry, today, documentExpired));
        checks.Add(BuildConsistencyCheck(issue, expiry));

        // 4c. best-effort authenticity (Claude vision)
        var authJson = await VisionStep(calls, "authenticity",
            "Authenticity / verification (tampering + MRZ + consistency)",
            Prompts.AuthenticitySystem, Prompts.AuthenticityUser, Prompts.AuthenticitySchema, images, cancellationToken);
        var authenticityScore = Dbl(authJson, "authenticityScore");
        var tampering = Bl(authJson, "tamperingDetected");
        checks.Add(new IdCheck
        {
            Name = "authenticity",
            Status = tampering ? CheckStatus.Fail
                : authenticityScore >= 0.7 ? CheckStatus.Pass
                : authenticityScore >= 0.4 ? CheckStatus.Borderline
                : CheckStatus.Fail,
            Detail = Str(authJson, "notes") ?? $"Authenticity score {authenticityScore:0.00}.",
        });

        // ── Step 5: cross-check vs LOS data (rules, no Claude) ────────────
        cancellationToken.ThrowIfCancellationRequested();
        sw = Stopwatch.StartNew();
        var nameScore = NameMatch(fields.FullName, payload.LosData?.FullName);
        var dobScore = DobMatch(fields.DateOfBirth, payload.LosData?.DateOfBirth);
        checks.Add(BuildMatchCheck("name_match", nameScore, payload.LosData?.FullName, fields.FullName));
        checks.Add(BuildMatchCheck("dob_match", dobScore, payload.LosData?.DateOfBirth, fields.DateOfBirth));
        sw.Stop();
        calls.Add(Call("cross_check", "Cross-check vs LOS application data", sw, model: null));

        // ── Step 6: emit eligibility features (no Claude) ─────────────────
        cancellationToken.ThrowIfCancellationRequested();
        sw = Stopwatch.StartNew();
        var verdict = ComputeVerdict(checks);
        var confidence = ComputeConfidence(authenticityScore, nameScore, dobScore, checks);
        var features = new EligibilityFeatures
        {
            IdentityVerified = verdict == IdVerdict.Verified,
            DocumentExpired = documentExpired,
            NameMatchScore = nameScore ?? 0,
            DobMatchScore = dobScore ?? 0,
            FaceMatchScore = null,
            AuthenticityScore = authenticityScore,
        };
        var eligibility = await eligibilityModel.ScoreAsync(features, cancellationToken);
        sw.Stop();
        calls.Add(Call("eligibility_features", "Emit eligibility features + score", sw, model: null));

        return new IdValidationResult
        {
            Fields = fields,
            Checks = checks,
            Verdict = verdict,
            Confidence = confidence,
            Eligibility = eligibility,
            Calls = calls,
        };
    }

    // ── Claude step helper ───────────────────────────────────────────────
    private async Task<JsonElement> VisionStep(
        List<AnalyzerCall> calls, string step, string label,
        string system, string user, string schemaJson,
        IReadOnlyList<ClaudeImage> images, CancellationToken cancellationToken)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var response = await vision.ExtractAsync(new ClaudeVisionRequest
            {
                SystemPrompt = system,
                UserText = user,
                Images = images,
                OutputSchema = JsonSerializer.Deserialize<JsonElement>(schemaJson),
                MaxTokens = options.MaxTokens,
            }, cancellationToken);
            sw.Stop();
            calls.Add(new AnalyzerCall
            {
                Step = step,
                Label = label,
                Model = options.Model,
                DurationMs = sw.ElapsedMilliseconds,
                InputTokens = response.InputTokens,
                OutputTokens = response.OutputTokens,
                Success = true,
            });
            return response.Output;
        }
        catch (Exception ex)
        {
            sw.Stop();
            calls.Add(new AnalyzerCall
            {
                Step = step,
                Label = label,
                Model = options.Model,
                DurationMs = sw.ElapsedMilliseconds,
                Success = false,
                Error = ex.Message,
            });
            throw;
        }
    }

    private static AnalyzerCall Call(string step, string label, Stopwatch sw, string? model) => new()
    {
        Step = step,
        Label = label,
        Model = model,
        DurationMs = sw.ElapsedMilliseconds,
        Success = true,
    };

    // ── Checks ─────────────────────────────────────────────────────────
    private static IdCheck BuildExpiryCheck(DateOnly? expiry, DateOnly today, bool expired)
    {
        if (expiry is null)
            return new IdCheck { Name = "expiry", Status = CheckStatus.Borderline, Detail = "Expiry date not found." };
        if (expired)
            return new IdCheck { Name = "expiry", Status = CheckStatus.Fail, Detail = $"Document expired on {expiry:yyyy-MM-dd}." };
        if (expiry.Value < today.AddDays(30))
            return new IdCheck { Name = "expiry", Status = CheckStatus.Borderline, Detail = $"Expires soon ({expiry:yyyy-MM-dd})." };
        return new IdCheck { Name = "expiry", Status = CheckStatus.Pass, Detail = $"Valid through {expiry:yyyy-MM-dd}." };
    }

    private static IdCheck BuildConsistencyCheck(DateOnly? issue, DateOnly? expiry)
    {
        if (issue is null || expiry is null)
            return new IdCheck { Name = "field_consistency", Status = CheckStatus.NotApplicable, Detail = "Issue/expiry not both present." };
        return issue < expiry
            ? new IdCheck { Name = "field_consistency", Status = CheckStatus.Pass, Detail = "Issue date precedes expiry." }
            : new IdCheck { Name = "field_consistency", Status = CheckStatus.Fail, Detail = "Issue date is not before expiry." };
    }

    private static IdCheck BuildMatchCheck(string name, double? score, string? expected, string? extracted)
    {
        if (score is null)
            return new IdCheck { Name = name, Status = CheckStatus.NotApplicable, Detail = "No LOS value or no extracted value to compare." };
        var status = score >= 0.99 ? CheckStatus.Pass : score >= 0.6 ? CheckStatus.Borderline : CheckStatus.Fail;
        return new IdCheck { Name = name, Status = status, Detail = $"LOS '{expected}' vs ID '{extracted}' (score {score:0.00})." };
    }

    // ── Verdict / confidence ─────────────────────────────────────────────
    private static IdVerdict ComputeVerdict(List<IdCheck> checks)
    {
        if (checks.Any(c => c.Status == CheckStatus.Fail)) return IdVerdict.Rejected;
        if (checks.Any(c => c.Status == CheckStatus.Borderline)) return IdVerdict.NeedsReview;
        return IdVerdict.Verified;
    }

    private static double ComputeConfidence(double authenticityScore, double? nameScore, double? dobScore, List<IdCheck> checks)
    {
        var parts = new List<double> { authenticityScore };
        if (nameScore is { } n) parts.Add(n);
        if (dobScore is { } d) parts.Add(d);
        var avg = parts.Average();
        var borderlinePenalty = 0.1 * checks.Count(c => c.Status == CheckStatus.Borderline);
        return Math.Round(Math.Clamp(avg - borderlinePenalty, 0, 1), 2);
    }

    // ── Matching ─────────────────────────────────────────────────────────
    private static double? NameMatch(string? extracted, string? expected)
    {
        if (string.IsNullOrWhiteSpace(extracted) || string.IsNullOrWhiteSpace(expected)) return null;
        var a = NormalizeTokens(extracted);
        var b = NormalizeTokens(expected);
        if (a.Count == 0 || b.Count == 0) return null;
        if (a.SetEquals(b)) return 1.0;
        var intersection = a.Intersect(b).Count();
        var union = a.Union(b).Count();
        return (double)intersection / union; // Jaccard
    }

    private static double? DobMatch(string? extracted, string? expected)
    {
        var a = ParseDate(extracted);
        var b = ParseDate(expected);
        if (a is null || b is null) return null;
        return a == b ? 1.0 : 0.0;
    }

    private static HashSet<string> NormalizeTokens(string value)
    {
        var cleaned = new string(value.ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) ? ch : ' ').ToArray());
        return cleaned.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToHashSet();
    }

    private static DateOnly? ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return DateOnly.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date) ? date : null;
    }

    // ── JSON helpers ─────────────────────────────────────────────────────
    private static string? Str(JsonElement obj, string name)
    {
        if (obj.ValueKind == JsonValueKind.Object && obj.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String)
        {
            var s = v.GetString();
            return string.IsNullOrWhiteSpace(s) ? null : s.Trim();
        }
        return null;
    }

    private static double Dbl(JsonElement obj, string name) =>
        obj.ValueKind == JsonValueKind.Object && obj.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number
            ? v.GetDouble() : 0;

    private static bool Bl(JsonElement obj, string name) =>
        obj.ValueKind == JsonValueKind.Object && obj.TryGetProperty(name, out var v)
            && (v.ValueKind == JsonValueKind.True || v.ValueKind == JsonValueKind.False) && v.GetBoolean();
}
