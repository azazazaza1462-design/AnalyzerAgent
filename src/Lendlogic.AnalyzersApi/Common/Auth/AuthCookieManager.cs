using Microsoft.Extensions.DependencyInjection;

namespace Lendlogic.AnalyzersApi.Common.Auth;

public static class AuthCookieManager
{
    public static void SetAuthCookies(
        HttpContext context,
        string accessToken,
        string refreshToken,
        TimeSpan accessLifetime,
        TimeSpan refreshLifetime)
    {
        SetAccessCookie(context, accessToken, accessLifetime);
        SetRefreshCookie(context, refreshToken, refreshLifetime);
    }

    public static void SetAccessCookie(HttpContext context, string token, TimeSpan lifetime)
    {
        context.Response.Cookies.Append(
            AuthConstants.Cookies.AccessToken,
            token,
            BuildOptions(context, lifetime));
    }

    public static void SetRefreshCookie(HttpContext context, string token, TimeSpan lifetime)
    {
        context.Response.Cookies.Append(
            AuthConstants.Cookies.RefreshToken,
            token,
            BuildOptions(context, lifetime));
    }

    public static void ClearAuthCookies(HttpContext context)
    {
        // Delete must echo the same SameSite/Secure/Path the cookie was set with,
        // otherwise the browser keeps the cross-site (SameSite=None) cookie.
        var options = BuildOptions(context, TimeSpan.Zero);
        context.Response.Cookies.Delete(AuthConstants.Cookies.AccessToken, options);
        context.Response.Cookies.Delete(AuthConstants.Cookies.RefreshToken, options);
    }

    private static CookieOptions BuildOptions(HttpContext context, TimeSpan lifetime)
    {
        // The QA/prod UI and API are different *.azurewebsites.net hosts, so the
        // session cookies travel cross-site and require SameSite=None; Secure.
        // In Development the UI is same-origin via the Vite proxy, where Lax is
        // sufficient (and avoids requiring HTTPS on localhost).
        var env = context.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var isDev = env.IsDevelopment();

        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDev,
            SameSite = isDev ? SameSiteMode.Lax : SameSiteMode.None,
            Expires = lifetime == TimeSpan.Zero
                ? DateTimeOffset.UnixEpoch
                : DateTimeOffset.UtcNow.Add(lifetime),
            Path = "/",
        };
    }
}
