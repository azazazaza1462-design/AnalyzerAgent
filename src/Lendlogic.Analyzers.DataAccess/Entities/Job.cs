using System.Text.Json;
using Lendlogic.Analyzers.DataAccess.Enums;

namespace Lendlogic.Analyzers.DataAccess.Entities;

public class Job : BaseEntity
{
    public Guid CallerId { get; set; }
    public JobType JobType { get; set; }
    public JobStatus JobStatus { get; set; }
    public string? MachineId { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public JsonDocument? Content { get; set; }
    public Guid[] Attachments { get; set; } = [];

    public Caller Caller { get; set; } = null!;
    public ICollection<JobResult> Results { get; set; } = [];
}
