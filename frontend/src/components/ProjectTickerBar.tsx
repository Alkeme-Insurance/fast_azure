import React, { useRef, useState, useEffect } from 'react';
import type { ProjectTickerDatum } from '../types/ticker';
import { ProjectTickerItem } from './ProjectTickerItem';

interface ProjectTickerBarProps {
	data: ProjectTickerDatum[];
	autoScroll?: boolean;
	scrollSpeed?: number; // pixels per second
}

export const ProjectTickerBar: React.FC<ProjectTickerBarProps> = ({ 
	data, 
	autoScroll = true,
	scrollSpeed = 30
}) => {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [isPaused, setIsPaused] = useState(false);
	const animationRef = useRef<number | null>(null);
	const scrollPositionRef = useRef(0);
	const lastTimeRef = useRef<number>(0);

	// Duplicate data for continuous scroll effect
	const duplicatedData = [...data, ...data, ...data];

	useEffect(() => {
		if (!autoScroll || isPaused || !scrollContainerRef.current) return;

		const container = scrollContainerRef.current;
		const singleSetWidth = container.scrollWidth / 3; // Width of one set of items

		const animate = (timestamp: number) => {
			if (lastTimeRef.current === 0) {
				lastTimeRef.current = timestamp;
			}

			const deltaTime = timestamp - lastTimeRef.current;
			lastTimeRef.current = timestamp;

			// Calculate scroll distance based on speed and time
			const scrollDistance = (scrollSpeed * deltaTime) / 1000;
			scrollPositionRef.current += scrollDistance;

			// Reset position when we've scrolled one full set
			if (scrollPositionRef.current >= singleSetWidth) {
				scrollPositionRef.current = 0;
			}

			container.scrollLeft = scrollPositionRef.current;
			animationRef.current = requestAnimationFrame(animate);
		};

		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [autoScroll, isPaused, scrollSpeed]);

	const handleMouseEnter = () => {
		setIsPaused(true);
	};

	const handleMouseLeave = () => {
		setIsPaused(false);
		lastTimeRef.current = 0; // Reset time to prevent jump
	};

	if (data.length === 0) {
		return (
			<div className="w-full bg-gray-50 border-b border-gray-200 py-2 px-4">
				<span className="text-sm text-gray-500">No ticker data available</span>
			</div>
		);
	}

	return (
		<div
			ref={scrollContainerRef}
			className="scrollbar-hide"
			style={{
				width: '100%',
				overflowX: 'auto',
				overflowY: 'hidden',
				backgroundColor: '#ffffff',
				borderBottom: '1px solid #e5e7eb',
				scrollbarWidth: 'none',
				msOverflowStyle: 'none',
				WebkitOverflowScrolling: 'touch'
			}}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			role="list"
			aria-label="Project metrics ticker"
		>
			<div style={{ 
				display: 'flex', 
				flexDirection: 'row',
				alignItems: 'center',
				minWidth: 'max-content',
				width: 'max-content'
			}}>
				{duplicatedData.map((datum, index) => (
					<ProjectTickerItem 
						key={`${datum.projectId}-${index}`} 
						datum={datum} 
					/>
				))}
			</div>
		</div>
	);
};

