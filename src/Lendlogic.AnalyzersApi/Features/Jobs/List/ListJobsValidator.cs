using FluentValidation;

namespace Lendlogic.AnalyzersApi.Features.Jobs.List;

public sealed class ListJobsValidator : AbstractValidator<ListJobsQuery>
{
    public ListJobsValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100);

        RuleFor(x => x.Status!)
            .IsInEnum()
            .When(x => x.Status.HasValue);

        RuleFor(x => x)
            .Must(q => !q.From.HasValue || !q.To.HasValue || q.From <= q.To)
            .WithMessage("'From' must be before or equal to 'To'.");
    }
}
