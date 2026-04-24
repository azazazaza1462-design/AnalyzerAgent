namespace Lendlogic.AnalyzersApi.Features.Files;

public sealed record UploadFileResponse(
    Guid FileId,
    string FileName,
    string FileType,
    long FileSize,
    string UploadStatus);
