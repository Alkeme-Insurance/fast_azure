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
		storeAuthStateInCookie: true, // Use cookies as fallback for HTTP
	},
	system: {
		allowNativeBroker: false, // Disable native broker which requires crypto
		loggerOptions: {
			logLevel: 3, // Error
		},
	},
};

// Create PublicClientApplication with error handling
// If crypto API is not available (HTTP instead of HTTPS), provide a graceful fallback
let pcaInstance: PublicClientApplication;

try {
	if (DEV_MODE) {
		// Dev mode: use mock
		pcaInstance = {
			initialize: async () => Promise.resolve(),
			handleRedirectPromise: async () => Promise.resolve(null),
			getActiveAccount: () => null,
			getAllAccounts: () => [],
			loginRedirect: async () => {
				console.warn('[Dev Mode] Login redirect disabled');
				return Promise.resolve();
			},
			logoutRedirect: async () => Promise.resolve(),
			acquireTokenSilent: async () => Promise.reject(new Error('dev_mode_no_auth')),
			acquireTokenRedirect: async () => Promise.resolve(),
			setActiveAccount: () => {},
		} as unknown as PublicClientApplication;
	} else {
		// Production: try to create real PCA
		pcaInstance = new PublicClientApplication(msalConfig);
	}
} catch (error) {
	console.error('[MSAL] Failed to initialize PublicClientApplication:', error);
	console.warn('[MSAL] Falling back to mock authentication. This typically happens when:');
	console.warn('  - Running over HTTP instead of HTTPS (crypto API requires secure context)');
	console.warn('  - Browser does not support Web Crypto API');
	console.warn('  - Content Security Policy blocks crypto operations');
	console.warn('[MSAL] For production, please use HTTPS or configure Azure AD for HTTP (not recommended)');
	
	// Fallback to mock
	pcaInstance = {
		initialize: async () => Promise.resolve(),
		handleRedirectPromise: async () => Promise.resolve(null),
		getActiveAccount: () => null,
		getAllAccounts: () => [],
		loginRedirect: async () => {
			alert('Authentication requires HTTPS. Please access the application over HTTPS or contact your administrator.');
			return Promise.resolve();
		},
		logoutRedirect: async () => Promise.resolve(),
		acquireTokenSilent: async () => Promise.reject(new Error('crypto_not_available')),
		acquireTokenRedirect: async () => Promise.resolve(),
		setActiveAccount: () => {},
	} as unknown as PublicClientApplication;
}

export const pca = pcaInstance;


