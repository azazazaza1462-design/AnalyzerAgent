using FluentValidation;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Claim;

public sealed class ClaimJobValidator : AbstractValidator<ClaimJobCommand>
{
    public ClaimJobValidator()
    {
        RuleFor(x => x.MachineId)
            .NotEmpty()
            .MaximumLength(200);
    }
}
