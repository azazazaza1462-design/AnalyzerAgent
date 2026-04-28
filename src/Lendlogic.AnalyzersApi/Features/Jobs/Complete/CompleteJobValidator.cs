using FluentValidation;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Complete;

public sealed class CompleteJobValidator : AbstractValidator<CompleteJobCommand>
{
    public CompleteJobValidator()
    {
        RuleFor(x => x.JobId).NotEmpty();
    }
}
