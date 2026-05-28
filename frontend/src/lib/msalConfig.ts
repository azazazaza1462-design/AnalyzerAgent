import { PublicClientApplication, type Configuration } from "@azure/msal-browser";

// Viewnear tenant — single-tenant. Only accounts in this tenant can sign in.
const VIEWNEAR_TENANT_ID = "b952e284-33d4-4c1e-a5c6-0c3117e0aa31";

const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID ?? VIEWNEAR_TENANT_ID;

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: import.meta.env.VITE_ENTRA_REDIRECT_URI ?? window.location.origin,
    // After Microsoft sends the auth code back to redirectUri, do NOT re-navigate
    // to the URL where loginRedirect was invoked. Otherwise a sign-in started from
    // /login would land back on /login instead of continuing through ProtectedRoute.
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

// OIDC scopes only — never request an API scope. The backend trusts the idToken
// validated against the Viewnear tenant; cookies authenticate all further calls.
export const loginRequest = {
  scopes: ["openid", "profile", "email"],
  prompt: "select_account",
  domainHint: "viewnear.com",
};

export const msalInstance = new PublicClientApplication(msalConfig);
export const msalReady = msalInstance.initialize();

// Resolves with the auth result when this page load is a redirect back from
// Microsoft, or null on a normal load. navigateToLoginRequestUrl is configured
// above so this never re-navigates away before the SPA can react.
export const redirectResult = msalReady
  .then(() => msalInstance.handleRedirectPromise())
  .catch(() => null);
