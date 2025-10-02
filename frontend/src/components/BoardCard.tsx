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
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
	const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
	
	const completedChecklist = card.checklist?.filter(item => item.completed).length ?? 0;
	const totalChecklist = card.checklist?.length ?? 0;
	const hasChecklist = totalChecklist > 0;
	
	const isDueSoon = card.dueDate && new Date(card.dueDate) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
	const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
	
	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`w-full min-h-[60px] cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-150 outline-none hover:shadow-md hover:border-gray-300 focus:ring-2 focus:ring-blue-500 active:cursor-grabbing ${
				isDragging ? 'opacity-60 shadow-lg ring-2 ring-blue-400' : ''
			}`}
		>
			{/* Header: Title */}
			<div className="text-sm font-semibold text-gray-900 leading-tight mb-1">{card.title}</div>
			
			{/* Badges Row - Quick Indicators */}
			{(card.labels?.length || card.dueDate || hasChecklist || card.attachmentCount || card.commentCount) && (
				<div className="flex flex-wrap items-center gap-2">
					{/* Labels - Colored Pills */}
					{card.labels && card.labels.length > 0 && (
						<>
							{card.labels.map((label, idx) => (
								<span
									key={idx}
									className="inline-block h-2.5 w-8 rounded-full"
									style={{ backgroundColor: label.color }}
									title={label.name}
								/>
							))}
						</>
					)}
					
					{/* Due Date Icon */}
					{card.dueDate && (
						<span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${
							isOverdue 
								? 'bg-red-50 text-red-700'
								: isDueSoon 
								? 'bg-orange-50 text-orange-700'
								: 'bg-gray-100 text-gray-700'
						}`} title={`Due ${new Date(card.dueDate).toLocaleDateString()}`}>
							📅 {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
						</span>
					)}
					
					{/* Checklist Progress Icon */}
					{hasChecklist && (
						<span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${
							completedChecklist === totalChecklist ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
						}`} title={`${completedChecklist}/${totalChecklist} completed`}>
							{completedChecklist === totalChecklist ? '✓' : '☐'} {completedChecklist}/{totalChecklist}
						</span>
					)}
					
					{/* Attachments Icon */}
					{card.attachmentCount && card.attachmentCount > 0 && (
						<span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700" title={`${card.attachmentCount} attachments`}>
							📎 {card.attachmentCount}
						</span>
					)}
					
					{/* Comments Icon */}
					{card.commentCount && card.commentCount > 0 && (
						<span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700" title={`${card.commentCount} comments`}>
							💬 {card.commentCount}
						</span>
					)}
				</div>
			)}
			
			{/* Body: Description Preview (Optional) */}
			{card.description && (
				<p className="mt-2 line-clamp-1 text-xs text-gray-500">{card.description}</p>
			)}
			
			{/* Assignees - Circular Avatars */}
			{card.assignees && card.assignees.length > 0 && (
				<div className="mt-2 flex -space-x-1.5">
					{card.assignees.slice(0, 3).map((assignee, idx) => (
						<div
							key={idx}
							className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-[10px] font-semibold text-white ring-1 ring-white"
							title={assignee}
						>
							{assignee.charAt(0).toUpperCase()}
						</div>
					))}
					{card.assignees.length > 3 && (
						<div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-[10px] font-semibold text-gray-700 ring-1 ring-white" title={`+${card.assignees.length - 3} more`}>
							+{card.assignees.length - 3}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
