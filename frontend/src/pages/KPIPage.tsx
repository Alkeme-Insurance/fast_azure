import React, { useMemo, useState } from 'react';
import { generateTickerSeed } from '../mock/tickerSeed';
import { LineChartSVG, type ChartSeries } from '../components/LineChartSVG';
import { Sparkline } from '../components/Sparkline';
import { toDaily, lastN, kpiAggregates, colorClass, strokeColor } from '../lib/kpi';
import { fmtMoney, fmtNumber } from '../lib/format';
import type { ProjectTickerDatum } from '../types/ticker';

type MetricType = 'index' | 'profit' | 'time' | 'signals';
type TimeframeType = 7 | 14 | 30;

export const KPIPage: React.FC = () => {
	// TODO: Replace with API call: const { data, loading } = useKPIData();
	const mockData = useMemo(() => generateTickerSeed(), []);

	const [metric, setMetric] = useState<MetricType>('index');
	const [timeframe, setTimeframe] = useState<TimeframeType>(30);

	// Transform data based on selected metric
	const transformedData = useMemo(() => {
		return mockData.map((project) => {
			let data: number[];
			switch (metric) {
				case 'index':
					data = project.indexSeries;
					break;
				case 'profit':
					// Placeholder: derive daily profit from index changes
					data = toDaily(project.indexSeries).map((d) => d * project.profit / 10);
					break;
				case 'time':
					// Placeholder: spread timeSavedHrs across points
					data = project.indexSeries.map(() => project.timeSavedHrs / project.indexSeries.length);
					break;
				case 'signals':
					// Placeholder: flat series from signals
					data = project.indexSeries.map(() => (project.prs ?? 0) + (project.appEvents ?? 0));
					break;
			}
			return {
				projectId: project.projectId,
				symbol: project.symbol,
				name: project.name,
				data: lastN(data, timeframe),
			};
		});
	}, [mockData, metric, timeframe]);

	// Generate series for chart
	const chartSeries: ChartSeries[] = useMemo(() => {
		return transformedData.map((item, idx) => ({
			name: item.symbol,
			data: item.data,
			color: strokeColor(idx),
		}));
	}, [transformedData]);

	// Calculate aggregates
	const aggregates = useMemo(() => {
		return kpiAggregates(transformedData, metric, timeframe);
	}, [transformedData, metric, timeframe]);

	// Metric label
	const metricLabel = {
		index: 'Index',
		profit: 'Profit/Day',
		time: 'Time Saved (hrs)',
		signals: 'Signals',
	}[metric];

	// Format value based on metric
	const formatValue = (val: number): string => {
		switch (metric) {
			case 'index':
				return val.toFixed(1);
			case 'profit':
				return fmtMoney(val);
			case 'time':
				return `${val.toFixed(1)}h`;
			case 'signals':
				return fmtNumber(val);
		}
	};

	return (
		<div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
				<h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
					KPI Dashboard
				</h1>
				
				{/* Controls */}
				<div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
					{/* Metric Selector */}
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<label htmlFor="metric-select" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>
							Metric:
						</label>
						<select
							id="metric-select"
							value={metric}
							onChange={(e) => setMetric(e.target.value as MetricType)}
							style={{
								padding: '0.375rem 0.625rem',
								borderRadius: '6px',
								border: '1px solid #d1d5db',
								backgroundColor: '#ffffff',
								color: '#111827',
								fontSize: '0.875rem',
								cursor: 'pointer',
							}}
						>
							<option value="index">Index</option>
							<option value="profit">Profit/Day</option>
							<option value="time">Time Saved</option>
							<option value="signals">Signals</option>
						</select>
					</div>

					{/* Timeframe Selector */}
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<label htmlFor="timeframe-select" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>
							Days:
						</label>
						<select
							id="timeframe-select"
							value={timeframe}
							onChange={(e) => setTimeframe(Number(e.target.value) as TimeframeType)}
							style={{
								padding: '0.375rem 0.625rem',
								borderRadius: '6px',
								border: '1px solid #d1d5db',
								backgroundColor: '#ffffff',
								color: '#111827',
								fontSize: '0.875rem',
								cursor: 'pointer',
							}}
						>
							<option value={7}>7 Days</option>
							<option value={14}>14 Days</option>
							<option value={30}>30 Days</option>
						</select>
					</div>
				</div>
			</div>

			{/* Stat Cards */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
				<StatCard
					label={`Total ${metricLabel}`}
					value={formatValue(aggregates.total)}
					color="#059669"
				/>
				<StatCard
					label={`Average ${metricLabel}`}
					value={formatValue(aggregates.avg)}
					color="#2563eb"
				/>
				<StatCard
					label="Projects"
					value={mockData.length.toString()}
					color="#7c3aed"
				/>
			</div>

			{/* Chart Card */}
			<div style={{
				backgroundColor: '#ffffff',
				border: '1px solid #e5e7eb',
				borderRadius: '12px',
				padding: '1.5rem',
				marginBottom: '1.5rem',
				boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
			}}>
				<h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
					{metricLabel} Trends
				</h2>
				
				{/* Legend */}
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
					{transformedData.map((item, idx) => (
						<div key={item.projectId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<div
								style={{
									width: '12px',
									height: '12px',
									borderRadius: '2px',
									backgroundColor: strokeColor(idx),
								}}
							/>
							<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
								{item.symbol}
							</span>
						</div>
					))}
				</div>

				{/* Chart */}
				<div style={{ width: '100%', overflowX: 'auto' }}>
					<LineChartSVG series={chartSeries} width={720} height={280} padding={32} />
				</div>
			</div>

			{/* Per-Project Tiles */}
			<h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
				Project Breakdown
			</h2>
			<div style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
				gap: '1rem',
			}}>
				{transformedData.map((item, idx) => {
					const lastValue = item.data[item.data.length - 1] || 0;
					return (
						<ProjectTile
							key={item.projectId}
							symbol={item.symbol}
							name={item.name}
							value={formatValue(lastValue)}
							data={item.data}
							color={strokeColor(idx)}
						/>
					);
				})}
			</div>
		</div>
	);
};

// StatCard Component
interface StatCardProps {
	label: string;
	value: string;
	color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
	return (
		<div
			style={{
				backgroundColor: '#ffffff',
				border: '1px solid #e5e7eb',
				borderRadius: '12px',
				padding: '1.25rem',
				boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
			}}
		>
			<div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
				{label}
			</div>
			<div style={{ fontSize: '1.875rem', fontWeight: 700, color }}>
				{value}
			</div>
		</div>
	);
};

// ProjectTile Component
interface ProjectTileProps {
	symbol: string;
	name: string;
	value: string;
	data: number[];
	color: string;
}

const ProjectTile: React.FC<ProjectTileProps> = ({ symbol, name, value, data, color }) => {
	return (
		<div
			style={{
				backgroundColor: '#ffffff',
				border: '1px solid #e5e7eb',
				borderRadius: '12px',
				padding: '1rem',
				boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
				<div>
					<div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
						{symbol}
					</div>
					<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
						{name}
					</div>
				</div>
				<div style={{ fontSize: '1.25rem', fontWeight: 600, color }}>
					{value}
				</div>
			</div>
			<div style={{ color }}>
				<Sparkline data={data} width={248} height={40} />
			</div>
		</div>
	);
};

