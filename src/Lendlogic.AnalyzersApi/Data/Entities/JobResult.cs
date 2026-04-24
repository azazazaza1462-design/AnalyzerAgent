using System.Text.Json;
using Lendlogic.AnalyzersApi.Data.Enums;

namespace Lendlogic.AnalyzersApi.Data.Entities;

public class JobResult : BaseEntity
{
    public Guid JobId { get; set; }
    public JsonDocument? ResultData { get; set; }
    public ResultStatus Status { get; set; }

    public Job Job { get; set; } = null!;
}
