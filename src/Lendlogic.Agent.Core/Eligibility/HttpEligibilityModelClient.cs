using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Lendlogic.Agent.Core.Contracts;

namespace Lendlogic.Agent.Core.Eligibility;

/// <summary>
/// Calls the trained eligibility model's HTTP endpoint. Wire contract:
/// POST &lt;Endpoint&gt; with <see cref="EligibilityFeatures"/> (camelCase JSON) →
/// 200 with <see cref="EligibilityAssessment"/> (camelCase props, snake_case
/// verdict). Drop-in replacement for the stub — selected via Eligibility:Mode.
/// </summary>
public sealed class HttpEligibilityModelClient(HttpClient http, EligibilityModelOptions options)
    : IEligibilityModelClient
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower) },
    };

    public async Task<EligibilityAssessment> ScoreAsync(
        EligibilityFeatures features,
        CancellationToken cancellationToken)
    {
        var endpoint = options.Endpoint
            ?? throw new InvalidOperationException("Eligibility:Endpoint is not configured.");

        using var response = await http.PostAsJsonAsync(endpoint, features, Json, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<EligibilityAssessment>(Json, cancellationToken)
            ?? throw new InvalidOperationException("Eligibility model returned an empty response.");
    }
}
