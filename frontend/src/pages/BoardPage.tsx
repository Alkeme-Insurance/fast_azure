import { useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Board, Column, Card, Label, ChecklistItem, Project } from '../types';
import { useBoardApi } from '../api/board';
import { useProjectsApi } from '../api/projects';
import BoardColumn from '../components/BoardColumn';
import { ProjectDetailPanel } from '../components/ProjectDetailPanel';
import styles from './BoardPage.module.css';


interface Props {
	boardId: string;
}

export default function BoardPage({ boardId }: Props) {
	const api = useBoardApi();
	const projectsApi = useProjectsApi();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [board, setBoard] = useState<Board | null>(null);
	const [columns, setColumns] = useState<Column[]>([]);
	const [cards, setCards] = useState<Card[]>([]);
	const [project, setProject] = useState<Project | null>(null);
	const [projectLoading, setProjectLoading] = useState(false);
    const [addingColumn, setAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
	
	// Card creation modal state
	const [showCardModal, setShowCardModal] = useState(false);
	const [newCard, setNewCard] = useState({
		columnId: '',
		title: '',
		description: '',
		assignees: [] as string[],
		labels: [] as Label[],
		dueDate: '',
		checklist: [] as ChecklistItem[],
		attachmentCount: 0,
		commentCount: 0,
	});

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

	useEffect(() => {
		setLoading(true);
		api.getBoard(boardId)
			.then(({ board, columns, cards }) => {
				setBoard(board);
				setColumns(columns);
				setCards(cards);
				setLoading(false);
				
				// Fetch project details if board has a projectId
				if (board.projectId) {
					setProjectLoading(true);
					projectsApi.getById(board.projectId)
						.then((proj) => {
							setProject(proj);
							setProjectLoading(false);
						})
						.catch(() => {
							setProjectLoading(false);
						});
				}
			})
			.catch((e) => {
				setError(String(e));
				setLoading(false);
			});
	}, [boardId]);

    useEffect(() => {
        setUpdatedAt(new Date());
    }, [columns, cards]);

	const byColumn = useMemo(() => {
		const map: Record<string, Card[]> = {};
		for (const c of columns) map[c.id] = [];
		for (const card of cards) {
			if (!map[card.columnId]) map[card.columnId] = [];
			map[card.columnId].push(card);
		}
		for (const id of Object.keys(map)) map[id].sort((a, b) => a.position - b.position);
		return map;
	}, [columns, cards]);

	async function onCreateCard() {
		if (!newCard.title || !newCard.columnId) return;
		const nextPos = (byColumn[newCard.columnId]?.[byColumn[newCard.columnId].length - 1]?.position ?? 0) + 1;
		const cardData: any = {
			columnId: newCard.columnId,
			boardId: board?.id,
			title: newCard.title,
			position: nextPos,
		};
		if (newCard.description) cardData.description = newCard.description;
		if (newCard.assignees.length > 0) cardData.assignees = newCard.assignees;
		if (newCard.labels.length > 0) cardData.labels = newCard.labels;
		if (newCard.dueDate) cardData.dueDate = newCard.dueDate;
		if (newCard.checklist.length > 0) cardData.checklist = newCard.checklist;
		if (newCard.attachmentCount > 0) cardData.attachmentCount = newCard.attachmentCount;
		if (newCard.commentCount > 0) cardData.commentCount = newCard.commentCount;
		
		const created = await api.createCard(cardData);
		setCards((prev) => [...prev, created]);
		setShowCardModal(false);
		setNewCard({
			columnId: '',
			title: '',
			description: '',
			assignees: [],
			labels: [],
			dueDate: '',
			checklist: [],
			attachmentCount: 0,
			commentCount: 0,
		});
	}

    async function onCreateColumn() {
        const title = newColumnTitle.trim();
        if (!title || !board) return;
        const nextPos = (columns[columns.length - 1]?.position ?? 0) + 1;
        const created = await api.createColumn({ boardId: board.id, title, position: nextPos });
        setColumns((prev) => [...prev, created]);
        setNewColumnTitle('');
        setAddingColumn(false);
    }

    async function onRenameColumn(columnId: string, title: string) {
        await api.updateColumn(columnId, { title });
        setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, title } : c)));
    }

    async function onDeleteColumn(columnId: string) {
        await api.deleteColumn(columnId);
        setColumns((prev) => prev.filter((c) => c.id !== columnId));
        setCards((prev) => prev.filter((card) => card.columnId !== columnId));
    }

	async function onDragEnd(e: DragEndEvent) {
		const activeId = String(e.active.id);
		const overId = e.over?.id ? String(e.over.id) : null;
		if (!overId) return;
		// Find destination column by traversing DOM up from over.id if it is a card; here we treat over as drop zone id (column id)
		const destColumn = columns.find((c) => c.id === overId);
		const card = cards.find((c) => c.id === activeId);
		if (!card || !destColumn) return;
		const newPos = (byColumn[destColumn.id]?.[byColumn[destColumn.id].length - 1]?.position ?? 0) + 1;
		// optimistic update
		setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, columnId: destColumn.id, position: newPos } : c)));
		try {
			await api.updateCard(card.id, { columnId: destColumn.id, position: newPos });
		} catch (err) {
			// rollback
			setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
		}
	}

	if (loading) return <div className="p-4 text-sm text-gray-600">Loading…</div>;
	if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;
	if (!board) return <div className="p-4 text-sm text-gray-600">No board</div>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1rem', padding: '1rem', height: 'calc(100vh - 4rem)', overflow: 'hidden' }}>
			{/* Project Panel */}
			<div style={{ overflow: 'hidden' }}>
				<ProjectDetailPanel project={project} loading={projectLoading} />
			</div>

			{/* Board Panel */}
			<div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
				<section className={`${styles.panel} flex h-full flex-col`}>
				<div className={styles.header}>
                    <h2 className="text-base font-semibold text-gray-900">{board.name}</h2>
					<div className="flex items-center gap-2">
						<button 
							className="rounded-md border border-blue-500 bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600" 
							onClick={() => {
								setNewCard({...newCard, columnId: columns[0]?.id || ''});
								setShowCardModal(true);
							}}
						>
							Add Card
						</button>
						{addingColumn ? (
							<form className="inline-flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); void onCreateColumn(); }}>
								<input value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} placeholder="Column title" className="rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-2 py-1 text-sm" />
								<button className="rounded-md border border-[var(--card-border)] bg-white px-2 py-1 text-sm hover:bg-gray-50" type="submit">Create</button>
								<button className="rounded-md border border-[var(--card-border)] bg-white px-2 py-1 text-sm hover:bg-gray-50" type="button" onClick={() => setAddingColumn(false)}>Cancel</button>
							</form>
						) : (
							<button className="rounded-md border border-[var(--card-border)] bg-white px-2 py-1 text-sm hover:bg-gray-50" onClick={() => setAddingColumn(true)}>Add Column</button>
						)}
					</div>
                </div>
				<div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
					<DndContext sensors={sensors} onDragEnd={onDragEnd}>
						<div className="flex h-full gap-4 p-3" style={{ display: 'flex', flexDirection: 'row', minWidth: 'max-content', gap: '1rem', height: '100%' }}>
							{columns.map((col) => (
								<BoardColumn
									key={col.id}
									column={col}
									cards={byColumn[col.id] ?? []}
									onRename={(title) => onRenameColumn(col.id, title)}
									onDelete={() => onDeleteColumn(col.id)}
								/>
							))}
						</div>
					</DndContext>
				</div>
				<div className={styles.footer}>
					<div className="text-sm">{columns.length} columns • {cards.length} cards</div>
					<div className="text-sm">Last updated {updatedAt ? updatedAt.toLocaleTimeString() : ""}</div>
				</div>
            </section>
			</div>
			
			{/* Card Creation Modal */}
			{showCardModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowCardModal(false)}>
					<div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
						<h3 className="mb-4 text-lg font-semibold text-gray-900">Create New Card</h3>
						<form onSubmit={(e) => { e.preventDefault(); void onCreateCard(); }} className="space-y-4">
							{/* Column Selection */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Column *</label>
								<select 
									value={newCard.columnId} 
									onChange={(e) => setNewCard({...newCard, columnId: e.target.value})}
									className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									required
								>
									{columns.map(col => (
										<option key={col.id} value={col.id}>{col.title}</option>
									))}
								</select>
							</div>
							
							{/* Title */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
								<input 
									type="text" 
									value={newCard.title} 
									onChange={(e) => setNewCard({...newCard, title: e.target.value})}
									className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									placeholder="Enter card title"
									required
								/>
							</div>
							
							{/* Description */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
								<textarea 
									value={newCard.description} 
									onChange={(e) => setNewCard({...newCard, description: e.target.value})}
									className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									placeholder="Enter card description"
									rows={3}
								/>
							</div>
							
							{/* Assignees */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Assignees (comma-separated)</label>
								<input 
									type="text" 
									value={newCard.assignees.join(', ')} 
									onChange={(e) => setNewCard({...newCard, assignees: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
									className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
									placeholder="Alice, Bob, Charlie"
								/>
							</div>
							
							{/* Due Date */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
								<input 
									type="datetime-local" 
									value={newCard.dueDate} 
									onChange={(e) => setNewCard({...newCard, dueDate: e.target.value})}
									className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								/>
							</div>
							
							{/* Action Buttons */}
							<div className="flex items-center justify-end gap-2 pt-4">
								<button 
									type="button"
									onClick={() => setShowCardModal(false)}
									className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
								>
									Cancel
								</button>
								<button 
									type="submit"
									className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
								>
									Create Card
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
    );
}
