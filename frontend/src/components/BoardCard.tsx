import { useDraggable } from '@dnd-kit/core';
import type { Card, Project } from '../types';

interface Props {
	card: Card & { 
		project?: Project;
		description?: string;
		assignees?: string[];
		labels?: Array<{ name: string; color: string }>;
		dueDate?: string;
		checklist?: Array<{ text: string; completed: boolean }>;
		attachmentCount?: number;
		commentCount?: number;
	};
}

export default function BoardCard({ card }: Props) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
		id: card.id,
		data: card
	});
	const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
	
	const completedChecklist = card.checklist?.filter(item => item.completed).length ?? 0;
	const totalChecklist = card.checklist?.length ?? 0;
	const hasChecklist = totalChecklist > 0;
	
	const isDueSoon = card.dueDate && new Date(card.dueDate) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
	const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
	
	return (
		<div
			ref={setNodeRef}
			style={{
				...style,
				width: '100%',
				minHeight: '80px',
				backgroundColor: isDragging ? '#f0f9ff' : '#eff6ff',
				borderRadius: '8px',
				padding: '10px 12px',
				border: isDragging ? '2px dashed #3b82f6' : '1px solid #bfdbfe',
				cursor: isDragging ? 'grabbing' : 'grab',
				boxShadow: isDragging ? '0 8px 24px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.08)',
				opacity: isDragging ? 0.5 : 1,
				transform: style?.transform,
				transition: isDragging ? 'none' : 'all 0.15s ease',
				marginBottom: '8px',
				position: 'relative',
				zIndex: isDragging ? 1000 : 1
			}}
			{...attributes}
			{...listeners}
		>
			{/* Title - Bold and prominent */}
			<div style={{ 
				fontSize: '14px', 
				fontWeight: 700, 
				color: '#1e293b',
				lineHeight: '1.3',
				marginBottom: '8px',
				wordBreak: 'break-word'
			}}>
				{card.title}
			</div>
			
			{/* Labels - Colored chips in a row */}
			{card.labels && card.labels.length > 0 && (
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
					{card.labels.map((label, idx) => (
						<span
							key={idx}
							style={{
								display: 'inline-block',
								padding: '2px 8px',
								fontSize: '10px',
								fontWeight: 600,
								color: '#fff',
								backgroundColor: label.color,
								borderRadius: '4px',
								textTransform: 'uppercase',
								letterSpacing: '0.3px'
							}}
							title={label.name}
						>
							{label.name}
						</span>
					))}
				</div>
			)}
			
			{/* Description preview (optional) */}
			{card.description && (
				<p style={{
					fontSize: '12px',
					color: '#64748b',
					lineHeight: '1.4',
					marginBottom: '8px',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					display: '-webkit-box',
					WebkitLineClamp: 2,
					WebkitBoxOrient: 'vertical'
				}}>
					{card.description}
				</p>
			)}
			
			{/* Status badges row */}
			{(card.dueDate || hasChecklist || card.attachmentCount || card.commentCount) && (
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
					{/* Due Date */}
					{card.dueDate && (
						<span style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '3px',
							padding: '3px 7px',
							fontSize: '11px',
							fontWeight: 500,
							borderRadius: '4px',
							backgroundColor: isOverdue ? '#fee2e2' : isDueSoon ? '#fed7aa' : '#f3f4f6',
							color: isOverdue ? '#991b1b' : isDueSoon ? '#9a3412' : '#374151'
						}} title={`Due ${new Date(card.dueDate).toLocaleDateString()}`}>
							📅 {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
						</span>
					)}
					
					{/* Checklist Progress */}
					{hasChecklist && (
						<span style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '3px',
							padding: '3px 7px',
							fontSize: '11px',
							fontWeight: 500,
							borderRadius: '4px',
							backgroundColor: completedChecklist === totalChecklist ? '#d1fae5' : '#f3f4f6',
							color: completedChecklist === totalChecklist ? '#065f46' : '#374151'
						}} title={`${completedChecklist}/${totalChecklist} completed`}>
							{completedChecklist === totalChecklist ? '✓' : '☐'} {completedChecklist}/{totalChecklist}
						</span>
					)}
					
					{/* Attachments */}
					{card.attachmentCount && card.attachmentCount > 0 && (
						<span style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '3px',
							padding: '3px 7px',
							fontSize: '11px',
							fontWeight: 500,
							borderRadius: '4px',
							backgroundColor: '#f3f4f6',
							color: '#374151'
						}} title={`${card.attachmentCount} attachments`}>
							📎 {card.attachmentCount}
						</span>
					)}
					
					{/* Comments */}
					{card.commentCount && card.commentCount > 0 && (
						<span style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '3px',
							padding: '3px 7px',
							fontSize: '11px',
							fontWeight: 500,
							borderRadius: '4px',
							backgroundColor: '#f3f4f6',
							color: '#374151'
						}} title={`${card.commentCount} comments`}>
							💬 {card.commentCount}
						</span>
					)}
				</div>
			)}
			
			{/* Assignees - Small circular avatars */}
			{card.assignees && card.assignees.length > 0 && (
				<div style={{ display: 'flex', marginLeft: '-2px' }}>
					{card.assignees.slice(0, 3).map((assignee, idx) => (
						<div
							key={idx}
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: '22px',
								height: '22px',
								borderRadius: '50%',
								backgroundColor: '#3b82f6',
								color: '#fff',
								fontSize: '10px',
								fontWeight: 600,
								border: '2px solid #eff6ff',
								marginLeft: idx > 0 ? '-6px' : '0',
								zIndex: 10 - idx
							}}
							title={assignee}
						>
							{assignee.charAt(0).toUpperCase()}
						</div>
					))}
					{card.assignees.length > 3 && (
						<div style={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: '22px',
							height: '22px',
							borderRadius: '50%',
							backgroundColor: '#94a3b8',
							color: '#fff',
							fontSize: '9px',
							fontWeight: 600,
							border: '2px solid #eff6ff',
							marginLeft: '-6px',
							zIndex: 7
						}} title={`+${card.assignees.length - 3} more`}>
							+{card.assignees.length - 3}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
