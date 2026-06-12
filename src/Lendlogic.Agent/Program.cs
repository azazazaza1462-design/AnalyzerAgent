using Lendlogic.Agent;
using Lendlogic.Agent.Api;
using Lendlogic.Agent.Core.Analysis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = Host.CreateApplicationBuilder(args);

builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

// Typed API client — base URL + agent API key (X-Api-Key) from config.
builder.Services.AddHttpClient<IAnalyzerApiClient, AnalyzerApiClient>((sp, http) =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var baseUrl = config["Api:BaseUrl"]
        ?? throw new InvalidOperationException("Api:BaseUrl is not configured.");
    http.BaseAddress = new Uri(baseUrl.EndsWith('/') ? baseUrl : baseUrl + "/");

    var apiKey = config["Api:ApiKey"];
    if (!string.IsNullOrWhiteSpace(apiKey))
        http.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
});

// Analyzers (one per JobType) + the per-message orchestrator.
builder.Services.AddSingleton<IDocumentAnalyzer, IdValidationAnalyzer>();
builder.Services.AddScoped<JobProcessor>();

builder.Services.AddHostedService<ServiceBusListenerService>();

var host = builder.Build();

await host.RunAsync();

