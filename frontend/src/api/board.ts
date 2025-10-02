import { useApi } from './client';
import type { Board, Column, Card } from '../types';

export function useBoardApi() {
	const { getJson, apiFetch } = useApi();

	async function listBoards(): Promise<{ items: Board[]; total: number }> {
		return await getJson(`/api/boards`);
	}

	async function listBoardsByProject(projectId: string): Promise<{ items: Board[]; total: number }> {
		return await getJson(`/api/projects/${projectId}/boards`);
	}

	async function getBoard(boardId: string): Promise<{ board: Board; columns: Column[]; cards: Card[] }> {
		return await getJson(`/api/boards/${boardId}`);
	}

	async function createBoard(name: string, projectId?: string, description?: string): Promise<Board> {
		const body: { name: string; projectId?: string; description?: string } = { name };
		if (projectId) body.projectId = projectId;
		if (description) body.description = description;
		const res = await apiFetch(`/api/boards`, { method: 'POST', body: JSON.stringify(body) });
		if (!res.ok) throw new Error(`request_failed_${res.status}`);
		return (await res.json()) as Board;
	}

	async function updateBoard(id: string, name: string): Promise<void> {
		const res = await apiFetch(`/api/boards/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
		if (!res.ok) throw new Error(`request_failed_${res.status}`);
	}

	async function deleteBoard(id: string): Promise<void> {
		const res = await apiFetch(`/api/boards/${id}`, { method: 'DELETE' });
		if (!res.ok) throw new Error(`request_failed_${res.status}`);
	}

	async function createColumn(body: { boardId: string; title: string; position: number }): Promise<Column> {
		const res = await apiFetch(`/api/columns`, { method: 'POST', body: JSON.stringify(body) });
		if (!res.ok) throw new Error(`request_failed_${res.status}`);
		return (await res.json()) as Column;
	}

	async function updateColumn(id: string, body: Partial<Pick<Column, 'title' | 'position'>>): Promise<void> {
		const res = await apiFetch(`/api/columns/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
		if (!res.ok) throw new Error(`request_failed_${res.status}`);
	}

	async function deleteColumn(id: string): Promise<void> {
		const res = await apiFetch(`/api/columns/${id}`, { method: 'DELETE' });
		if (!res.ok) throw new Error(`request_failed_${res.status}`);
	}

	async function createCard(body: { columnId: string; title: string; position: number } & Partial<Card>): Promise<Card> {
		const res = await apiFetch(`/api/cards`, { method: 'POST', body: JSON.stringify(body) });
		if (!res.ok) throw new Error(`request_failed_${res.status}`);
		return (await res.json()) as Card;
	}

	async function updateCard(id: string, body: Partial<Card>): Promise<void> {
		const res = await apiFetch(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
		if (!res.ok) throw new Error(`request_failed_${res.status}`);
	}

	async function deleteCard(id: string): Promise<void> {
		const res = await apiFetch(`/api/cards/${id}`, { method: 'DELETE' });
		if (!res.ok) throw new Error(`request_failed_${res.status}`);
	}

	return { listBoards, listBoardsByProject, getBoard, createBoard, updateBoard, deleteBoard, createColumn, updateColumn, deleteColumn, createCard, updateCard, deleteCard };
}
