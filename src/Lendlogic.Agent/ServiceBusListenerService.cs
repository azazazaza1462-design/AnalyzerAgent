using Azure.Messaging.ServiceBus;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Lendlogic.Agent;

public class ServiceBusListenerService : BackgroundService
{
    private readonly ILogger<ServiceBusListenerService> _logger;
    private readonly IConfiguration _configuration;
    private ServiceBusProcessor? _processor;
    private ServiceBusClient? _client;

    public ServiceBusListenerService(ILogger<ServiceBusListenerService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var connectionString = _configuration["ServiceBus:ConnectionString"];
        var queueName = _configuration["ServiceBus:QueueName"];
        var topicName = _configuration["ServiceBus:TopicName"];
        var subscriptionName = _configuration["ServiceBus:SubscriptionName"];
        var maxConcurrentCalls = _configuration.GetValue<int>("ServiceBus:MaxConcurrentCalls", 1);
        var autoCompleteMessages = _configuration.GetValue<bool>("ServiceBus:AutoCompleteMessages", false);
        var prefetchCount = _configuration.GetValue<int>("ServiceBus:PrefetchCount", 0);
        var maxAutoLockRenewalDurationSeconds = _configuration.GetValue<int>("ServiceBus:MaxAutoLockRenewalDurationSeconds", 300);
        var receiveMode = _configuration.GetValue<string>("ServiceBus:ReceiveMode", "PeekLock");

        if (string.IsNullOrEmpty(connectionString))
        {
            _logger.LogError("Service Bus connection string is not configured");
            return;
        }

        _client = new ServiceBusClient(connectionString);

        var processorOptions = new ServiceBusProcessorOptions
        {
            MaxConcurrentCalls = maxConcurrentCalls,
            AutoCompleteMessages = autoCompleteMessages,
            PrefetchCount = prefetchCount,
            MaxAutoLockRenewalDuration = TimeSpan.FromSeconds(maxAutoLockRenewalDurationSeconds),
            ReceiveMode = receiveMode.Equals("ReceiveAndDelete", StringComparison.OrdinalIgnoreCase) 
                ? ServiceBusReceiveMode.ReceiveAndDelete 
                : ServiceBusReceiveMode.PeekLock
        };

        if (!string.IsNullOrEmpty(queueName))
        {
            _logger.LogInformation("Starting Service Bus listener for queue: {QueueName}", queueName);
            _processor = _client.CreateProcessor(queueName, processorOptions);
        }
        else if (!string.IsNullOrEmpty(topicName) && !string.IsNullOrEmpty(subscriptionName))
        {
            _logger.LogInformation("Starting Service Bus listener for topic: {TopicName}, subscription: {SubscriptionName}", 
                topicName, subscriptionName);
            _processor = _client.CreateProcessor(topicName, subscriptionName, processorOptions);
        }
        else
        {
            _logger.LogError("Either QueueName or both TopicName and SubscriptionName must be configured");
            return;
        }

        _processor.ProcessMessageAsync += MessageHandler;
        _processor.ProcessErrorAsync += ErrorHandler;

        await _processor.StartProcessingAsync(stoppingToken);
        _logger.LogInformation("Service Bus listener started successfully. Instance ID: {InstanceId}, Receive Mode: {ReceiveMode}", 
            Environment.MachineName, processorOptions.ReceiveMode);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task MessageHandler(ProcessMessageEventArgs args)
    {
        var startTime = DateTime.UtcNow;
        try
        {
            var body = args.Message.Body.ToString();
            _logger.LogInformation(
                "Instance {InstanceId} received message: {MessageId}, DeliveryCount: {DeliveryCount}, EnqueuedTime: {EnqueuedTime}, LockedUntil: {LockedUntil}", 
                Environment.MachineName, 
                args.Message.MessageId, 
                args.Message.DeliveryCount,
                args.Message.EnqueuedTime,
                args.Message.LockedUntil);

            // TODO: Process your message here
            // Example: await ProcessBusinessLogic(body);

            if (!_configuration.GetValue<bool>("ServiceBus:AutoCompleteMessages", false))
            {
                await args.CompleteMessageAsync(args.Message);
                var processingTime = DateTime.UtcNow - startTime;
                _logger.LogInformation("Instance {InstanceId} completed message {MessageId} in {ProcessingTime}ms", 
                    Environment.MachineName, 
                    args.Message.MessageId, 
                    processingTime.TotalMilliseconds);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Instance {InstanceId} error processing message {MessageId}", 
                Environment.MachineName, 
                args.Message.MessageId);
            await args.AbandonMessageAsync(args.Message);
        }
    }

    private Task ErrorHandler(ProcessErrorEventArgs args)
    {
        _logger.LogError(args.Exception, "Error in Service Bus processor. Source: {ErrorSource}, Entity Path: {EntityPath}",
            args.ErrorSource, args.EntityPath);
        return Task.CompletedTask;
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stopping Service Bus listener...");

        if (_processor != null)
        {
            await _processor.StopProcessingAsync(cancellationToken);
            await _processor.DisposeAsync();
        }

        if (_client != null)
        {
            await _client.DisposeAsync();
        }

        _logger.LogInformation("Service Bus listener stopped");
        await base.StopAsync(cancellationToken);
    }
}
