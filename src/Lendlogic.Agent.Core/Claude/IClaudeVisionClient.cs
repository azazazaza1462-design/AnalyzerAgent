using System.Text.Json;

namespace Lendlogic.Agent.Core.Claude;

/// <summary>
/// Abstraction over Claude vision (Sonnet 4.6 with tool_use for structured
/// output). Defined in Phase 1 so the analyzer can depend on it; implemented
/// for real against the Anthropic API in Phase 2.
/// </summary>
public interface IClaudeVisionClient
{
    Task<ClaudeVisionResponse> CompleteAsync(
        ClaudeVisionRequest request,
        CancellationToken cancellationToken);
}

/// <summary>One image sent to Claude vision (base64 is handled by the client).</summary>
public sealed record ClaudeImage(string MediaType, byte[] Data);

/// <summary>
/// A single vision call: a system prompt, the document images, and a tool whose
/// JSON schema constrains the structured output Claude must return.
/// </summary>
public sealed record ClaudeVisionRequest(
    string Model,
    string SystemPrompt,
    IReadOnlyList<ClaudeImage> Images,
    string ToolName,
    JsonElement ToolSchema);

/// <summary>
/// The structured tool_use output plus token usage, recorded per step as an
/// <see cref="Contracts.AnalyzerCall"/>.
/// </summary>
public sealed record ClaudeVisionResponse(
    JsonElement Output,
    int InputTokens,
    int OutputTokens);
