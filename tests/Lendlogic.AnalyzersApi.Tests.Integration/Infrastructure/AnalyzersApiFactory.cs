using Lendlogic.Analyzers.DataAccess;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Lendlogic.AnalyzersApi.Tests.Integration.Infrastructure;

public sealed class AnalyzersApiFactory : WebApplicationFactory<Program>
{
    private readonly string _connectionString;

    public AnalyzersApiFactory(string connectionString)
    {
        _connectionString = connectionString;
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        Environment.SetEnvironmentVariable("ConnectionStrings__Application", _connectionString);
        Environment.SetEnvironmentVariable("Cors__AllowedOrigins__0", "https://test.lendlogic.com");
        Environment.SetEnvironmentVariable("Jwt__Key", "TestOnlySigningKey-Must-Be-At-Least-32-Characters-Long!");
        Environment.SetEnvironmentVariable("AzureAd__TenantId", "00000000-0000-0000-0000-000000000000");
        Environment.SetEnvironmentVariable("AzureAd__Audience", "00000000-0000-0000-0000-000000000000");
        try
        {
            return base.CreateHost(builder);
        }
        finally
        {
            Environment.SetEnvironmentVariable("ConnectionStrings__Application", null);
            Environment.SetEnvironmentVariable("Cors__AllowedOrigins__0", null);
            Environment.SetEnvironmentVariable("Jwt__Key", null);
            Environment.SetEnvironmentVariable("AzureAd__TenantId", null);
            Environment.SetEnvironmentVariable("AzureAd__Audience", null);
        }
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));

            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseNpgsql(_connectionString)
                    .UseSnakeCaseNamingConvention();
            });
        });
    }

    public async Task ResetDatabaseAsync()
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var tables = db.Model.GetEntityTypes()
            .Select(t => t.GetTableName())
            .Where(t => t is not null)
            .Distinct()
            .ToList();

        if (tables.Count == 0) return;

        var tableList = string.Join(", ", tables.Select(t => $@"app.""{t}"""));
        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE " + tableList + " CASCADE;");
    }
}
