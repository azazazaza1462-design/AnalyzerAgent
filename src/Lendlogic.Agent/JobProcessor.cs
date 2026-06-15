using System.Text.Json;
using Lendlogic.Agent.Api;
using Lendlogic.Agent.Core.Analysis;
using Lendlogic.Agent.Core.Contracts;
using Microsoft.Extensions.Logging;

namespace Lendlogic.Agent;

/// <summary>
/// Orchestrates one unit of work: claim the next pending job, download its
/// attachments, dispatch to the matching analyzer, and report back to the API
/// (complete on success, fail on error). The Service Bus message is only a
/// trigger — claiming is pull-based on the API side, so the message body is
/// not parsed here.
/// </summary>
public sealed class JobProcessor(
    IAnalyzerApiClient api,
    IEnumerable<IDocumentAnalyzer> analyzers,
    ILogger<JobProcessor> logger)
{
    /// <summary>Processes the next pending job. Returns false if the queue was empty.</summary>
    public async Task<bool> ProcessNextAsync(string machineId, CancellationToken cancellationToken)
    {
        var job = await api.ClaimAsync(machineId, cancellationToken);
        if (job is null)
        {
            logger.LogInformation("No pending job to claim.");
            return false;
        }

        logger.LogInformation("Claimed job {JobId} ({JobType})", job.JobId, job.JobType);

        try
        {
            var analyzer = analyzers.FirstOrDefault(a => a.JobType == job.JobType)
                ?? throw new InvalidOperationException(
                    $"No analyzer registered for job type '{job.JobType}'.");

            var payload = DeserializePayload(job);

            var files = new List<AnalyzerFile>();
            foreach (var attachmentId in job.Attachments)
            {
                var file = await api.DownloadFileAsync(attachmentId, cancellationToken);
                if (file is not null)
                    files.Add(file);
                else
                    logger.LogWarning(
                        "Attachment {FileId} not found for job {JobId}", attachmentId, job.JobId);
            }

            var result = await analyzer.AnalyzeAsync(payload, files, cancellationToken);

            await api.CompleteAsync(job.JobId, result, cancellationToken);
            logger.LogInformation("Completed job {JobId}", job.JobId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Job {JobId} failed", job.JobId);
            await api.FailAsync(job.JobId, ex.Message, cancellationToken);
        }

        return true;
    }

    private static AnalyzerMessagePayload DeserializePayload(ClaimedJobDto job)
    {
        if (job.Content is { ValueKind: JsonValueKind.Object } content)
        {
            var payload = content.Deserialize<AnalyzerMessagePayload>(AgentJson.Wire);
            if (payload is not null)
                return payload;
        }

        // No content on the job — fall back to a minimal payload derived from the type.
        return new AnalyzerMessagePayload { DocumentType = job.JobType.ToString() };
    }
}
