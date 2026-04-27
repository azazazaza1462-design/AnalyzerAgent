using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Claim;

public sealed record ClaimJobCommand(string MachineId) : ICommand<ErrorOr<ClaimJobResult>>;
