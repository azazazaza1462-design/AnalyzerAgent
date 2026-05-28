using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace Lendlogic.AnalyzersApi.Common.Auth;

public sealed class EntraTokenValidator : IEntraTokenValidator
{
    private readonly IConfiguration _configuration;
    private readonly JwtOptions _jwtOptions;
    private readonly ILogger<EntraTokenValidator> _logger;
    private IConfigurationManager<OpenIdConnectConfiguration>? _configManager;
    private string? _tenantId;
    private string? _audience;

    public EntraTokenValidator(
        IConfiguration configuration,
        IOptions<JwtOptions> jwtOptions,
        ILogger<EntraTokenValidator> logger)
    {
        _configuration = configuration;
        _jwtOptions = jwtOptions.Value;
        _logger = logger;
    }

    public async Task<ClaimsPrincipal?> ValidateAsync(string token, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!TryEnsureInitialized())
                return null;

            var config = await _configManager!.GetConfigurationAsync(cancellationToken);

            var validationParameters = new TokenValidationParameters
            {
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateIssuer = true,
                ValidIssuers = new[]
                {
                    config.Issuer,
                    $"https://sts.windows.net/{_tenantId}/",
                },
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = config.SigningKeys,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(_jwtOptions.ClockSkewMinutes),
                RequireSignedTokens = true,
            };

            var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
            return handler.ValidateToken(token, validationParameters, out _);
        }
        catch (SecurityTokenException ex)
        {
            _logger.LogWarning(ex, "Entra ID token validation failed");
            return null;
        }
        catch (Exception ex)
        {
            // Discovery fetch errors, transient I/O, etc. Return null so the caller
            // sees a clean 401 instead of a 500 — the cause is in the logs.
            _logger.LogError(ex, "Entra ID token validation threw an unexpected exception");
            return null;
        }
    }

    // Lazily read config so a missing AzureAd:* setting produces a clean 401 with
    // a logged hint at request time, instead of a 500 at first DI resolution.
    private bool TryEnsureInitialized()
    {
        if (_configManager is not null) return true;

        var tenantId = _configuration["AzureAd:TenantId"];
        var audience = _configuration["AzureAd:Audience"];

        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(audience))
        {
            _logger.LogError(
                "Entra token validation skipped: AzureAd config is missing. " +
                "TenantId set: {TenantIdSet}, Audience set: {AudienceSet}",
                !string.IsNullOrWhiteSpace(tenantId),
                !string.IsNullOrWhiteSpace(audience));
            return false;
        }

        _tenantId = tenantId;
        _audience = audience;
        _configManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            $"https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration",
            new OpenIdConnectConfigurationRetriever());

        return true;
    }
}
