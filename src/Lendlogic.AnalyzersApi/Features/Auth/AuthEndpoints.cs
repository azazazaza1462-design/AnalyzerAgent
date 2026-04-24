using Carter;
using Lendlogic.AnalyzersApi.Common.Auth;
using Lendlogic.AnalyzersApi.Common.Extensions;
using Lendlogic.AnalyzersApi.Features.Auth.Exchange;
using Lendlogic.AnalyzersApi.Features.Auth.Logout;
using Lendlogic.AnalyzersApi.Features.Auth.Me;
using Lendlogic.AnalyzersApi.Features.Auth.Refresh;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Auth;

public class AuthEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth").WithTags("Auth");

        group.MapPost("/exchange", async (
            HttpContext httpContext,
            IMediator mediator) =>
        {
            var header = httpContext.Request.Headers.Authorization.ToString();
            if (string.IsNullOrWhiteSpace(header) || !header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return Results.Unauthorized();

            var entraToken = header["Bearer ".Length..].Trim();

            var result = await mediator.Send(new ExchangeCommand(entraToken));

            return result.Match(value =>
            {
                AuthCookieManager.SetAuthCookies(
                    httpContext,
                    value.AccessToken,
                    value.RefreshToken,
                    value.AccessTokenLifetime,
                    value.RefreshTokenLifetime);

                return Results.Ok(new ExchangeResponse(
                    value.UserId,
                    value.Email,
                    value.FullName,
                    value.AzureId,
                    value.SessionExpiresAt));
            });
        })
        .WithName("AuthExchange")
        .AllowAnonymous()
        .RequireRateLimiting(AuthConstants.RateLimitPolicies.Auth)
        .Produces<ExchangeResponse>();

        group.MapPost("/refresh", async (HttpContext httpContext, IMediator mediator) =>
        {
            var refreshToken = httpContext.Request.Cookies[AuthConstants.Cookies.RefreshToken];
            var result = await mediator.Send(new RefreshCommand(refreshToken ?? string.Empty));

            return result.Match(value =>
            {
                AuthCookieManager.SetAuthCookies(
                    httpContext,
                    value.AccessToken,
                    value.RefreshToken,
                    value.AccessTokenLifetime,
                    value.RefreshTokenLifetime);

                return Results.Ok(new RefreshResponse(value.SessionExpiresAt));
            });
        })
        .WithName("AuthRefresh")
        .AllowAnonymous()
        .RequireRateLimiting(AuthConstants.RateLimitPolicies.Auth)
        .Produces<RefreshResponse>();

        group.MapPost("/logout", async (HttpContext httpContext, IMediator mediator) =>
        {
            var refreshToken = httpContext.Request.Cookies[AuthConstants.Cookies.RefreshToken];
            await mediator.Send(new LogoutCommand(refreshToken));

            AuthCookieManager.ClearAuthCookies(httpContext);
            return Results.NoContent();
        })
        .WithName("AuthLogout")
        .AllowAnonymous()
        .RequireRateLimiting(AuthConstants.RateLimitPolicies.Auth);

        group.MapGet("/me", async (IMediator mediator) =>
        {
            var result = await mediator.Send(new MeQuery());
            return result.Match(Results.Ok);
        })
        .WithName("AuthMe")
        .RequireAuthorization()
        .Produces<MeResponse>();
    }
}
