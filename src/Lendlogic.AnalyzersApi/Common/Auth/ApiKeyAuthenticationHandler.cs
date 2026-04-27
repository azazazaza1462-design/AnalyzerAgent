using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Lendlogic.AnalyzersApi.Common.Auth;

public sealed class ApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IOptionsMonitor<ApiKeyOptions> apiKeyOptions)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    private readonly IOptionsMonitor<ApiKeyOptions> _apiKeyOptions = apiKeyOptions;

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(AuthConstants.ApiKey.HeaderName, out var headerValues))
            return Task.FromResult(AuthenticateResult.NoResult());

        var providedKey = headerValues.ToString();
        if (string.IsNullOrWhiteSpace(providedKey))
            return Task.FromResult(AuthenticateResult.Fail("Empty API key."));

        var keys = _apiKeyOptions.CurrentValue.Keys;
        var match = keys.FirstOrDefault(kvp => string.Equals(kvp.Value, providedKey, StringComparison.Ordinal));
        if (match.Equals(default(KeyValuePair<string, string>)))
            return Task.FromResult(AuthenticateResult.Fail("Invalid API key."));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, match.Key),
            new Claim(ClaimTypes.Name, match.Key),
            new Claim(ClaimTypes.Role, AuthConstants.Roles.Agent),
        };
        var identity = new ClaimsIdentity(claims, AuthConstants.ApiKey.SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, AuthConstants.ApiKey.SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
