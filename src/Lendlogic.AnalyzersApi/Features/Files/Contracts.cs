namespace Lendlogic.AnalyzersApi.Features.Files;

public sealed record UploadFileResponse(
    Guid FileId,
    string FileName,
    string FileType,
    long FileSize,
    string UploadStatus);

public sealed record FileSummary(
    Guid Id,
    string FileName,
    string ContentType,
    long SizeBytes,
    DateTime CreatedAt);

public sealed record PagedFiles(
    FileSummary[] Items,
    int Total,
    int Page,
    int PageSize);
