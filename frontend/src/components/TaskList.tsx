import { useEffect, useState } from 'react';
import { useBoardApi } from '../api/board';
import type { Card } from '../types';
import styles from './ProjectsPanel.module.css';

interface TaskWithBoard extends Card {
	boardName?: string;
	columnName?: string;
}

export const TaskList: React.FC = () => {
	const boardApi = useBoardApi();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [tasks, setTasks] = useState<TaskWithBoard[]>([]);

	useEffect(() => {
		const fetchAllTasks = async () => {
			try {
				setLoading(true);
				setError(null);

				// First, get all boards
				const boardsResponse = await boardApi.listBoards();
				const boards = boardsResponse.items || [];

				// Then fetch all cards from all boards
				const allTasks: TaskWithBoard[] = [];
				
				for (const board of boards) {
					try {
						const { columns, cards } = await boardApi.getBoard(board.id);
						
						// Create a map of column IDs to names
						const columnMap = new Map(columns.map(col => [col.id, col.title]));
						
						// Add board and column info to each card
						const boardCards = cards.map(card => ({
							...card,
							boardName: board.name,
							columnName: columnMap.get(card.columnId) || 'Unknown'
						}));
						
						allTasks.push(...boardCards);
					} catch (err) {
						console.error(`Failed to fetch cards for board ${board.id}:`, err);
					}
				}

				// Sort by due date (earliest first, null dates at the end)
				const sortedTasks = allTasks.sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});

				setTasks(sortedTasks);
			} catch (err) {
				setError(String(err));
			} finally {
				setLoading(false);
			}
		};

		fetchAllTasks();
	}, []);

	const getStatusColor = (dueDate?: string) => {
		if (!dueDate) return '#94a3b8'; // gray for no due date
		const due = new Date(dueDate);
		const now = new Date();
		const daysDiff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		
		if (daysDiff < 0) return '#ef4444'; // red - overdue
		if (daysDiff <= 2) return '#f97316'; // orange - due soon
		if (daysDiff <= 7) return '#eab308'; // yellow - due this week
		return '#22c55e'; // green - future
	};

	return (
		<section className={styles.panel}>
			<div className={styles.header}>
				<h2>My Tasks</h2>
				<span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
					{tasks.length} task{tasks.length !== 1 ? 's' : ''}
				</span>
			</div>

			{loading && (
				<div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
					Loading tasks…
				</div>
			)}

			{!loading && error && (
				<div className={styles.error}>{error}</div>
			)}

			{!loading && !error && tasks.length === 0 && (
				<div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
					No tasks found
				</div>
			)}

			{!loading && !error && tasks.length > 0 && (
				<div className={styles.scrollContainer}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th>Task</th>
								<th>Board</th>
								<th>Status</th>
								<th>Due Date</th>
								<th>Labels</th>
							</tr>
						</thead>
						<tbody>
							{tasks.map((task) => (
								<tr key={task.id}>
									<td>
										<div style={{ fontWeight: 500 }}>{task.title}</div>
										{task.description && (
											<div style={{ 
												fontSize: '0.75rem', 
												color: 'var(--text-secondary)',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												maxWidth: '300px'
											}}>
												{task.description}
											</div>
										)}
									</td>
									<td>
										<div style={{ fontSize: '0.875rem' }}>{task.boardName}</div>
										<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
											{task.columnName}
										</div>
									</td>
									<td>
										{task.assignees && task.assignees.length > 0 && (
											<div style={{ display: 'flex', gap: '4px' }}>
												{task.assignees.slice(0, 3).map((assignee, idx) => (
													<div
														key={idx}
														style={{
															width: '24px',
															height: '24px',
															borderRadius: '50%',
															backgroundColor: '#3b82f6',
															color: '#fff',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															fontSize: '10px',
															fontWeight: 600
														}}
														title={assignee}
													>
														{assignee.charAt(0).toUpperCase()}
													</div>
												))}
												{task.assignees.length > 3 && (
													<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingTop: '4px' }}>
														+{task.assignees.length - 3}
													</div>
												)}
											</div>
										)}
									</td>
									<td>
										{task.dueDate ? (
											<span
												style={{
													display: 'inline-block',
													padding: '4px 8px',
													borderRadius: '4px',
													fontSize: '0.75rem',
													fontWeight: 500,
													backgroundColor: getStatusColor(task.dueDate) + '20',
													color: getStatusColor(task.dueDate),
													border: `1px solid ${getStatusColor(task.dueDate)}40`
												}}
											>
												{new Date(task.dueDate).toLocaleDateString('en-US', { 
													month: 'short', 
													day: 'numeric',
													year: 'numeric'
												})}
											</span>
										) : (
											<span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>—</span>
										)}
									</td>
									<td>
										{task.labels && task.labels.length > 0 && (
											<div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
												{task.labels.map((label, idx) => (
													<span
														key={idx}
														style={{
															display: 'inline-block',
															padding: '2px 6px',
															fontSize: '10px',
															fontWeight: 600,
															color: '#fff',
															backgroundColor: label.color,
															borderRadius: '3px',
															textTransform: 'uppercase'
														}}
														title={label.name}
													>
														{label.name}
													</span>
												))}
											</div>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<div className={styles.footer}>
				<small>Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''} sorted by due date</small>
			</div>
		</section>
	);
};

