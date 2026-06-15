namespace Lendlogic.Agent.Core.Analysis;

/// <summary>
/// A document attachment downloaded from the API (<c>GET /files/{id}</c>) and
/// handed to an analyzer. In Phase 2 the bytes are rasterized (PDF) or passed
/// through (image) and sent to Claude vision.
/// </summary>
public sealed record AnalyzerFile(
    Guid Id,
    string FileName,
    string ContentType,
    byte[] Content);
