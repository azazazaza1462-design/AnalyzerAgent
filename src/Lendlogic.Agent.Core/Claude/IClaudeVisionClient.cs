using System.Text.Json;

namespace Lendlogic.Agent.Core.Claude;

/// <summary>
/// Claude vision (Sonnet 4.6) with structured output: sends document images plus
/// a prompt and a JSON schema, and returns the schema-constrained JSON together
/// with token usage. Implemented over the official Anthropic C# SDK.
/// </summary>
public interface IClaudeVisionClient
{
    Task<ClaudeVisionResponse> ExtractAsync(
        ClaudeVisionRequest request,
        CancellationToken cancellationToken);
}

/// <summary>One media item sent to Claude. <see cref="MediaType"/> is an HTTP
/// media type: an image ("image/png", "image/jpeg", "image/webp", "image/gif")
/// sent as an image block, or "application/pdf" sent as a native document block.</summary>
public sealed record ClaudeMedia(string MediaType, byte[] Data);

/// <summary>A single structured vision call.</summary>
public sealed record ClaudeVisionRequest
{
    public required string SystemPrompt { get; init; }
    public required string UserText { get; init; }
    public required IReadOnlyList<ClaudeMedia> Media { get; init; }

    /// <summary>JSON Schema the response must conform to (output_config.format).</summary>
    public required JsonElement OutputSchema { get; init; }

    /// <summary>Optional per-step API key; falls back to the default when null.</summary>
    public string? ApiKeyOverride { get; init; }

    public int MaxTokens { get; init; } = 2048;
}

/// <summary>The structured output plus token usage (recorded per step as an AnalyzerCall).</summary>
public sealed record ClaudeVisionResponse(JsonElement Output, int InputTokens, int OutputTokens);
