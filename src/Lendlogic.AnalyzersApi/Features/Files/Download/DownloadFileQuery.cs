using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Files.Download;

public sealed record DownloadFileQuery(Guid FileId) : IQuery<ErrorOr<DownloadFileResult>>;

public sealed record DownloadFileResult(
    Stream Content,
    string FileName,
    string ContentType);
