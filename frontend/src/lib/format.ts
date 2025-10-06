/**
 * Formatting utilities for numbers, currency, and percentages
 */

/**
 * Format a number as currency
 */
export function fmtMoney(n: number): string {
	const sign = n < 0 ? '-' : '';
	const abs = Math.abs(n);
	if (abs >= 1_000_000) {
		return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
	}
	if (abs >= 1_000) {
		return `${sign}$${(abs / 1_000).toFixed(1)}k`;
	}
	return `${sign}$${abs.toFixed(0)}`;
}

/**
 * Format a decimal as a percentage
 */
export function fmtPct(p: number): string {
	return `${(p * 100).toFixed(1)}%`;
}

/**
 * Format a number with abbreviations
 */
export function fmtNumber(n: number): string {
	const sign = n < 0 ? '-' : '';
	const abs = Math.abs(n);
	if (abs >= 1_000_000) {
		return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
	}
	if (abs >= 1_000) {
		return `${sign}${(abs / 1_000).toFixed(1)}k`;
	}
	return `${sign}${abs.toFixed(0)}`;
}

