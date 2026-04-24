using Carter;
using Lendlogic.AnalyzersApi.Common.Middleware;
using Lendlogic.AnalyzersApi.Data;
using Microsoft.EntityFrameworkCore;
using Serilog;

namespace Lendlogic.AnalyzersApi.Common.Extensions;

public static class WebApplicationExtensions
{
    public static async Task MigrateDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await db.Database.MigrateAsync();
    }

    public static WebApplication UseRequestPipeline(this WebApplication app)
    {
        // Correlation ID (before request logging so logs include it)
        app.UseMiddleware<CorrelationIdMiddleware>();

        // Serilog request logging
        app.UseSerilogRequestLogging(options =>
        {
            options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
            {
                diagnosticContext.Set("ClientIp",
                    httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");

                if (httpContext.Items.TryGetValue(CorrelationIdMiddleware.ItemsKey, out var correlationId))
                {
                    diagnosticContext.Set("CorrelationId", correlationId!);
                }
            };
        });

        // Exception handler
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                var feature = context.Features
                    .Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();

                if (feature?.Error is not null)
                {
                    var cid = context.Items.TryGetValue(CorrelationIdMiddleware.ItemsKey, out var id)
                        ? id?.ToString()
                        : null;

                    Log.Error(feature.Error,
                        "Unhandled exception. Path: {Path}, CorrelationId: {CorrelationId}",
                        context.Request.Path, cid);
                }

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"error\":\"Internal Server Error\"}");
            });
        });

        // Swagger API docs
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.DocumentTitle = "Lendlogic Analyzers API";
        });

        app.UseCors();
        app.UseRateLimiter();

        app.UseAuthentication();
        app.UseAuthorization();

        // Health check (anonymous probe for orchestrators/uptime checks)
        app.MapHealthChecks("/health").AllowAnonymous();

        // Dev convenience: GET / → Swagger UI (production returns 404)
        if (app.Environment.IsDevelopment())
        {
            app.MapGet("/", () => Results.Redirect("/swagger"))
                .ExcludeFromDescription()
                .AllowAnonymous();
        }

        // Carter endpoints
        app.MapCarter();

        return app;
    }
}
