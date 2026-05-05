using FluentAssertions;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.AnalyzersApi.Features.Files.List;
using Lendlogic.AnalyzersApi.Tests.Infrastructure;

namespace Lendlogic.AnalyzersApi.Tests.Features.Files;

public sealed class ListFilesHandlerTests(TestDatabaseFixture fixture)
    : IntegrationTestBase(fixture), IAsyncLifetime
{
    public Task InitializeAsync() => Fixture.ResetAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task ReturnsEmpty_WhenNoFiles()
    {
        await using var db = Fixture.CreateContext();
        var handler = new ListFilesHandler(db);

        var result = await handler.Handle(
            new ListFilesQuery(null, 1, 25), CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Items.Should().BeEmpty();
        result.Value.Total.Should().Be(0);
    }

    [Fact]
    public async Task ReturnsAll_OrderedByCreatedAtDescending()
    {
        await SeedFilesAsync("alpha.pdf", "beta.pdf", "gamma.pdf");

        await using var db = Fixture.CreateContext();
        var handler = new ListFilesHandler(db);

        var result = await handler.Handle(
            new ListFilesQuery(null, 1, 25), CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Items.Should().HaveCount(3);
        result.Value.Total.Should().Be(3);
        result.Value.Items[0].FileName.Should().Be("gamma.pdf");
        result.Value.Items[2].FileName.Should().Be("alpha.pdf");
    }

    [Fact]
    public async Task FiltersByFileName_CaseInsensitive()
    {
        await SeedFilesAsync("Report-2024.pdf", "invoice.pdf", "report-2023.csv");

        await using var db = Fixture.CreateContext();
        var handler = new ListFilesHandler(db);

        var result = await handler.Handle(
            new ListFilesQuery("report", 1, 25), CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Total.Should().Be(2);
        result.Value.Items.Should().OnlyContain(f =>
            f.FileName.Contains("report", StringComparison.OrdinalIgnoreCase) ||
            f.FileName.Contains("Report", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Paginates()
    {
        var names = Enumerable.Range(1, 5).Select(i => $"file-{i}.pdf").ToArray();
        await SeedFilesAsync(names);

        await using var db = Fixture.CreateContext();
        var handler = new ListFilesHandler(db);

        var result = await handler.Handle(
            new ListFilesQuery(null, 2, 2), CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Total.Should().Be(5);
        result.Value.Items.Should().HaveCount(2);
        result.Value.Page.Should().Be(2);
        result.Value.PageSize.Should().Be(2);
    }

    private async Task SeedFilesAsync(params string[] names)
    {
        for (var i = 0; i < names.Length; i++)
        {
            await using var seed = Fixture.CreateContext();
            seed.Files.Add(new FileAsset
            {
                FileName = names[i],
                ContentType = "application/pdf",
                SizeBytes = 1024 * (i + 1),
                StoragePath = $"/tmp/{names[i]}",
            });
            await seed.SaveChangesAsync();
            await Task.Delay(10);
        }
    }
}
