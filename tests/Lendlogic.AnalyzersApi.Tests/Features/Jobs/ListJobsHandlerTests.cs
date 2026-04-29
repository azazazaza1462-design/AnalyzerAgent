using FluentAssertions;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.Analyzers.DataAccess.Enums;
using Lendlogic.AnalyzersApi.Features.Jobs;
using Lendlogic.AnalyzersApi.Features.Jobs.List;
using Lendlogic.AnalyzersApi.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Lendlogic.AnalyzersApi.Tests.Features.Jobs;

public sealed class ListJobsHandlerTests(TestDatabaseFixture fixture)
    : IntegrationTestBase(fixture), IAsyncLifetime
{
    public Task InitializeAsync() => Fixture.ResetAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task ReturnsEmpty_WhenNoJobs()
    {
        await using var db = Fixture.CreateContext();
        var handler = new ListJobsHandler(db);

        var result = await handler.Handle(
            new ListJobsQuery(null, null, null, 1, 25), CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Items.Should().BeEmpty();
        result.Value.Total.Should().Be(0);
        result.Value.Page.Should().Be(1);
        result.Value.PageSize.Should().Be(25);
    }

    [Fact]
    public async Task ReturnsAllJobs_OrderedByCreatedAtDesc()
    {
        await SeedJobsAsync(count: 3);

        await using var db = Fixture.CreateContext();
        var handler = new ListJobsHandler(db);

        var result = await handler.Handle(
            new ListJobsQuery(null, null, null, 1, 25), CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Items.Should().HaveCount(3);
        result.Value.Total.Should().Be(3);
        result.Value.Items.Should().BeInDescendingOrder(j => j.CreatedAt);
    }

    [Fact]
    public async Task FiltersByStatus()
    {
        await SeedJobsAsync(count: 2, status: JobStatus.Pending);
        await SeedJobsAsync(count: 3, status: JobStatus.Completed);

        await using var db = Fixture.CreateContext();
        var handler = new ListJobsHandler(db);

        var result = await handler.Handle(
            new ListJobsQuery(JobStatus.Completed, null, null, 1, 25), CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Items.Should().HaveCount(3);
        result.Value.Items.Should().OnlyContain(j => j.JobStatus == JobStatus.Completed);
        result.Value.Total.Should().Be(3);
    }

    [Fact]
    public async Task PaginatesResults()
    {
        await SeedJobsAsync(count: 7);

        await using var db = Fixture.CreateContext();
        var handler = new ListJobsHandler(db);

        var page1 = await handler.Handle(
            new ListJobsQuery(null, null, null, 1, 3), CancellationToken.None);
        var page2 = await handler.Handle(
            new ListJobsQuery(null, null, null, 2, 3), CancellationToken.None);
        var page3 = await handler.Handle(
            new ListJobsQuery(null, null, null, 3, 3), CancellationToken.None);

        page1.Value.Items.Should().HaveCount(3);
        page2.Value.Items.Should().HaveCount(3);
        page3.Value.Items.Should().HaveCount(1);
        page1.Value.Total.Should().Be(7);
        page1.Value.Items.Select(i => i.Id)
            .Should().NotIntersectWith(page2.Value.Items.Select(i => i.Id));
    }

    [Fact]
    public async Task FiltersByDateRange()
    {
        var caller = await SeedCallerAsync();
        var now = DateTime.UtcNow;

        Job j1, j2, j3;
        await using (var seed = Fixture.CreateContext())
        {
            j1 = new Job { CallerId = caller.Id, JobType = JobType.CreditAnalysis, JobStatus = JobStatus.Pending };
            j2 = new Job { CallerId = caller.Id, JobType = JobType.CreditAnalysis, JobStatus = JobStatus.Pending };
            j3 = new Job { CallerId = caller.Id, JobType = JobType.CreditAnalysis, JobStatus = JobStatus.Pending };
            seed.Jobs.AddRange(j1, j2, j3);
            await seed.SaveChangesAsync();
        }

        await using (var fix = Fixture.CreateContext())
        {
            await fix.Database.ExecuteSqlRawAsync(
                @"UPDATE app.""jobs"" SET created_at = {0} WHERE id = {1}",
                now.AddDays(-10), j1.Id);
            await fix.Database.ExecuteSqlRawAsync(
                @"UPDATE app.""jobs"" SET created_at = {0} WHERE id = {1}",
                now.AddDays(-5), j2.Id);
            await fix.Database.ExecuteSqlRawAsync(
                @"UPDATE app.""jobs"" SET created_at = {0} WHERE id = {1}",
                now.AddDays(-1), j3.Id);
        }

        await using var db = Fixture.CreateContext();
        var handler = new ListJobsHandler(db);

        var result = await handler.Handle(
            new ListJobsQuery(null, now.AddDays(-7), now.AddDays(-2), 1, 25), CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Items.Should().HaveCount(1);
        result.Value.Total.Should().Be(1);
    }

    private async Task<Caller> SeedCallerAsync()
    {
        await using var db = Fixture.CreateContext();
        var caller = new Caller { Name = $"caller-{Guid.NewGuid():N}" };
        db.Callers.Add(caller);
        await db.SaveChangesAsync();
        return caller;
    }

    private async Task SeedJobsAsync(int count, JobStatus status = JobStatus.Pending)
    {
        var caller = await SeedCallerAsync();
        await using var db = Fixture.CreateContext();
        for (var i = 0; i < count; i++)
        {
            db.Jobs.Add(new Job
            {
                CallerId = caller.Id,
                JobType = JobType.CreditAnalysis,
                JobStatus = status,
            });
            await db.SaveChangesAsync();
        }
    }
}
