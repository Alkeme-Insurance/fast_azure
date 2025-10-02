export type Id = string;

export interface ProjectTickerDatum {
	projectId: Id;
	symbol: string;      // e.g., "WBR"
	name: string;        // full name
	profit: number;      // latest daily profit ($)
	margin: number;      // 0..1
	timeSavedHrs: number;
	prs?: number;
	appEvents?: number;
	indexSeries: number[]; // e.g., 30 points, normalized to base=100
}

export interface TickerDelta {
	projectId: Id;
	profit?: number;
	margin?: number;
	timeSavedHrs?: number;
	prs?: number;
	appEvents?: number;
	indexPoint?: number; // new point to append
}

