using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Files.Upload;

public sealed record UploadFileCommand(
    Stream Content,
    string FileName,
    string ContentType,
    long SizeBytes) : ICommand<ErrorOr<UploadFileResponse>>;
