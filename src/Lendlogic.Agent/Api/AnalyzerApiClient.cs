using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Lendlogic.Agent.Core.Analysis;

namespace Lendlogic.Agent.Api;

public sealed class AnalyzerApiClient(HttpClient http) : IAnalyzerApiClient
{
    public async Task<ClaimedJobDto?> ClaimAsync(string machineId, CancellationToken cancellationToken)
    {
        using var response = await http.PostAsJsonAsync(
            "api/v1/jobs/claim", new { machineId }, AgentJson.Wire, cancellationToken);

        if (response.StatusCode == HttpStatusCode.NoContent)
            return null;

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<ClaimedJobDto>(AgentJson.Wire, cancellationToken);
    }

    public async Task<AnalyzerFile?> DownloadFileAsync(Guid fileId, CancellationToken cancellationToken)
    {
        using var response = await http.GetAsync(
            $"api/v1/files/{fileId}", HttpCompletionOption.ResponseHeadersRead, cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
            return null;

        response.EnsureSuccessStatusCode();

        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
        var fileName = response.Content.Headers.ContentDisposition?.FileNameStar
            ?? response.Content.Headers.ContentDisposition?.FileName?.Trim('"')
            ?? fileId.ToString();

        return new AnalyzerFile(fileId, fileName, contentType, bytes);
    }

    public async Task CompleteAsync(Guid jobId, object resultData, CancellationToken cancellationToken)
    {
        // Serialize the result with the snake_case-enum options so the persisted
        // JSON matches the frontend unions, then embed it verbatim in the body.
        var element = JsonSerializer.SerializeToElement(resultData, AgentJson.Result);

        using var response = await http.PostAsJsonAsync(
            $"api/v1/jobs/{jobId}/complete", new { resultData = element }, AgentJson.Wire, cancellationToken);

        response.EnsureSuccessStatusCode();
    }

    public async Task FailAsync(Guid jobId, string error, CancellationToken cancellationToken)
    {
        using var response = await http.PostAsJsonAsync(
            $"api/v1/jobs/{jobId}/fail", new { error }, AgentJson.Wire, cancellationToken);

        response.EnsureSuccessStatusCode();
    }
}
