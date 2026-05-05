using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using Lendlogic.Analyzers.DataAccess;
using Lendlogic.Analyzers.DataAccess.Entities;
using Lendlogic.AnalyzersApi.Features.Files;
using Lendlogic.AnalyzersApi.Tests.Integration.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Lendlogic.AnalyzersApi.Tests.Integration.Features.Files;

[Collection("Database")]
public sealed class FilesEndpointsTests(PostgresFixture fixture) : IAsyncLifetime
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
    public async Task ListFiles_ReturnsEmpty_WhenNoData()
    {
        var response = await _client.GetAsync("/api/v1/files");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<PagedFiles>(JsonOptions);
        body!.Items.Should().BeEmpty();
        body.Total.Should().Be(0);
        body.Page.Should().Be(1);
        body.PageSize.Should().Be(25);
    }

    [Fact]
    public async Task ListFiles_ReturnsSeededData_WithPagination()
    {
        await SeedFilesAsync("a.pdf", "b.pdf", "c.pdf", "d.pdf", "e.pdf");

        var response = await _client.GetAsync("/api/v1/files?page=1&pageSize=2");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<PagedFiles>(JsonOptions);
        body!.Items.Should().HaveCount(2);
        body.Total.Should().Be(5);
        body.Page.Should().Be(1);
        body.PageSize.Should().Be(2);
    }

    [Fact]
    public async Task ListFiles_FiltersBySearch_CaseInsensitive()
    {
        await SeedFilesAsync("Report-2024.pdf", "invoice.pdf", "report-2023.csv");

        var response = await _client.GetAsync("/api/v1/files?search=report");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<PagedFiles>(JsonOptions);
        body!.Total.Should().Be(2);
    }

    [Fact]
    public async Task ListFiles_Returns400_OnInvalidPagination()
    {
        var response = await _client.GetAsync("/api/v1/files?page=0&pageSize=200");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private async Task SeedFilesAsync(params string[] names)
    {
        for (var i = 0; i < names.Length; i++)
        {
            await using var scope = _factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Files.Add(new FileAsset
            {
                FileName = names[i],
                ContentType = "application/pdf",
                SizeBytes = 1024 * (i + 1),
                StoragePath = $"/tmp/{names[i]}",
            });
            await db.SaveChangesAsync();
            await Task.Delay(10);
        }
    }
}
