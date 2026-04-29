using FluentAssertions;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.Analyzers.DataAccess.Enums;
using Lendlogic.AnalyzersApi.Features.Jobs.Get;
using Lendlogic.AnalyzersApi.Tests.Infrastructure;

namespace Lendlogic.AnalyzersApi.Tests.Features.Jobs;

public sealed class GetJobHandlerTests(TestDatabaseFixture fixture)
    : IntegrationTestBase(fixture), IAsyncLifetime
{
    public Task InitializeAsync() => Fixture.ResetAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task ReturnsNotFound_WhenJobDoesNotExist()
    {
        await using var db = Fixture.CreateContext();
        var handler = new GetJobHandler(db);

        var result = await handler.Handle(
            new GetJobQuery(Guid.NewGuid()), CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Job.NotFound");
    }

    [Fact]
    public async Task ReturnsJobDetail_WhenJobExists()
    {
        var caller = new Caller { Name = $"caller-{Guid.NewGuid():N}" };
        var job = new Job
        {
            Caller = caller,
            JobType = JobType.RiskAssessment,
            JobStatus = JobStatus.InProgress,
            MachineId = "machine-1",
            Attachments = [Guid.NewGuid(), Guid.NewGuid()],
        };

        await using (var seed = Fixture.CreateContext())
        {
            seed.Jobs.Add(job);
            await seed.SaveChangesAsync();
        }

        await using var db = Fixture.CreateContext();
        var handler = new GetJobHandler(db);

        var result = await handler.Handle(new GetJobQuery(job.Id), CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Id.Should().Be(job.Id);
        result.Value.JobType.Should().Be(JobType.RiskAssessment);
        result.Value.JobStatus.Should().Be(JobStatus.InProgress);
        result.Value.CallerName.Should().Be(caller.Name);
        result.Value.MachineId.Should().Be("machine-1");
        result.Value.Attachments.Should().HaveCount(2);
        result.Value.HasResult.Should().BeFalse();
    }

    [Fact]
    public async Task ReportsHasResult_WhenJobHasResults()
    {
        var caller = new Caller { Name = $"caller-{Guid.NewGuid():N}" };
        var job = new Job
        {
            Caller = caller,
            JobType = JobType.CreditAnalysis,
            JobStatus = JobStatus.Completed,
        };
        var jobResult = new JobResult
        {
            Job = job,
            Status = ResultStatus.Success,
        };

        await using (var seed = Fixture.CreateContext())
        {
            seed.Jobs.Add(job);
            seed.JobResults.Add(jobResult);
            await seed.SaveChangesAsync();
        }

        await using var db = Fixture.CreateContext();
        var handler = new GetJobHandler(db);

        var result = await handler.Handle(new GetJobQuery(job.Id), CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.HasResult.Should().BeTrue();
    }
}
