using FluentAssertions;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.Analyzers.DataAccess.Enums;
using Lendlogic.AnalyzersApi.Features.Jobs.Cancel;
using Lendlogic.AnalyzersApi.Tests.Infrastructure;

namespace Lendlogic.AnalyzersApi.Tests.Features.Jobs;

public sealed class CancelJobHandlerTests(TestDatabaseFixture fixture)
    : IntegrationTestBase(fixture), IAsyncLifetime
{
    public Task InitializeAsync() => Fixture.ResetAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task ReturnsNotFound_WhenJobDoesNotExist()
    {
        await using var db = Fixture.CreateContext();
        var handler = new CancelJobHandler(db);

        var result = await handler.Handle(
            new CancelJobCommand(Guid.NewGuid()), CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Job.NotFound");
    }

    [Theory]
    [InlineData(JobStatus.Pending)]
    [InlineData(JobStatus.InProgress)]
    public async Task CancelsJob_WhenStatusIsPendingOrInProgress(JobStatus startingStatus)
    {
        var job = await SeedJobAsync(startingStatus);

        await using var db = Fixture.CreateContext();
        var handler = new CancelJobHandler(db);

        var result = await handler.Handle(new CancelJobCommand(job.Id), CancellationToken.None);

        result.IsError.Should().BeFalse();

        await using var verify = Fixture.CreateContext();
        var stored = await verify.Jobs.FindAsync(job.Id);
        stored!.JobStatus.Should().Be(JobStatus.Cancelled);
        stored.FinishedAt.Should().NotBeNull();
        stored.FinishedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Theory]
    [InlineData(JobStatus.Completed)]
    [InlineData(JobStatus.Failed)]
    [InlineData(JobStatus.Cancelled)]
    public async Task ReturnsConflict_WhenJobIsTerminal(JobStatus terminalStatus)
    {
        var job = await SeedJobAsync(terminalStatus);

        await using var db = Fixture.CreateContext();
        var handler = new CancelJobHandler(db);

        var result = await handler.Handle(new CancelJobCommand(job.Id), CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Job.InvalidTransition");
    }

    private async Task<Job> SeedJobAsync(JobStatus status)
    {
        var caller = new Caller { Name = $"caller-{Guid.NewGuid():N}" };
        var job = new Job
        {
            Caller = caller,
            JobType = JobType.CreditAnalysis,
            JobStatus = status,
        };

        await using var seed = Fixture.CreateContext();
        seed.Jobs.Add(job);
        await seed.SaveChangesAsync();
        return job;
    }
}
