import React from 'react';

export interface ChartSeries {
	name: string;
	data: number[];
	color: string; // hex color
}

interface LineChartSVGProps {
	series: ChartSeries[];
	width?: number;
	height?: number;
	padding?: number;
}

export const LineChartSVG: React.FC<LineChartSVGProps> = ({
	series,
	width = 720,
	height = 220,
	padding = 16,
}) => {
	if (series.length === 0 || series[0].data.length === 0) {
		return (
			<svg width={width} height={height} role="img" aria-label="Empty chart">
				<text x={width / 2} y={height / 2} textAnchor="middle" fill="#9ca3af" fontSize="14">
					No data available
				</text>
			</svg>
		);
	}

	const chartWidth = width - padding * 2;
	const chartHeight = height - padding * 2;

	// Calculate min/max across all series
	const allValues = series.flatMap((s) => s.data);
	const minVal = Math.min(...allValues);
	const maxVal = Math.max(...allValues);
	const range = maxVal - minVal || 1;

	// Scale functions
	const scaleX = (index: number, dataLength: number) => {
		return padding + (index / Math.max(1, dataLength - 1)) * chartWidth;
	};

	const scaleY = (value: number) => {
		return padding + chartHeight - ((value - minVal) / range) * chartHeight;
	};

	// Generate path for a series
	const generatePath = (data: number[]): string => {
		if (data.length === 0) return '';
		const points = data.map((val, i) => {
			const x = scaleX(i, data.length);
			const y = scaleY(val);
			return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
		});
		return points.join(' ');
	};

	// Grid lines (5 horizontal lines)
	const gridLines = [];
	for (let i = 0; i <= 4; i++) {
		const y = padding + (i / 4) * chartHeight;
		gridLines.push(
			<line
				key={`grid-${i}`}
				x1={padding}
				y1={y}
				x2={width - padding}
				y2={y}
				stroke="#e5e7eb"
				strokeWidth="1"
			/>
		);
	}

	return (
		<svg
			width="100%"
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			preserveAspectRatio="xMidYMid meet"
			role="img"
			aria-label="Multi-series line chart"
			style={{ maxWidth: '100%' }}
		>
			{/* Grid */}
			{gridLines}

			{/* Axes */}
			<line
				x1={padding}
				y1={padding}
				x2={padding}
				y2={height - padding}
				stroke="#9ca3af"
				strokeWidth="1.5"
			/>
			<line
				x1={padding}
				y1={height - padding}
				x2={width - padding}
				y2={height - padding}
				stroke="#9ca3af"
				strokeWidth="1.5"
			/>

			{/* Series paths */}
			{series.map((s, idx) => (
				<path
					key={`series-${idx}`}
					d={generatePath(s.data)}
					fill="none"
					stroke={s.color}
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			))}

			{/* Y-axis labels */}
			<text x={padding - 4} y={padding} textAnchor="end" fontSize="10" fill="#6b7280" alignmentBaseline="middle">
				{maxVal.toFixed(0)}
			</text>
			<text x={padding - 4} y={height - padding} textAnchor="end" fontSize="10" fill="#6b7280" alignmentBaseline="middle">
				{minVal.toFixed(0)}
			</text>
		</svg>
	);
};

