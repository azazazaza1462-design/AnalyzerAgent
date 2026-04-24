using Testcontainers.PostgreSql;
using Xunit;

namespace Lendlogic.AnalyzersApi.Tests.Integration.Infrastructure;

public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:18-alpine")
        .WithDatabase("analyzers_test")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    public AnalyzersApiFactory Factory { get; private set; } = default!;

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        Factory = new AnalyzersApiFactory(_container.GetConnectionString());
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();
        await _container.DisposeAsync();
    }
}
