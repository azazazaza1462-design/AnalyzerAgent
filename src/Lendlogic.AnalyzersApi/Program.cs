using Lendlogic.Analyzers.DataAccess.Extensions;
using Lendlogic.AnalyzersApi.Common.Extensions;
using Serilog;

// ─── Serilog bootstrap ───
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ─── Serilog ───
    builder.Host.UseSerilog((ctx, lc) => lc
        .ReadFrom.Configuration(ctx.Configuration));

    // ─── HTTP basics ───
    builder.Services.AddHttpContextAccessor();

    // ─── Health Checks ───
    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("Application")!);

    // ─── Service registration ───
    builder.Services
        .AddCorsPolicy(builder.Configuration, builder.Environment)
        .AddAuthenticationServices(builder.Configuration)
        .AddRateLimiting()
        .AddAnalyzersDataAccess(builder.Configuration)
        .AddApplicationServices(builder.Configuration, builder.Environment);

    // ═══════════════════════════════════════
    var app = builder.Build();
    // ═══════════════════════════════════════

    await app.MigrateDatabaseAsync();

    app.UseRequestPipeline();

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program;
