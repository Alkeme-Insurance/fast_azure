import type { ProjectTickerDatum, TickerDelta } from '../types/ticker';
import { TICKER_UPDATE_INTERVAL, TICKER_HISTORY_LENGTH } from '../config/env';

/**
 * Random walk generator for ticker data
 */
export class TickerSynthesizer {
	private data: Map<string, ProjectTickerDatum> = new Map();
	private intervalId: number | null = null;
	private subscribers: Set<(deltas: TickerDelta[]) => void> = new Set();

	constructor(initialData: ProjectTickerDatum[]) {
		initialData.forEach(datum => {
			this.data.set(datum.projectId, { ...datum });
		});
	}

	/**
	 * Start generating updates
	 */
	start(): void {
		if (this.intervalId !== null) return;

		this.intervalId = window.setInterval(() => {
			const deltas: TickerDelta[] = [];

			this.data.forEach((datum, projectId) => {
				// Random walk for profit (-5% to +5% change)
				const profitChange = datum.profit * (Math.random() * 0.1 - 0.05);
				const newProfit = datum.profit + profitChange;

				// Random walk for margin (-2% to +2% change)
				const marginChange = (Math.random() * 0.04 - 0.02);
				const newMargin = Math.max(0, Math.min(1, datum.margin + marginChange));

				// Random walk for time saved (-2 to +2 hours)
				const timeChange = Math.floor(Math.random() * 5 - 2);
				const newTime = datum.timeSavedHrs + timeChange;

				// Occasional PR/event changes
				const newPrs = Math.random() > 0.7 ? (datum.prs || 0) + (Math.random() > 0.5 ? 1 : -1) : datum.prs;
				const newEvents = Math.random() > 0.8 ? (datum.appEvents || 0) + Math.floor(Math.random() * 10 - 5) : datum.appEvents;

				// Calculate new index point
				const lastIndex = datum.indexSeries[datum.indexSeries.length - 1];
				const indexChange = (Math.random() * 6 - 3); // -3 to +3
				const newIndexPoint = Math.max(50, Math.min(200, lastIndex + indexChange));

				// Update stored data
				datum.profit = newProfit;
				datum.margin = newMargin;
				datum.timeSavedHrs = newTime;
				datum.prs = newPrs;
				datum.appEvents = newEvents;
				datum.indexSeries = [...datum.indexSeries.slice(-(TICKER_HISTORY_LENGTH - 1)), newIndexPoint];

				// Create delta
				deltas.push({
					projectId,
					profit: newProfit,
					margin: newMargin,
					timeSavedHrs: newTime,
					prs: newPrs,
					appEvents: newEvents,
					indexPoint: newIndexPoint
				});
			});

			// Notify subscribers
			this.subscribers.forEach(callback => callback(deltas));
		}, TICKER_UPDATE_INTERVAL);
	}

	/**
	 * Stop generating updates
	 */
	stop(): void {
		if (this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	/**
	 * Subscribe to updates
	 */
	subscribe(callback: (deltas: TickerDelta[]) => void): () => void {
		this.subscribers.add(callback);
		return () => {
			this.subscribers.delete(callback);
		};
	}

	/**
	 * Get current data
	 */
	getData(): ProjectTickerDatum[] {
		return Array.from(this.data.values());
	}
}

