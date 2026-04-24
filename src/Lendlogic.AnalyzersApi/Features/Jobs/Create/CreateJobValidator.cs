using FluentValidation;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Create;

public sealed class CreateJobValidator : AbstractValidator<CreateJobCommand>
{
    public CreateJobValidator()
    {
        RuleFor(x => x.Caller)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.JobType)
            .IsInEnum();
    }
}
