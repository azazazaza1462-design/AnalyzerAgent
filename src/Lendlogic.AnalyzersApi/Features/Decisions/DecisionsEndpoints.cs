using System.Globalization;
using System.Text.Json;
using Carter;
using Lendlogic.Analyzers.DataAccess;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.Analyzers.DataAccess.Enums;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Decisions;

/// <summary>
/// Reviewer decisions (training labels) and the labeled-dataset export. A
/// decision pairs a job's emitted features with a ground-truth outcome; the
/// dataset endpoint joins the two so the ML pipeline can train the eligibility
/// model.
/// </summary>
public class DecisionsEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var env = app.ServiceProvider.GetRequiredService<IWebHostEnvironment>();

        var jobs = app.MapGroup("/api/v1/jobs").WithTags("Decisions");

        var record = jobs.MapPost("/{id:guid}/decision", async (
            Guid id,
            RecordDecisionBody body,
            ApplicationDbContext db,
            CancellationToken ct) =>
        {
            if (!Enum.TryParse<DecisionOutcome>(body.Outcome, ignoreCase: true, out var outcome))
                return Results.BadRequest(new { error = "outcome must be 'approved' or 'rejected'." });

            if (!await db.Jobs.AnyAsync(j => j.Id == id, ct))
                return Results.NotFound();

            var existing = await db.JobDecisions.FirstOrDefaultAsync(d => d.JobId == id, ct);
            if (existing is null)
                db.JobDecisions.Add(new JobDecision
                {
                    JobId = id,
                    Outcome = outcome,
                    ReviewedBy = body.ReviewedBy,
                    Note = body.Note,
                });
            else
            {
                existing.Outcome = outcome;
                existing.ReviewedBy = body.ReviewedBy;
                existing.Note = body.Note;
            }

            await db.SaveChangesAsync(ct);
            return Results.Ok(new DecisionResponse(id, outcome.ToString(), body.ReviewedBy, body.Note));
        });

        var get = jobs.MapGet("/{id:guid}/decision", async (
            Guid id,
            ApplicationDbContext db,
            CancellationToken ct) =>
        {
            var d = await db.JobDecisions.AsNoTracking().FirstOrDefaultAsync(x => x.JobId == id, ct);
            return d is null
                ? Results.NoContent()
                : Results.Ok(new DecisionResponse(d.JobId, d.Outcome.ToString(), d.ReviewedBy, d.Note));
        });

        var training = app.MapGroup("/api/v1/training").WithTags("Training");

        var dataset = training.MapGet("/dataset", async (ApplicationDbContext db, CancellationToken ct) =>
        {
            var decisions = await db.JobDecisions.AsNoTracking().ToListAsync(ct);
            if (decisions.Count == 0)
                return Results.Ok(new { count = 0, examples = Array.Empty<object>() });

            var jobIds = decisions.Select(d => d.JobId).ToList();
            var results = await db.JobResults.AsNoTracking()
                .Where(r => jobIds.Contains(r.JobId))
                .ToListAsync(ct);
            var latestByJob = results
                .GroupBy(r => r.JobId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.CreatedAt).First());

            var examples = new List<TrainingExample>();
            foreach (var d in decisions)
            {
                if (!latestByJob.TryGetValue(d.JobId, out var result) || result.ResultData is null)
                    continue;
                var root = result.ResultData.RootElement;
                if (root.ValueKind != JsonValueKind.Object)
                    continue;

                examples.Add(new TrainingExample(
                    d.JobId,
                    d.Outcome.ToString().ToLowerInvariant(),
                    BuildFeatures(root)));
            }

            return Results.Ok(new { count = examples.Count, examples });
        });

        if (env.IsDevelopment())
        {
            record.AllowAnonymous();
            get.AllowAnonymous();
            dataset.AllowAnonymous();
        }
        else
        {
            record.RequireAuthorization();
            get.RequireAuthorization();
            dataset.RequireAuthorization();
        }
    }

    // Derives the labeled-dataset feature vector from the flat ID result shape
    // (the analyzer no longer emits a dedicated "features" block).
    private static JsonElement BuildFeatures(JsonElement root)
    {
        var features = new Dictionary<string, object?>
        {
            ["document_type"] = GetString(root, "documentType"),
            ["overall_confidence"] = GetDecimal(root, "overallConfidence"),
            ["mrz_checksum_valid"] = GetNullableBool(root, "mrzChecksumValid"),
            ["requires_manual_review"] = GetBool(root, "requiresManualReview"),
            ["document_expired"] = IsExpired(GetString(root, "dateOfExpiry")),
        };
        return JsonSerializer.SerializeToElement(features);
    }

    private static string? GetString(JsonElement root, string name) =>
        root.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private static decimal GetDecimal(JsonElement root, string name) =>
        root.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number ? v.GetDecimal() : 0m;

    private static bool GetBool(JsonElement root, string name) =>
        root.TryGetProperty(name, out var v)
            && (v.ValueKind == JsonValueKind.True || v.ValueKind == JsonValueKind.False) && v.GetBoolean();

    private static bool? GetNullableBool(JsonElement root, string name) =>
        root.TryGetProperty(name, out var v) && (v.ValueKind == JsonValueKind.True || v.ValueKind == JsonValueKind.False)
            ? v.GetBoolean()
            : null;

    private static bool IsExpired(string? isoDate) =>
        DateOnly.TryParse(isoDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d)
            && d < DateOnly.FromDateTime(DateTime.UtcNow);
}

public sealed record RecordDecisionBody(string Outcome, string? ReviewedBy, string? Note);

public sealed record DecisionResponse(Guid JobId, string Outcome, string? ReviewedBy, string? Note);

public sealed record TrainingExample(Guid JobId, string Label, JsonElement Features);
