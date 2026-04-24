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
            BuildOptions(lifetime));
    }

    public static void SetRefreshCookie(HttpContext context, string token, TimeSpan lifetime)
    {
        context.Response.Cookies.Append(
            AuthConstants.Cookies.RefreshToken,
            token,
            BuildOptions(lifetime));
    }

    public static void ClearAuthCookies(HttpContext context)
    {
        context.Response.Cookies.Delete(AuthConstants.Cookies.AccessToken);
        context.Response.Cookies.Delete(AuthConstants.Cookies.RefreshToken);
    }

    private static CookieOptions BuildOptions(TimeSpan lifetime) => new()
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Expires = DateTimeOffset.UtcNow.Add(lifetime),
        Path = "/",
    };
}
