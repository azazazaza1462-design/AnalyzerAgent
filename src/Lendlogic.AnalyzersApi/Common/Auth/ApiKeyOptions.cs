namespace Lendlogic.AnalyzersApi.Common.Auth;

public sealed class ApiKeyOptions
{
    public const string SectionName = "AgentApiKeys";

    public Dictionary<string, string> Keys { get; set; } = [];
}
