using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace Lendlogic.AnalyzersApi.Common.Auth;

public sealed class EntraTokenValidator : IEntraTokenValidator
{
    private readonly IConfigurationManager<OpenIdConnectConfiguration> _configManager;
    private readonly string _tenantId;
    private readonly string _audience;
    private readonly JwtOptions _jwtOptions;
    private readonly ILogger<EntraTokenValidator> _logger;

    public EntraTokenValidator(
        IConfiguration configuration,
        IOptions<JwtOptions> jwtOptions,
        ILogger<EntraTokenValidator> logger)
    {
        _tenantId = configuration["AzureAd:TenantId"]
            ?? throw new InvalidOperationException("AzureAd:TenantId is not configured.");
        _audience = configuration["AzureAd:Audience"]
            ?? throw new InvalidOperationException("AzureAd:Audience is not configured.");
        _jwtOptions = jwtOptions.Value;
        _logger = logger;

        var discoveryEndpoint =
            $"https://login.microsoftonline.com/{_tenantId}/v2.0/.well-known/openid-configuration";

        _configManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            discoveryEndpoint,
            new OpenIdConnectConfigurationRetriever());
    }

    public async Task<ClaimsPrincipal?> ValidateAsync(string token, CancellationToken cancellationToken = default)
    {
        try
        {
            var config = await _configManager.GetConfigurationAsync(cancellationToken);

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
    }
}
