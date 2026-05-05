using System.Text;
using System.Text.Json;
using FluentAssertions;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.Analyzers.DataAccess.Enums;
using Lendlogic.AnalyzersApi.Features.Jobs.Download;
using Lendlogic.AnalyzersApi.Tests.Infrastructure;

namespace Lendlogic.AnalyzersApi.Tests.Features.Jobs;

public sealed class GetJobResultHandlerTests(TestDatabaseFixture fixture)
    : IntegrationTestBase(fixture), IAsyncLifetime
{
    public Task InitializeAsync() => Fixture.ResetAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task ReturnsNotFound_WhenJobDoesNotExist()
    {
        await using var db = Fixture.CreateContext();
        var handler = new GetJobResultHandler(db);

        var result = await handler.Handle(
            new GetJobResultQuery(Guid.NewGuid()), CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Job.NotFound");
    }

    [Fact]
    public async Task ReturnsNotFound_WhenJobHasNoResultRow()
    {
        var job = await SeedJobAsync();

        await using var db = Fixture.CreateContext();
        var handler = new GetJobResultHandler(db);

        var result = await handler.Handle(new GetJobResultQuery(job.Id), CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("JobResult.NotFound");
    }

    [Fact]
    public async Task ReturnsNotFound_WhenResultDataIsNull()
    {
        var job = await SeedJobAsync();
        await using (var seed = Fixture.CreateContext())
        {
            seed.JobResults.Add(new JobResult
            {
                JobId = job.Id,
                ResultData = null,
                Status = ResultStatus.Success,
            });
            await seed.SaveChangesAsync();
        }

        await using var db = Fixture.CreateContext();
        var handler = new GetJobResultHandler(db);

        var result = await handler.Handle(new GetJobResultQuery(job.Id), CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("JobResult.NotFound");
    }

    [Fact]
    public async Task ReturnsResultBytes_WhenJobHasResult()
    {
        var job = await SeedJobAsync();
        var payload = JsonDocument.Parse("""{"score":0.85,"approved":true}""");
        await using (var seed = Fixture.CreateContext())
        {
            seed.JobResults.Add(new JobResult
            {
                JobId = job.Id,
                ResultData = payload,
                Status = ResultStatus.Success,
            });
            await seed.SaveChangesAsync();
        }

        await using var db = Fixture.CreateContext();
        var handler = new GetJobResultHandler(db);

        var result = await handler.Handle(new GetJobResultQuery(job.Id), CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.ContentType.Should().Be("application/json");
        result.Value.FileName.Should().Be($"job-{job.Id}.json");
        Encoding.UTF8.GetString(result.Value.Content)
            .Should().Contain("\"score\"").And.Contain("0.85");
    }

    private async Task<Job> SeedJobAsync()
    {
        var caller = new Caller { Name = $"caller-{Guid.NewGuid():N}" };
        var job = new Job
        {
            Caller = caller,
            JobType = JobType.CreditAnalysis,
            JobStatus = JobStatus.Completed,
        };

        await using var seed = Fixture.CreateContext();
        seed.Jobs.Add(job);
        await seed.SaveChangesAsync();
        return job;
    }
}
