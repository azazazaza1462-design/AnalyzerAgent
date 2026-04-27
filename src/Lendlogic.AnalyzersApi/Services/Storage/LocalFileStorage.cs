using Microsoft.Extensions.Options;

namespace Lendlogic.AnalyzersApi.Services.Storage;

public sealed class LocalFileStorage(IOptions<FileStorageOptions> options) : IFileStorage
{
    private readonly string _root = Path.GetFullPath(options.Value.Root);

    public async Task<string> SaveAsync(
        Stream content,
        string originalName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var relativeDir = Path.Combine(now.Year.ToString("D4"), now.Month.ToString("D2"));
        var fullDir = Path.Combine(_root, relativeDir);
        Directory.CreateDirectory(fullDir);

        var extension = Path.GetExtension(originalName);
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var relativePath = Path.Combine(relativeDir, fileName);
        var fullPath = Path.Combine(_root, relativePath);

        await using var fs = File.Create(fullPath);
        await content.CopyToAsync(fs, cancellationToken);

        return relativePath.Replace('\\', '/');
    }

    public Task<Stream> OpenReadAsync(
        string storagePath,
        CancellationToken cancellationToken = default)
    {
        var fullPath = Path.Combine(_root, storagePath.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(fullPath))
            throw new FileNotFoundException("Stored file not found.", storagePath);

        Stream stream = File.OpenRead(fullPath);
        return Task.FromResult(stream);
    }
}
