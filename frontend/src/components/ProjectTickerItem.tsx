import React from 'react';
import type { ProjectTickerDatum } from '../types/ticker';
import { fmtMoney, fmtPct, getValueColor } from '../lib/ticker';
import { Sparkline } from './Sparkline';

interface ProjectTickerItemProps {
	datum: ProjectTickerDatum;
}

export const ProjectTickerItem: React.FC<ProjectTickerItemProps> = ({ datum }) => {
	const lastIndex = datum.indexSeries[datum.indexSeries.length - 1] || 100;
	const indexColor = getValueColor(lastIndex, 100);
	const profitColor = datum.profit >= 0 ? '#10b981' : '#ef4444';

	return (
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: '1rem',
				padding: '0.5rem 1rem',
				backgroundColor: '#f9fafb',
				borderRight: '1px solid #e5e7eb',
				whiteSpace: 'nowrap',
				flexShrink: 0
			}}
			role="listitem"
			aria-label={`${datum.name} metrics`}
		>
			{/* Symbol */}
			<div style={{ 
				display: 'flex', 
				flexDirection: 'column', 
				alignItems: 'center', 
				minWidth: '3rem' 
			}}>
				<span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }} title={datum.name}>
					{datum.symbol}
				</span>
				<span 
					style={{ 
						fontSize: '0.75rem', 
						fontWeight: 600,
						color: indexColor 
					}}
					aria-label={`Index: ${lastIndex.toFixed(1)}`}
				>
					{lastIndex.toFixed(1)}
				</span>
			</div>

			{/* Sparkline */}
			<div style={{ display: window.innerWidth >= 640 ? 'block' : 'none' }}>
				<Sparkline data={datum.indexSeries} width={60} height={24} />
			</div>

			{/* KPIs - hidden on mobile */}
			<div style={{ 
				display: window.innerWidth >= 768 ? 'flex' : 'none',
				alignItems: 'center',
				gap: '1rem',
				fontSize: '0.75rem'
			}}>
				{/* Profit */}
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Profit</span>
					<span 
						style={{ 
							fontWeight: 600,
							color: profitColor 
						}}
						aria-label={`Profit: ${fmtMoney(datum.profit)}`}
					>
						{fmtMoney(datum.profit)}
					</span>
				</div>

				{/* Margin */}
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Margin</span>
					<span style={{ fontWeight: 600, color: '#111827' }} aria-label={`Margin: ${fmtPct(datum.margin)}`}>
						{fmtPct(datum.margin)}
					</span>
				</div>

				{/* Time Saved */}
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Time</span>
					<span 
						style={{ 
							fontWeight: 600,
							color: datum.timeSavedHrs >= 0 ? '#10b981' : '#ef4444' 
						}}
						aria-label={`Time saved: ${datum.timeSavedHrs >= 0 ? '+' : ''}${datum.timeSavedHrs}h`}
					>
						{datum.timeSavedHrs >= 0 ? '+' : ''}{datum.timeSavedHrs}h
					</span>
				</div>

				{/* Signals */}
				{(datum.prs !== undefined || datum.appEvents !== undefined) && (
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '10px', color: '#4b5563' }}>
						{datum.prs !== undefined && (
							<span aria-label={`Pull requests: ${datum.prs}`}>PR:{datum.prs}</span>
						)}
						{datum.prs !== undefined && datum.appEvents !== undefined && <span>•</span>}
						{datum.appEvents !== undefined && (
							<span aria-label={`App events: ${datum.appEvents}`}>App:{datum.appEvents}</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

