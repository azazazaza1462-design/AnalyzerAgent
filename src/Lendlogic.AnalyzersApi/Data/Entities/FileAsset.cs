namespace Lendlogic.AnalyzersApi.Data.Entities;

public class FileAsset : BaseEntity
{
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StoragePath { get; set; }
}
