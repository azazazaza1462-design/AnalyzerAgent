using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Lendlogic.AnalyzersApi.Data.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Lendlogic.AnalyzersApi.Common.Auth;

public sealed class InternalJwtService(IOptions<JwtOptions> options) : IInternalJwtService
{
    private readonly JwtOptions _options = options.Value;

    public string CreateAccessToken(User user, DateTime sessionStartedAt)
    {
        var claims = new[]
        {
            new Claim(AuthConstants.Claims.UserId, user.Id.ToString()),
            new Claim(AuthConstants.Claims.AzureOid, user.AzureId),
            new Claim(AuthConstants.Claims.Name, user.FullName),
            new Claim(AuthConstants.Claims.Email, user.Email),
            new Claim(AuthConstants.Claims.SessionStartedAt, sessionStartedAt.ToString("o")),
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(_options.AccessTokenLifetimeMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public string HashRefreshToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes);
    }
}
