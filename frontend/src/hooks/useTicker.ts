import { useState, useEffect } from 'react';
import type { ProjectTickerDatum, TickerDelta } from '../types/ticker';
import { getTickerData, subscribeTicker, cleanupTicker } from '../data/tickerSource';
import { TICKER_HISTORY_LENGTH } from '../config/env';

/**
 * Hook to manage ticker data with real-time updates
 */
export function useTicker() {
	const [data, setData] = useState<ProjectTickerDatum[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let mounted = true;

		// Load initial data
		getTickerData()
			.then(initialData => {
				if (mounted) {
					setData(initialData);
					setLoading(false);
				}
			})
			.catch(err => {
				if (mounted) {
					setError(err);
					setLoading(false);
				}
			});

		// Subscribe to updates
		const unsubscribe = subscribeTicker((deltas: TickerDelta[]) => {
			if (!mounted) return;

			setData(currentData => {
				const dataMap = new Map(currentData.map(d => [d.projectId, { ...d }]));

				deltas.forEach(delta => {
					const datum = dataMap.get(delta.projectId);
					if (!datum) return;

					// Apply delta updates
					if (delta.profit !== undefined) datum.profit = delta.profit;
					if (delta.margin !== undefined) datum.margin = delta.margin;
					if (delta.timeSavedHrs !== undefined) datum.timeSavedHrs = delta.timeSavedHrs;
					if (delta.prs !== undefined) datum.prs = delta.prs;
					if (delta.appEvents !== undefined) datum.appEvents = delta.appEvents;
					
					// Append new index point and maintain history length
					if (delta.indexPoint !== undefined) {
						datum.indexSeries = [
							...datum.indexSeries.slice(-(TICKER_HISTORY_LENGTH - 1)),
							delta.indexPoint
						];
					}
				});

				return Array.from(dataMap.values());
			});
		});

		return () => {
			mounted = false;
			unsubscribe();
			cleanupTicker();
		};
	}, []);

	return { data, loading, error };
}

