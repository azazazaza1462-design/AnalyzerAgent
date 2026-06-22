using Lendlogic.Agent;
using Lendlogic.Agent.Api;
using Lendlogic.Agent.Core.Analysis;
using Lendlogic.Agent.Core.Claude;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

// ContentRootPath = output directory (where appsettings.json is copied) so the
// host's default config sources load regardless of the working directory
// (e.g. `dotnet run --project ...` from the repo root). Relying on the default
// sources keeps the correct precedence: appsettings -> user-secrets (Dev) ->
// environment variables, so the user-secret Claude:ApiKey wins over the empty
// placeholder in appsettings.json.
var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
});

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

// Claude vision (Sonnet 4.6) — key from config or the ANTHROPIC_API_KEY env var.
var claudeOptions = new ClaudeOptions();
builder.Configuration.GetSection(ClaudeOptions.SectionName).Bind(claudeOptions);
if (string.IsNullOrWhiteSpace(claudeOptions.ApiKey))
    claudeOptions.ApiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY") ?? "";
builder.Services.AddSingleton(claudeOptions);
builder.Services.AddSingleton<IClaudeVisionClient, ClaudeVisionClient>();

// Analyzers (one per JobType) + the per-message orchestrator.
builder.Services.AddSingleton<IDocumentAnalyzer, IdValidationAnalyzer>();
builder.Services.AddScoped<JobProcessor>();

// Trigger: Service Bus in production, poll the API in local/dev. Defaults to
// poll so the agent runs end-to-end without a Service Bus namespace.
var trigger = builder.Configuration["Agent:Trigger"] ?? "poll";
if (string.Equals(trigger, "servicebus", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddHostedService<ServiceBusListenerService>();
else
    builder.Services.AddHostedService<PollingJobService>();

var host = builder.Build();

await host.RunAsync();

