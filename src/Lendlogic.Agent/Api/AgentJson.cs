using System.Text.Json;
using System.Text.Json.Serialization;

namespace Lendlogic.Agent.Api;

/// <summary>
/// The two JSON contexts the worker uses:
/// <list type="bullet">
/// <item><see cref="Wire"/> — talking to the API. camelCase properties and
/// default (PascalCase) enum names, matching the API's
/// <c>JsonStringEnumConverter</c> so <c>JobType</c> round-trips as
/// "IdValidation".</item>
/// <item><see cref="Result"/> — the analyzer result stored in
/// <c>job_results</c>. camelCase properties and snake_case enum values, matching
/// the frontend unions (e.g. verdict "needs_review", status "not_applicable").</item>
/// </list>
/// </summary>
public static class AgentJson
{
    public static readonly JsonSerializerOptions Wire = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    public static readonly JsonSerializerOptions Result = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower) },
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
}
