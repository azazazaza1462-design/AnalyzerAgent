using System.Text.Json;
using Anthropic;
using Anthropic.Models.Messages;

namespace Lendlogic.Agent.Core.Claude;

/// <summary>
/// Real Claude vision client over the official Anthropic C# SDK. Sends the
/// document images plus a prompt and forces schema-constrained JSON via
/// output_config.format. The SDK handles 429/5xx/overloaded retries with
/// exponential backoff (MaxRetries).
/// </summary>
public sealed class ClaudeVisionClient : IClaudeVisionClient
{
    private readonly ClaudeOptions _options;
    private readonly AnthropicClient _client;

    public ClaudeVisionClient(ClaudeOptions options)
    {
        _options = options;
        _client = new AnthropicClient { ApiKey = options.ApiKey, MaxRetries = options.MaxRetries };
    }

    public async Task<ClaudeVisionResponse> ExtractAsync(
        ClaudeVisionRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var blocks = new List<ContentBlockParam>(request.Media.Count + 1);
        foreach (var item in request.Media)
        {
            var mediaType = (item.MediaType ?? string.Empty).ToLowerInvariant();
            if (mediaType == "application/pdf")
            {
                // PDFs go in as a native document block (no rasterization).
                blocks.Add(new ContentBlockParam(new DocumentBlockParam
                {
                    Source = new Base64PdfSource { Data = Convert.ToBase64String(item.Data) },
                }));
            }
            else
            {
                blocks.Add(new ContentBlockParam(new ImageBlockParam(
                    new ImageBlockParamSource(new Base64ImageSource
                    {
                        Data = Convert.ToBase64String(item.Data),
                        MediaType = ToImageMediaType(mediaType),
                    }))));
            }
        }
        blocks.Add(new ContentBlockParam(new TextBlockParam(request.UserText)));

        var parameters = new MessageCreateParams
        {
            Model = _options.Model,
            MaxTokens = request.MaxTokens,
            System = request.SystemPrompt,
            Messages =
            [
                new() { Role = Role.User, Content = new MessageParamContent(blocks) },
            ],
            OutputConfig = new OutputConfig
            {
                Format = new JsonOutputFormat { Schema = ToSchema(request.OutputSchema) },
            },
        };

        var client = request.ApiKeyOverride is { Length: > 0 } key && key != _options.ApiKey
            ? new AnthropicClient { ApiKey = key, MaxRetries = _options.MaxRetries }
            : _client;

        var message = await client.Messages.Create(parameters);

        var text = message.Content
            .Select(b => b.Value)
            .OfType<TextBlock>()
            .Select(t => t.Text)
            .FirstOrDefault(t => !string.IsNullOrWhiteSpace(t))
            ?? throw new InvalidOperationException("Claude returned no text content for a structured request.");

        var output = JsonSerializer.Deserialize<JsonElement>(text);
        return new ClaudeVisionResponse(
            output, (int)message.Usage.InputTokens, (int)message.Usage.OutputTokens);
    }

    private static Dictionary<string, JsonElement> ToSchema(JsonElement schema)
    {
        var dict = new Dictionary<string, JsonElement>();
        foreach (var prop in schema.EnumerateObject())
            dict[prop.Name] = prop.Value;
        return dict;
    }

    private static MediaType ToImageMediaType(string mediaType) => mediaType switch
    {
        "image/png" => MediaType.ImagePng,
        "image/jpeg" or "image/jpg" => MediaType.ImageJpeg,
        "image/gif" => MediaType.ImageGif,
        "image/webp" => MediaType.ImageWebP,
        _ => throw new NotSupportedException($"Unsupported image media type: {mediaType}"),
    };
}
