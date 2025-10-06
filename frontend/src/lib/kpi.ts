/**
 * KPI helper functions for data transformation and aggregation
 */

/**
 * Convert a cumulative-like sequence to daily deltas (for Profit/day placeholder)
 */
export function toDaily(values: number[]): number[] {
	if (values.length === 0) return [];
	const result: number[] = [values[0]];
	for (let i = 1; i < values.length; i++) {
		result.push(values[i] - values[i - 1]);
	}
	return result;
}

/**
 * Get last N elements from an array
 */
export function lastN<T>(arr: T[], n: number): T[] {
	if (n >= arr.length) return arr;
	return arr.slice(-n);
}

/**
 * Calculate aggregates (total, average) for KPI metrics
 */
export function kpiAggregates(
	items: { data: number[] }[],
	_metric: string,
	points: number
): { total: number; avg: number } {
	let sum = 0;
	let count = 0;

	for (const item of items) {
		const sliced = lastN(item.data, points);
		for (const val of sliced) {
			sum += val;
			count++;
		}
	}

	return {
		total: sum,
		avg: count > 0 ? sum / count : 0,
	};
}

/**
 * Get color class for series by index
 */
export function colorClass(i: number): string {
	const colors = [
		'text-emerald-600',
		'text-blue-600',
		'text-amber-600',
		'text-rose-600',
		'text-violet-600',
		'text-cyan-600',
	];
	return colors[i % colors.length];
}

/**
 * Get stroke color for SVG by index
 */
export function strokeColor(i: number): string {
	const colors = [
		'#059669', // emerald-600
		'#2563eb', // blue-600
		'#d97706', // amber-600
		'#e11d48', // rose-600
		'#7c3aed', // violet-600
		'#0891b2', // cyan-600
	];
	return colors[i % colors.length];
}

