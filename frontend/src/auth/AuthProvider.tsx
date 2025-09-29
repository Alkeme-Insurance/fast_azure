import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MsalProvider, useIsAuthenticated, useMsal, type IMsalContext } from '@azure/msal-react';
import { InteractionRequiredAuthError, InteractionType, type AccountInfo, type AuthenticationResult } from '@azure/msal-browser';
import { loginRequest, pca } from './msalConfig';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthUser {
	displayName?: string;
	name?: string;
	preferred_username?: string;
	tenantId?: string;
	oid?: string;
	claims?: Record<string, unknown>;
}

interface AuthContextValue {
	status: AuthStatus;
	user: AuthUser | null;
	login: () => Promise<void>;
	logout: () => Promise<void>;
	getAccessToken: (scopes?: string[]) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractUserFromAccount(account: AccountInfo | null | undefined, result?: AuthenticationResult | null): AuthUser | null {
	if (!account) return null;
	const claims = (result?.idTokenClaims ?? account.idTokenClaims) as Record<string, unknown> | undefined;
	return {
		displayName: (claims?.['name'] as string) ?? undefined,
		name: (claims?.['name'] as string) ?? undefined,
		preferred_username: (claims?.['preferred_username'] as string) ?? undefined,
		tenantId: (claims?.['tid'] as string) ?? undefined,
		oid: (claims?.['oid'] as string) ?? undefined,
		claims,
	};
}

export const InternalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const isAuthenticated = useIsAuthenticated();
	const msal = useMsal();
	const [status, setStatus] = useState<AuthStatus>('idle');
	const [user, setUser] = useState<AuthUser | null>(null);

	useEffect(() => {
		setStatus('loading');
		// Attempt silent token to determine session state
		msal.instance
			.handleRedirectPromise()
			.finally(async () => {
				const activeAccount = msal.instance.getActiveAccount() ?? msal.accounts[0] ?? null;
				if (activeAccount) {
					setUser(extractUserFromAccount(activeAccount));
					setStatus('authenticated');
				} else {
					setStatus('idle');
				}
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (isAuthenticated) {
			const active = msal.instance.getActiveAccount() ?? msal.accounts[0] ?? null;
			setUser(extractUserFromAccount(active));
			setStatus('authenticated');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated]);

	const login = useCallback(async () => {
		await msal.instance.loginRedirect(loginRequest);
	}, [msal.instance]);

	const logout = useCallback(async () => {
		await msal.instance.logoutRedirect({
			postLogoutRedirectUri: import.meta.env.VITE_AZURE_POST_LOGOUT_REDIRECT_URI ?? window.location.origin,
		});
	}, [msal.instance]);

	const getAccessToken = useCallback(
		async (scopes?: string[]) => {
			const requestScopes = scopes && scopes.length > 0 ? scopes : (loginRequest.scopes as string[]);
			const active = msal.instance.getActiveAccount() ?? msal.accounts[0] ?? null;
			if (!active) {
				// triggers redirect to login
				await msal.instance.loginRedirect(loginRequest);
				return Promise.reject(new Error('redirecting_for_login'));
			}
			try {
				const res = await msal.instance.acquireTokenSilent({
					account: active,
					scopes: requestScopes,
				});
				if (!res.accessToken) throw new Error('no_access_token');
				return res.accessToken;
			} catch (err) {
				if (err instanceof InteractionRequiredAuthError) {
					await msal.instance.acquireTokenRedirect({ scopes: requestScopes });
					return Promise.reject(new Error('redirecting_for_token'));
				}
				throw err as Error;
			}
		},
		[msal.instance]
	);

	const value = useMemo<AuthContextValue>(
		() => ({ status, user, login, logout, getAccessToken }),
		[status, user, login, logout, getAccessToken]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AppAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<MsalProvider instance={pca}>
			<InternalAuthProvider>{children}</InternalAuthProvider>
		</MsalProvider>
	);
};

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AppAuthProvider');
	return ctx;
}


