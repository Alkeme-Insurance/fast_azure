import { useApi } from './client';

export interface ItemPayload {
	[key: string]: string | undefined;
	name?: string;
	description?: string;
}

export interface ItemUpdateResponse {
	item_id: string;
	name: string;
}

export function useItemsApi() {
	const { getJson, putJson } = useApi();

	async function listItems(): Promise<Record<string, { name?: string }>> {
		return await getJson<Record<string, { name?: string }>>('/items');
	}

	async function updateItem(itemId: string, payload: ItemPayload): Promise<ItemUpdateResponse> {
		return await putJson<ItemUpdateResponse>(`/items/${encodeURIComponent(itemId)}`, payload);
	}

	return { listItems, updateItem };
}


