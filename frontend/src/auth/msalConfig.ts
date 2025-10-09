import { PublicClientApplication, type Configuration, type PopupRequest, type RedirectRequest } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID as string | undefined;
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI as string | undefined;
const postLogoutRedirectUri = import.meta.env.VITE_AZURE_POST_LOGOUT_REDIRECT_URI as string | undefined;
const apiScope = import.meta.env.VITE_AZURE_API_SCOPE as string | undefined;

// Check if we're in dev mode (no auth)
const DEV_MODE = !clientId || import.meta.env.VITE_DEV_NO_AUTH === 'true';

export const loginRequest: RedirectRequest & PopupRequest = {
	scopes: [apiScope!, 'openid', 'profile', 'email'].filter(Boolean) as string[],
};

const authority = `https://login.microsoftonline.com/${tenantId}`;

const msalConfig: Configuration = {
	auth: {
		clientId: clientId ?? '',
		authority,
		redirectUri: redirectUri ?? window.location.origin,
		postLogoutRedirectUri: postLogoutRedirectUri ?? window.location.origin,
	},
	cache: {
		cacheLocation: 'sessionStorage',
		storeAuthStateInCookie: false,
	},
};

// ONLY create PublicClientApplication if NOT in dev mode
// This prevents crypto_nonexistent error when Azure AD is disabled
export const pca = DEV_MODE 
	? ({} as PublicClientApplication) // Mock object for dev mode
	: new PublicClientApplication(msalConfig);


