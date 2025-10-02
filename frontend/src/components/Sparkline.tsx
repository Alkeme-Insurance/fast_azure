import React from 'react';

interface SparklineProps {
	data: number[];
	width?: number;
	height?: number;
	color?: string;
	baseline?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ 
	data, 
	width = 60, 
	height = 24, 
	color = '#3b82f6',
	baseline = 100
}) => {
	if (data.length === 0) {
		return (
			<svg width={width} height={height} aria-label="No data">
				<line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#e5e7eb" strokeWidth="1" />
			</svg>
		);
	}

	const min = Math.min(...data);
	const max = Math.max(...data);
	const range = max - min || 1;

	// Generate path
	const points = data.map((value, index) => {
		const x = (index / (data.length - 1)) * width;
		const y = height - ((value - min) / range) * height;
		return `${x},${y}`;
	});

	const pathD = `M ${points.join(' L ')}`;

	// Calculate baseline Y position
	const baselineY = height - ((baseline - min) / range) * height;
	const showBaseline = baseline >= min && baseline <= max;

	// Determine color based on trend
	const lastValue = data[data.length - 1];
	const isPositive = lastValue >= baseline;
	const strokeColor = isPositive ? '#10b981' : '#ef4444';

	return (
		<svg 
			width={width} 
			height={height} 
			aria-label={`Sparkline chart showing trend from ${data[0].toFixed(1)} to ${lastValue.toFixed(1)}`}
			role="img"
		>
			{/* Baseline */}
			{showBaseline && (
				<line 
					x1="0" 
					y1={baselineY} 
					x2={width} 
					y2={baselineY} 
					stroke="#94a3b8" 
					strokeWidth="1" 
					strokeDasharray="2,2"
					opacity="0.5"
				/>
			)}
			
			{/* Sparkline path */}
			<path
				d={pathD}
				fill="none"
				stroke={strokeColor}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>

			{/* Last point indicator */}
			<circle
				cx={(data.length - 1) / (data.length - 1) * width}
				cy={height - ((lastValue - min) / range) * height}
				r="2"
				fill={strokeColor}
			/>
		</svg>
	);
};

