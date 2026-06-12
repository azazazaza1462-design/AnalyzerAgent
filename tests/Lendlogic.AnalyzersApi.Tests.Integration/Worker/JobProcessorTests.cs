using FluentAssertions;
using Lendlogic.Agent;
using Lendlogic.Agent.Api;
using Lendlogic.Agent.Core.Analysis;
using Lendlogic.Analyzers.DataAccess;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.Analyzers.DataAccess.Enums;
using Lendlogic.AnalyzersApi.Tests.Integration.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Lendlogic.AnalyzersApi.Tests.Integration.Worker;

/// <summary>
/// Phase 1 skeleton, end-to-end: the worker's JobProcessor drives the real API
/// (claim → complete/fail) against a Testcontainers Postgres. Verifies the
/// LOS → API → agent → job_results loop with the canned analyzer result.
/// </summary>
[Collection("Database")]
public sealed class JobProcessorTests(PostgresFixture fixture) : IAsyncLifetime
{
    private readonly AnalyzersApiFactory _factory = fixture.Factory;

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private JobProcessor CreateProcessor()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", "test-agent-key");
        var api = new AnalyzerApiClient(client);
        return new JobProcessor(api, [new IdValidationAnalyzer()], NullLogger<JobProcessor>.Instance);
    }

    [Fact]
    public async Task ProcessNext_ReturnsFalse_WhenQueueEmpty()
    {
        var processor = CreateProcessor();

        var processed = await processor.ProcessNextAsync("test-machine", CancellationToken.None);

        processed.Should().BeFalse();
    }

    [Fact]
    public async Task ProcessNext_CompletesIdValidationJob_WithCannedResult()
    {
        var jobId = await SeedPendingJobAsync(JobType.IdValidation);

        var processor = CreateProcessor();
        var processed = await processor.ProcessNextAsync("test-machine", CancellationToken.None);

        processed.Should().BeTrue();

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var job = await db.Jobs.AsNoTracking().FirstAsync(j => j.Id == jobId);
        job.JobStatus.Should().Be(JobStatus.Completed);

        var result = await db.JobResults.AsNoTracking().FirstAsync(r => r.JobId == jobId);
        result.Status.Should().Be(ResultStatus.Success);

        // Stored JSON must match the frontend unions: camelCase props, snake_case enums.
        var root = result.ResultData!.RootElement;
        root.GetProperty("verdict").GetString().Should().Be("needs_review");
        root.GetProperty("checks")[0].GetProperty("status").GetString().Should().Be("not_applicable");
        root.GetProperty("calls")[0].GetProperty("step").GetString().Should().Be("ingest");
    }

    [Fact]
    public async Task ProcessNext_FailsJob_WhenNoAnalyzerForType()
    {
        // Only IdValidation is registered; a CreditAnalysis job has no analyzer.
        var jobId = await SeedPendingJobAsync(JobType.CreditAnalysis);

        var processor = CreateProcessor();
        var processed = await processor.ProcessNextAsync("test-machine", CancellationToken.None);

        processed.Should().BeTrue();

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var job = await db.Jobs.AsNoTracking().FirstAsync(j => j.Id == jobId);
        job.JobStatus.Should().Be(JobStatus.Failed);
    }

    private async Task<Guid> SeedPendingJobAsync(JobType jobType)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var caller = new Caller { Name = $"caller-{Guid.NewGuid():N}" };
        db.Callers.Add(caller);
        await db.SaveChangesAsync();

        var job = new Job
        {
            CallerId = caller.Id,
            JobType = jobType,
            JobStatus = JobStatus.Pending,
        };
        db.Jobs.Add(job);
        await db.SaveChangesAsync();
        return job.Id;
    }
}
