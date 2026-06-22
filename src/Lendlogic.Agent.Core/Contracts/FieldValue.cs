namespace Lendlogic.Agent.Core.Contracts;

/// <summary>
/// A captured field plus a confidence estimate.
///
/// NOTE on confidence: a vision LLM returns a single document-level confidence,
/// not calibrated per-field probabilities. Until independent signals are wired in
/// (MRZ checksum agreement, a second pass), every field here carries the same
/// document-level estimate. Treat it as a triage hint, not a guarantee — the MRZ
/// checksum (<see cref="Lendlogic.Agent.Core.Analysis.Mrz"/>) is the deterministic
/// verification path.
/// </summary>
public sealed record FieldValue(string? Value, decimal Confidence);
