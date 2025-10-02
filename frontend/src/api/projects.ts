import { useApi } from './client';
import type { ProjectsResponse, Project } from '../types';

export function useProjectsApi() {
	const { getJson, apiFetch } = useApi();

	async function list(params: { page?: number; limit?: number; sort?: string; filter?: string } = {}): Promise<ProjectsResponse> {
		const q = new URLSearchParams();
		if (params.page) q.set('page', String(params.page));
		if (params.limit) q.set('limit', String(params.limit));
		if (params.sort) q.set('sort', params.sort);
		if (params.filter) q.set('filter', params.filter);
		return await getJson<ProjectsResponse>(`/api/projects?${q.toString()}`);
	}

	async function create(project: Omit<Project, 'id'>): Promise<Project> {
		const res = await apiFetch('/api/projects', { method: 'POST', body: JSON.stringify(project) });
		if (!res.ok) throw new Error(`request_failed_${res.status}`);
		return (await res.json()) as Project;
	}

	async function getById(id: string): Promise<Project> {
		return await getJson<Project>(`/api/projects/${id}`);
	}

	async function update(id: string, changes: Partial<Project>): Promise<Project> {
		const res = await apiFetch(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
		if (!res.ok) throw new Error(`request_failed_${res.status}`);
		return (await res.json()) as Project;
	}

	async function remove(id: string): Promise<void> {
		const res = await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
		if (!res.ok) throw new Error(`request_failed_${res.status}`);
	}

	return { list, create, update, remove, getById };
}
