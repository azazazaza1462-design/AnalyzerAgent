namespace Lendlogic.Agent.Core.Contracts;

/// <summary>
/// Kind of identity document detected during extraction. Serialized snake_case
/// (e.g. "drivers_license") via the agent's result JSON options, matching the
/// frontend union.
/// </summary>
public enum DocumentType
{
    Unknown,
    NationalId,
    Passport,
    DriversLicense,
    ResidencePermit,
}
