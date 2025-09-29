import { useApi } from './client';

export interface UserMeResponse {
	username?: string;
	[name: string]: unknown;
}

export function useUsersApi() {
	const { getJson } = useApi();

	async function getMe(): Promise<UserMeResponse> {
		return await getJson<UserMeResponse>('/users/me');
	}

	async function listUsers(): Promise<Array<Record<string, unknown>>> {
		return await getJson<Array<Record<string, unknown>>>('/users/');
	}

	return { getMe, listUsers };
}


