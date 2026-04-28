using FluentValidation;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Fail;

public sealed class FailJobValidator : AbstractValidator<FailJobCommand>
{
    public FailJobValidator()
    {
        RuleFor(x => x.JobId).NotEmpty();
        RuleFor(x => x.Error).MaximumLength(2000);
    }
}
