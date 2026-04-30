using ErrorOr;
using Lendlogic.Analyzers.DataAccess;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Files.List;

public sealed class ListFilesHandler(ApplicationDbContext db)
    : IQueryHandler<ListFilesQuery, ErrorOr<PagedFiles>>
{
    public async ValueTask<ErrorOr<PagedFiles>> Handle(
        ListFilesQuery query, CancellationToken cancellationToken)
    {
        var files = db.Files.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            files = files.Where(f => EF.Functions.ILike(f.FileName, $"%{term}%"));
        }

        var total = await files.CountAsync(cancellationToken);

        var items = await files
            .OrderByDescending(f => f.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(f => new FileSummary(
                f.Id,
                f.FileName,
                f.ContentType,
                f.SizeBytes,
                f.CreatedAt))
            .ToArrayAsync(cancellationToken);

        return new PagedFiles(items, total, query.Page, query.PageSize);
    }
}
