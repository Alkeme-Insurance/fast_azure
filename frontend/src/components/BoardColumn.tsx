import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Column, Card } from '../types';
import BoardCard from './BoardCard';

interface Props {
    column: Column;
    cards: Card[];
    onRename?: (title: string) => void;
    onDelete?: () => void;
}

export default function BoardColumn({ column, cards, onRename, onDelete }: Props) {
	const { setNodeRef, isOver } = useDroppable({ id: column.id });
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(column.title);
	
	return (
		<div 
			style={{
				width: '280px',
				minWidth: '280px',
				maxWidth: '280px',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: '#f8fafc',
				borderRadius: '8px',
				border: '1px solid #e2e8f0'
			}}
		>
			{/* Header */}
			<div 
				style={{
					padding: '12px 14px',
					borderBottom: '1px solid #e2e8f0',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: '8px',
					flexShrink: 0
				}}
			>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const val = editTitle.trim();
                                if (!val) return;
                                onRename && onRename(val);
                                setIsEditing(false);
                            }}
							style={{ flex: 1, minWidth: 0 }}
                        >
                            <input
                                className="rounded border border-gray-300 px-2 py-1 text-sm w-full"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                autoFocus
                            />
                        </form>
                    ) : (
                        <h3 style={{ 
							fontSize: '14px', 
							fontWeight: 600, 
							color: '#1e293b',
							margin: 0,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap'
						}}>
							{column.title}
						</h3>
                    )}
                    <span style={{ 
						fontSize: '12px', 
						color: '#64748b',
						fontWeight: 500,
						flexShrink: 0
					}}>
						{cards.length}
					</span>
                </div>
                
				{/* Menu Buttons */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {isEditing ? (
                        <>
                            <button
                                style={{
									padding: '4px 8px',
									fontSize: '11px',
									border: '1px solid #cbd5e1',
									borderRadius: '4px',
									backgroundColor: '#fff',
									cursor: 'pointer',
									fontWeight: 500
								}}
                                onClick={() => {
                                    const val = editTitle.trim();
                                    if (!val) return setIsEditing(false);
                                    onRename && onRename(val);
                                    setIsEditing(false);
                                }}
                            >
                                Save
                            </button>
                            <button 
								style={{
									padding: '4px 8px',
									fontSize: '11px',
									border: '1px solid #cbd5e1',
									borderRadius: '4px',
									backgroundColor: '#fff',
									cursor: 'pointer',
									fontWeight: 500
								}}
								onClick={() => { 
									setIsEditing(false); 
									setEditTitle(column.title); 
								}}
							>
								Cancel
							</button>
                        </>
                    ) : (
                        <>
                            {onRename && (
                                <button 
									style={{
										padding: '4px 8px',
										fontSize: '11px',
										border: '1px solid #cbd5e1',
										borderRadius: '4px',
										backgroundColor: '#fff',
										cursor: 'pointer',
										fontWeight: 500,
										color: '#475569'
									}}
									onClick={() => setIsEditing(true)}
								>
									Edit
								</button>
                            )}
                            {onDelete && (
                                <button
									style={{
										padding: '4px 8px',
										fontSize: '11px',
										border: '1px solid #fca5a5',
										borderRadius: '4px',
										backgroundColor: '#fff',
										cursor: 'pointer',
										fontWeight: 500,
										color: '#dc2626'
									}}
                                    onClick={() => { 
										if (confirm(`Delete column "${column.title}"?`)) onDelete(); 
									}}
                                >
                                    Delete
                                </button>
                            )}
                        </>
                    )}
                </div>
			</div>
			
			{/* Cards Container (droppable area) */}
			<div 
				ref={setNodeRef}
				style={{
					flex: 1,
					overflowY: 'auto',
					overflowX: 'hidden',
					padding: '12px',
					display: 'flex',
					flexDirection: 'column',
					gap: '8px',
					minHeight: '100px',
					backgroundColor: isOver ? '#eff6ff' : 'transparent',
					borderRadius: isOver ? '4px' : '0',
					transition: 'background-color 0.15s ease'
				}}
			>
				{cards.map((c) => (
					<BoardCard key={c.id} card={c as any} />
				))}
			</div>
		</div>
	);
}
