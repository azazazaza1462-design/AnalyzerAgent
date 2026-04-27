namespace Lendlogic.AnalyzersApi.Services.Storage;

public interface IFileStorage
{
    Task<string> SaveAsync(
        Stream content,
        string originalName,
        string contentType,
        CancellationToken cancellationToken = default);

    Task<Stream> OpenReadAsync(
        string storagePath,
        CancellationToken cancellationToken = default);
}
