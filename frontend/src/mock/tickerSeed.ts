import type { ProjectTickerDatum } from '../types/ticker';
import { abbr, toIndexSeries } from '../lib/ticker';

/**
 * Generates deterministic sample ticker data
 */
export function generateTickerSeed(): ProjectTickerDatum[] {
	return [
		{
			projectId: '1',
			name: 'E-Commerce Platform',
			symbol: abbr('E-Commerce Platform'),
			profit: 12300,
			margin: 0.31,
			timeSavedHrs: 14,
			prs: 8,
			appEvents: 127,
			indexSeries: toIndexSeries([
				100, 102, 98, 103, 105, 107, 104, 108, 112, 110,
				115, 118, 116, 120, 122, 119, 125, 128, 126, 130,
				133, 131, 135, 138, 136, 140, 143, 141, 145, 148
			])
		},
		{
			projectId: '2',
			name: 'Mobile App Redesign',
			symbol: abbr('Mobile App Redesign'),
			profit: -2100,
			margin: 0.18,
			timeSavedHrs: -3,
			prs: 12,
			appEvents: 89,
			indexSeries: toIndexSeries([
				100, 99, 97, 95, 98, 96, 94, 97, 95, 93,
				96, 94, 92, 95, 93, 91, 94, 92, 90, 93,
				91, 89, 92, 90, 88, 91, 89, 87, 90, 88
			])
		},
		{
			projectId: '3',
			name: 'API Documentation Portal',
			symbol: abbr('API Documentation Portal'),
			profit: 8700,
			margin: 0.42,
			timeSavedHrs: 22,
			prs: 5,
			appEvents: 203,
			indexSeries: toIndexSeries([
				100, 101, 103, 102, 104, 106, 105, 107, 109, 108,
				110, 112, 111, 113, 115, 114, 116, 118, 117, 119,
				121, 120, 122, 124, 123, 125, 127, 126, 128, 130
			])
		},
		{
			projectId: '4',
			name: 'Internal Analytics Dashboard',
			symbol: abbr('Internal Analytics Dashboard'),
			profit: 15600,
			margin: 0.55,
			timeSavedHrs: 31,
			prs: 3,
			appEvents: 412,
			indexSeries: toIndexSeries([
				100, 103, 106, 104, 107, 110, 108, 111, 114, 112,
				115, 118, 116, 119, 122, 120, 123, 126, 124, 127,
				130, 128, 131, 134, 132, 135, 138, 136, 139, 142
			])
		},
		{
			projectId: '5',
			name: 'Customer Portal Migration',
			symbol: abbr('Customer Portal Migration'),
			profit: 4200,
			margin: 0.24,
			timeSavedHrs: 8,
			prs: 15,
			appEvents: 156,
			indexSeries: toIndexSeries([
				100, 98, 101, 99, 102, 100, 103, 101, 104, 102,
				105, 103, 106, 104, 107, 105, 108, 106, 109, 107,
				110, 108, 111, 109, 112, 110, 113, 111, 114, 112
			])
		}
	];
}

