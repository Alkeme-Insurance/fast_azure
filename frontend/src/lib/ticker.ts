/**
 * Normalizes a raw data series to index form (baseline = 100)
 */
export function toIndexSeries(rawValues: number[]): number[] {
	if (rawValues.length === 0) return [];
	const baseline = rawValues[0] || 1;
	return rawValues.map(v => (v / baseline) * 100);
}

/**
 * Formats currency with k/M suffix
 */
export function fmtMoney(value: number): string {
	const abs = Math.abs(value);
	const sign = value < 0 ? '-' : '';
	
	if (abs >= 1_000_000) {
		return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
	}
	if (abs >= 1_000) {
		return `${sign}$${(abs / 1_000).toFixed(1)}k`;
	}
	return `${sign}$${abs.toFixed(0)}`;
}

/**
 * Formats percentage
 */
export function fmtPct(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}

/**
 * Generates a 3-letter symbol from project name
 */
export function abbr(name: string): string {
	// Remove common words and get initials
	const filtered = name
		.replace(/\b(the|a|an|and|or|but|in|on|at|to|for)\b/gi, '')
		.trim();
	
	const words = filtered.split(/\s+/);
	
	if (words.length >= 3) {
		// Take first letter of first 3 words
		return words
			.slice(0, 3)
			.map(w => w[0])
			.join('')
			.toUpperCase();
	} else if (words.length === 2) {
		// First 2 letters of first word + first letter of second
		return (words[0].substring(0, 2) + words[1][0]).toUpperCase();
	} else {
		// First 3 letters of single word
		return words[0].substring(0, 3).toUpperCase();
	}
}

/**
 * Gets trend direction based on index series
 */
export function getTrend(indexSeries: number[]): 'up' | 'down' | 'flat' {
	if (indexSeries.length < 2) return 'flat';
	const last = indexSeries[indexSeries.length - 1];
	const prev = indexSeries[indexSeries.length - 2];
	const diff = last - prev;
	if (Math.abs(diff) < 0.5) return 'flat';
	return diff > 0 ? 'up' : 'down';
}

/**
 * Gets color based on value relative to baseline
 */
export function getValueColor(current: number, baseline: number = 100): string {
	const diff = current - baseline;
	if (Math.abs(diff) < 1) return '#64748b'; // gray - flat
	return diff > 0 ? '#10b981' : '#ef4444'; // green up, red down
}

