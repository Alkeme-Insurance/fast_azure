import type { TickerDelta } from '../types/ticker';
import { WS_BASE } from '../config/env';

/**
 * Connects to WebSocket ticker stream
 * 
 * Backend endpoint should be: WS /ws/metrics/ticker
 * Message format: { type: 'delta', deltas: TickerDelta[] }
 */
export function connectTickerWS(
	onDelta: (deltas: TickerDelta[]) => void
): () => void {
	const ws = new WebSocket(`${WS_BASE}/ws/metrics/ticker`);

	ws.onopen = () => {
		console.log('Ticker WebSocket connected');
	};

	ws.onmessage = (event) => {
		try {
			const message = JSON.parse(event.data);
			if (message.type === 'delta' && Array.isArray(message.deltas)) {
				onDelta(message.deltas);
			}
		} catch (error) {
			console.error('Failed to parse WebSocket message:', error);
		}
	};

	ws.onerror = (error) => {
		console.error('Ticker WebSocket error:', error);
	};

	ws.onclose = () => {
		console.log('Ticker WebSocket disconnected');
	};

	// Return cleanup function
	return () => {
		if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
			ws.close();
		}
	};
}

