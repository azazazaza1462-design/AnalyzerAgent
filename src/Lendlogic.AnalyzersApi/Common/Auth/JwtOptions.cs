namespace Lendlogic.AnalyzersApi.Common.Auth;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int AccessTokenLifetimeMinutes { get; set; } = 15;
    public int RefreshTokenLifetimeDays { get; set; } = 7;
    public int ClockSkewMinutes { get; set; } = 2;
    public int MaxSessionHours { get; set; } = 8;
}
