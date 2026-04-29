using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Lendlogic.Analyzers.DataAccess.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAnalyzersDataAccess(
        this IServiceCollection services,
        IConfiguration config,
        string connectionStringName = "Application")
    {
        var dataSourceBuilder = new NpgsqlDataSourceBuilder(
            config.GetConnectionString(connectionStringName));
        dataSourceBuilder.EnableDynamicJson();
        var dataSource = dataSourceBuilder.Build();

        services.AddSingleton(dataSource);

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(dataSource)
                .UseSnakeCaseNamingConvention();
        });

        return services;
    }
}
