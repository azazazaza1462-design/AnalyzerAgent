using ErrorOr;
using Lendlogic.Analyzers.DataAccess;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.AnalyzersApi.Services.Storage;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Files.Upload;

public sealed class UploadFileHandler(ApplicationDbContext db, IFileStorage storage)
    : ICommandHandler<UploadFileCommand, ErrorOr<UploadFileResponse>>
{
    public async ValueTask<ErrorOr<UploadFileResponse>> Handle(
        UploadFileCommand command, CancellationToken cancellationToken)
    {
        var storagePath = await storage.SaveAsync(
            command.Content,
            command.FileName,
            command.ContentType,
            cancellationToken);

        var entity = new FileAsset
        {
            FileName = command.FileName,
            ContentType = command.ContentType,
            SizeBytes = command.SizeBytes,
            StoragePath = storagePath,
        };

        db.Files.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        return new UploadFileResponse(
            FileId: entity.Id,
            FileName: entity.FileName,
            FileType: entity.ContentType,
            FileSize: entity.SizeBytes,
            UploadStatus: "Success");
    }
}
