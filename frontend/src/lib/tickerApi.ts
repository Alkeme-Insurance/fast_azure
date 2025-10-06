import type { ProjectTickerDatum } from '../types/ticker';
import { API_BASE } from '../config/env';

/**
 * Fetches ticker data from REST API
 * 
 * Backend endpoint should be: GET /api/metrics/ticker
 * Response format: { items: ProjectTickerDatum[] }
 */
export async function fetchTickerData(): Promise<ProjectTickerDatum[]> {
	const response = await fetch(`${API_BASE}/api/metrics/ticker`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch ticker data: ${response.status}`);
	}

	const data = await response.json();
	return data.items || data;
}

