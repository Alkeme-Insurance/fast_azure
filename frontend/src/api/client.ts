import { useAuth } from '../auth/AuthProvider';

export interface ApiError extends Error {
	status?: number;
	code?: string;
}

export type JsonObject = Record<string, unknown>;

function buildError(message: string, status?: number): ApiError {
	const err = new Error(message) as ApiError;
	err.status = status;
	return err;
}

export function useApi() {
	const { getAccessToken, login } = useAuth();
	const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

	async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
		const token = await getAccessToken([import.meta.env.VITE_AZURE_API_SCOPE as string]);
		const res = await fetch(`${baseUrl}${path}`, {
			...init,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
				...(init.headers || {}),
			},
		});
		if (res.status === 401 || res.status === 403) {
			await login();
			throw buildError('unauthorized_or_forbidden', res.status);
		}
		return res;
	}

	async function getJson<T>(path: string): Promise<T> {
		const res = await apiFetch(path, { method: 'GET' });
		if (!res.ok) throw buildError(`request_failed_${res.status}`, res.status);
		return (await res.json()) as T;
	}

	async function putJson<T>(path: string, body: JsonObject): Promise<T> {
		const res = await apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
		if (!res.ok) throw buildError(`request_failed_${res.status}`, res.status);
		return (await res.json()) as T;
	}

	return { apiFetch, getJson, putJson };
}


