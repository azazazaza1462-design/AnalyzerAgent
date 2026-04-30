using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Files.List;

public sealed record ListFilesQuery(
    string? Search,
    int Page,
    int PageSize) : IQuery<ErrorOr<PagedFiles>>;
