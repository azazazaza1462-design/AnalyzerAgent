using System.Text.Json;
using ErrorOr;
using Lendlogic.Analyzers.DataAccess;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.Analyzers.DataAccess.Enums;
using Mediator;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Features.Jobs.Create;

public sealed class CreateJobHandler(ApplicationDbContext db)
    : ICommandHandler<CreateJobCommand, ErrorOr<CreateJobResponse>>
{
    public async ValueTask<ErrorOr<CreateJobResponse>> Handle(
        CreateJobCommand command, CancellationToken cancellationToken)
    {
        var caller = await db.Callers
            .FirstOrDefaultAsync(c => c.Name == command.Caller, cancellationToken);

        if (caller is null)
            return Error.NotFound("Caller.NotFound", $"Caller '{command.Caller}' does not exist.");

        var attachments = command.Attachments ?? [];
        if (attachments.Length > 0)
        {
            var found = await db.Files
                .Where(f => attachments.Contains(f.Id))
                .Select(f => f.Id)
                .ToListAsync(cancellationToken);

            var missing = attachments.Except(found).ToArray();
            if (missing.Length > 0)
                return Error.NotFound(
                    "File.NotFound",
                    $"Attachment files not found: {string.Join(", ", missing)}");
        }

        JsonDocument? contentDoc = null;
        if (command.Content is { } element && element.ValueKind != JsonValueKind.Null && element.ValueKind != JsonValueKind.Undefined)
        {
            contentDoc = JsonDocument.Parse(element.GetRawText());
        }

        var job = new Job
        {
            CallerId = caller.Id,
            JobType = command.JobType,
            JobStatus = JobStatus.Pending,
            Content = contentDoc,
            Attachments = attachments,
        };

        db.Jobs.Add(job);
        await db.SaveChangesAsync(cancellationToken);

        return new CreateJobResponse(job.Id);
    }
}
