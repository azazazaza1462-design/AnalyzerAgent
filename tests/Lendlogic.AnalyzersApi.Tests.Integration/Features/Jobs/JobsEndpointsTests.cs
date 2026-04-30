using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using Lendlogic.Analyzers.DataAccess;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.Analyzers.DataAccess.Enums;
using Lendlogic.AnalyzersApi.Features.Jobs;
using Lendlogic.AnalyzersApi.Tests.Integration.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Lendlogic.AnalyzersApi.Tests.Integration.Features.Jobs;

[Collection("Database")]
public sealed class JobsEndpointsTests(PostgresFixture fixture) : IAsyncLifetime
{
    private readonly AnalyzersApiFactory _factory = fixture.Factory;
    private readonly HttpClient _client = fixture.Factory.CreateClient();

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task ListJobs_ReturnsEmpty_WhenNoData()
    {
        var response = await _client.GetAsync("/api/v1/jobs");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<PagedJobs>(JsonOptions);
        body!.Items.Should().BeEmpty();
        body.Total.Should().Be(0);
        body.Page.Should().Be(1);
        body.PageSize.Should().Be(25);
    }

    [Fact]
    public async Task ListJobs_ReturnsSeededData_WithPagination()
    {
        await SeedJobsAsync(count: 5);

        var response = await _client.GetAsync("/api/v1/jobs?page=1&pageSize=2");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<PagedJobs>(JsonOptions);
        body!.Items.Should().HaveCount(2);
        body.Total.Should().Be(5);
        body.Page.Should().Be(1);
        body.PageSize.Should().Be(2);
    }

    [Fact]
    public async Task ListJobs_FiltersByStatus()
    {
        await SeedJobsAsync(count: 2, status: JobStatus.Pending);
        await SeedJobsAsync(count: 3, status: JobStatus.Completed);

        var response = await _client.GetAsync("/api/v1/jobs?status=Completed");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<PagedJobs>(JsonOptions);
        body!.Total.Should().Be(3);
        body.Items.Should().OnlyContain(j => j.JobStatus == JobStatus.Completed);
    }

    [Fact]
    public async Task ListJobs_Returns400_OnInvalidPagination()
    {
        var response = await _client.GetAsync("/api/v1/jobs?page=0&pageSize=200");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetJob_Returns404_WhenNotFound()
    {
        var response = await _client.GetAsync($"/api/v1/jobs/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetJob_Returns200_WithDetail()
    {
        var jobId = await SeedJobAsync(JobStatus.InProgress, "machine-42");

        var response = await _client.GetAsync($"/api/v1/jobs/{jobId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JobDetail>(JsonOptions);
        body!.Id.Should().Be(jobId);
        body.JobStatus.Should().Be(JobStatus.InProgress);
        body.MachineId.Should().Be("machine-42");
        body.HasResult.Should().BeFalse();
        body.CallerName.Should().NotBeNullOrEmpty();
    }

    [Theory]
    [InlineData(JobStatus.Pending)]
    [InlineData(JobStatus.InProgress)]
    public async Task CancelJob_Returns204_WhenPendingOrInProgress(JobStatus startingStatus)
    {
        var jobId = await SeedJobAsync(startingStatus);

        var response = await _client.PostAsync($"/api/v1/jobs/{jobId}/cancel", content: null);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var detail = await _client.GetFromJsonAsync<JobDetail>($"/api/v1/jobs/{jobId}", JsonOptions);
        detail!.JobStatus.Should().Be(JobStatus.Cancelled);
        detail.FinishedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task CancelJob_Returns404_WhenNotFound()
    {
        var response = await _client.PostAsync($"/api/v1/jobs/{Guid.NewGuid()}/cancel", content: null);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CancelJob_Returns409_WhenAlreadyCompleted()
    {
        var jobId = await SeedJobAsync(JobStatus.Completed);

        var response = await _client.PostAsync($"/api/v1/jobs/{jobId}/cancel", content: null);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    private async Task<Guid> SeedCallerAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var caller = new Caller { Name = $"caller-{Guid.NewGuid():N}" };
        db.Callers.Add(caller);
        await db.SaveChangesAsync();
        return caller.Id;
    }

    private async Task SeedJobsAsync(int count, JobStatus status = JobStatus.Pending)
    {
        var callerId = await SeedCallerAsync();
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        for (var i = 0; i < count; i++)
        {
            db.Jobs.Add(new Job
            {
                CallerId = callerId,
                JobType = JobType.CreditAnalysis,
                JobStatus = status,
            });
        }
        await db.SaveChangesAsync();
    }

    private async Task<Guid> SeedJobAsync(JobStatus status, string? machineId = null)
    {
        var callerId = await SeedCallerAsync();
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var job = new Job
        {
            CallerId = callerId,
            JobType = JobType.CreditAnalysis,
            JobStatus = status,
            MachineId = machineId,
        };
        db.Jobs.Add(job);
        await db.SaveChangesAsync();
        return job.Id;
    }
}
