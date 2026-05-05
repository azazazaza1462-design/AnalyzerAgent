using Lendlogic.Analyzers.DataAccess;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Lendlogic.AnalyzersApi.Tests.Infrastructure;

public sealed class TestDatabaseFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:18-alpine")
        .WithDatabase("analyzers_test")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    private NpgsqlDataSource? _dataSource;

    public ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(_dataSource!)
            .UseSnakeCaseNamingConvention()
            .Options;

        return new ApplicationDbContext(options);
    }

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        var builder = new NpgsqlDataSourceBuilder(_container.GetConnectionString());
        builder.EnableDynamicJson();
        _dataSource = builder.Build();

        await using var context = CreateContext();
        await context.Database.EnsureCreatedAsync();
    }

    public async Task ResetAsync()
    {
        await using var context = CreateContext();
        var tables = context.Model.GetEntityTypes()
            .Select(t => t.GetTableName())
            .Where(t => t is not null)
            .Distinct()
            .ToList();

        if (tables.Count == 0) return;

        var tableList = string.Join(", ", tables.Select(t => $@"app.""{t}"""));
        await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE " + tableList + " CASCADE;");
    }

    public async Task DisposeAsync()
    {
        if (_dataSource is not null) await _dataSource.DisposeAsync();
        await _container.DisposeAsync();
    }
}

[CollectionDefinition("Database")]
public class DatabaseCollection : ICollectionFixture<TestDatabaseFixture>;
