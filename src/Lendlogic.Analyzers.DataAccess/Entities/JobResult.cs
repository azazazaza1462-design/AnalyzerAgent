using System.Text.Json;
using Lendlogic.Analyzers.DataAccess.Enums;

namespace Lendlogic.Analyzers.DataAccess.Entities;

public class JobResult : BaseEntity
{
    public Guid JobId { get; set; }
    public JsonDocument? ResultData { get; set; }
    public ResultStatus Status { get; set; }

    public Job Job { get; set; } = null!;
}
