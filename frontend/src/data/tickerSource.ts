import type { ProjectTickerDatum, TickerDelta } from '../types/ticker';
import { METRICS_SOURCE } from '../config/env';
import { generateTickerSeed } from '../mock/tickerSeed';
import { TickerSynthesizer } from '../mock/tickerSynth';
import { fetchTickerData } from '../lib/tickerApi';
import { connectTickerWS } from '../lib/tickerWs';

let synthesizer: TickerSynthesizer | null = null;
let wsConnection: (() => void) | null = null;

/**
 * Get ticker data based on configured source
 */
export async function getTickerData(): Promise<ProjectTickerDatum[]> {
	switch (METRICS_SOURCE) {
		case 'static':
			return generateTickerSeed();
		
		case 'synth':
			if (!synthesizer) {
				synthesizer = new TickerSynthesizer(generateTickerSeed());
				synthesizer.start();
			}
			return synthesizer.getData();
		
		case 'ws':
			// For WebSocket mode, return initial REST data
			// Actual updates come via subscribeTicker
			try {
				return await fetchTickerData();
			} catch (error) {
				console.error('Failed to fetch ticker data, falling back to static:', error);
				return generateTickerSeed();
			}
		
		default:
			return generateTickerSeed();
	}
}

/**
 * Subscribe to ticker updates
 */
export function subscribeTicker(
	onDelta: (deltas: TickerDelta[]) => void
): () => void {
	switch (METRICS_SOURCE) {
		case 'static':
			// No updates for static data
			return () => {};
		
		case 'synth':
			if (!synthesizer) {
				synthesizer = new TickerSynthesizer(generateTickerSeed());
				synthesizer.start();
			}
			return synthesizer.subscribe(onDelta);
		
		case 'ws':
			// Connect to WebSocket
			try {
				wsConnection = connectTickerWS(onDelta);
				return () => {
					if (wsConnection) {
						wsConnection();
						wsConnection = null;
					}
				};
			} catch (error) {
				console.error('Failed to connect to WebSocket, no updates will be received:', error);
				return () => {};
			}
		
		default:
			return () => {};
	}
}

/**
 * Cleanup resources
 */
export function cleanupTicker(): void {
	if (synthesizer) {
		synthesizer.stop();
		synthesizer = null;
	}
	if (wsConnection) {
		wsConnection();
		wsConnection = null;
	}
}

