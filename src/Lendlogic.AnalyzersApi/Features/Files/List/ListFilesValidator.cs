using FluentValidation;

namespace Lendlogic.AnalyzersApi.Features.Files.List;

public sealed class ListFilesValidator : AbstractValidator<ListFilesQuery>
{
    public ListFilesValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100);
    }
}
