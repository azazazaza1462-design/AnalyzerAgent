using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Lendlogic.Agent;

/// <summary>
/// Local/dev trigger. When the agent is configured for polling
/// (<c>Agent:Trigger=poll</c>, the default), this drives the same
/// <see cref="JobProcessor"/> as the Service Bus listener by repeatedly calling
/// the API's claim endpoint. It drains the queue (processes back-to-back while
/// jobs exist), then waits <c>Agent:PollIntervalSeconds</c> when it finds none.
/// In production, <see cref="ServiceBusListenerService"/> is registered instead.
/// </summary>
public sealed class PollingJobService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<PollingJobService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromSeconds(
            configuration.GetValue("Agent:PollIntervalSeconds", 5));

        logger.LogInformation(
            "Polling job service started (no Service Bus). Poll interval: {Seconds}s",
            interval.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<JobProcessor>();

                // Drain: keep going while there is work, then fall through to wait.
                if (await processor.ProcessNextAsync(Environment.MachineName, stoppingToken))
                    continue;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Polling iteration failed; backing off for {Seconds}s.",
                    interval.TotalSeconds);
            }

            try
            {
                await Task.Delay(interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        logger.LogInformation("Polling job service stopped.");
    }
}
