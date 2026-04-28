using ErrorOr;
using Lendlogic.AnalyzersApi.Data;
using Lendlogic.AnalyzersApi.Services.Storage;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Files.Download;

public sealed class DownloadFileHandler(ApplicationDbContext db, IFileStorage storage)
    : IQueryHandler<DownloadFileQuery, ErrorOr<DownloadFileResult>>
{
    public async ValueTask<ErrorOr<DownloadFileResult>> Handle(
        DownloadFileQuery query, CancellationToken cancellationToken)
    {
        var asset = await db.Files
            .FirstOrDefaultAsync(f => f.Id == query.FileId, cancellationToken);

        if (asset is null)
            return Error.NotFound("File.NotFound", $"File '{query.FileId}' does not exist.");

        try
        {
            var stream = await storage.OpenReadAsync(asset.StoragePath, cancellationToken);
            return new DownloadFileResult(stream, asset.FileName, asset.ContentType);
        }
        catch (FileNotFoundException)
        {
            return Error.NotFound("File.MissingOnDisk", "Stored content is no longer available.");
        }
    }
}
