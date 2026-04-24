namespace Lendlogic.AnalyzersApi.Common.Auth;

public static class AuthConstants
{
    public static class Cookies
    {
        public const string AccessToken = "aa_access_token";
        public const string RefreshToken = "aa_refresh_token";
    }

    public static class Claims
    {
        public const string UserId = "uid";
        public const string AzureOid = "oid";
        public const string SessionStartedAt = "sst";
        public const string Name = "name";
        public const string Email = "email";
    }

    public static class RateLimitPolicies
    {
        public const string Auth = "auth";
    }
}
