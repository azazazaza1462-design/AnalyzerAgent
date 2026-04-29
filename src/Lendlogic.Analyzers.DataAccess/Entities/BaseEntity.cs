using Lendlogic.Analyzers.DataAccess.Abstractions;

namespace Lendlogic.Analyzers.DataAccess.Entities;

public abstract class BaseEntity : IEntity
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
