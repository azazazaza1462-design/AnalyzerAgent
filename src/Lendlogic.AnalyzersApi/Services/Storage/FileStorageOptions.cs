namespace Lendlogic.AnalyzersApi.Services.Storage;

public sealed class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    public string Root { get; set; } = "uploads";
    public long MaxBytes { get; set; } = 52_428_800; // 50 MB
}
