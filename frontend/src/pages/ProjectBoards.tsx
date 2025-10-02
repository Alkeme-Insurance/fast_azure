import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBoardApi } from '../api/board';
import { useProjectsApi } from '../api/projects';
import type { Board, Project } from '../types';
import styles from '../components/BoardPanel.module.css';
import { ProjectDetailPanel } from '../components/ProjectDetailPanel';

export default function ProjectBoards() {
	const { projectId } = useParams<{ projectId: string }>();
	const { listBoardsByProject, createBoard, updateBoard, deleteBoard } = useBoardApi();
	const { getById } = useProjectsApi();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [project, setProject] = useState<Project | null>(null);
	const [boards, setBoards] = useState<Board[]>([]);
	const [adding, setAdding] = useState(false);
	const [newBoardName, setNewBoardName] = useState('');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState('');

	useEffect(() => {
		if (!projectId) return;
		
		Promise.all([
			getById(projectId),
			listBoardsByProject(projectId)
		])
			.then(([projectData, boardsData]) => {
				setProject(projectData);
				setBoards(boardsData.items);
				setLoading(false);
			})
			.catch((e) => {
				setError(String(e));
				setLoading(false);
			});
	}, [projectId]);

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newBoardName.trim() || !projectId) return;
		try {
			const created = await createBoard(newBoardName.trim(), projectId);
			setBoards((prev) => [...prev, created]);
			setNewBoardName('');
			setAdding(false);
		} catch (err) {
			setError(String(err));
		}
	};

	const handleUpdate = async (id: string) => {
		if (!editName.trim()) return;
		try {
			await updateBoard(id, editName.trim());
			setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, name: editName.trim() } : b)));
			setEditingId(null);
		} catch (err) {
			setError(String(err));
		}
	};

	const handleDelete = async (id: string, name: string) => {
		if (!confirm(`Delete board "${name}"?`)) return;
		try {
			await deleteBoard(id);
			setBoards((prev) => prev.filter((b) => b.id !== id));
		} catch (err) {
			setError(String(err));
		}
	};

	if (!projectId) {
		return <div className={styles.panel}>No project ID provided</div>;
	}

	return (
		<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', height: 'calc(100vh - 4rem)', overflow: 'hidden' }}>
			{/* Project Details Panel */}
			<div style={{ overflow: 'hidden' }}>
				<ProjectDetailPanel project={project} loading={loading} />
			</div>

			{/* Boards Panel */}
			<div style={{ overflow: 'hidden' }}>
				<section className={styles.panel}>
					<div className={styles.header}>
						<div>
							<h2 style={{ margin: 0 }}>Boards</h2>
							{project && (
								<p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
									Project: <Link to={`/projects/${projectId}`} style={{ color: 'var(--link-color)' }}>{project.name}</Link>
								</p>
							)}
						</div>
					</div>

			{adding ? (
				<form onSubmit={handleCreate} style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)' }}>
					<input
						placeholder="Board name"
						value={newBoardName}
						onChange={(e) => setNewBoardName(e.target.value)}
						autoFocus
						style={{ padding: '0.5rem', border: '1px solid var(--card-border)', borderRadius: '0.25rem', marginRight: '0.5rem' }}
					/>
					<button type="submit" style={{ marginRight: '0.5rem' }}>Create</button>
					<button type="button" onClick={() => setAdding(false)}>Cancel</button>
				</form>
			) : (
				<div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)' }}>
					<button onClick={() => setAdding(true)}>Add Board</button>
				</div>
			)}

			<table className={styles.table}>
				<thead>
					<tr>
						<th className={styles.th}>Board Name</th>
						<th className={styles.th}>Board ID</th>
						<th className={styles.th}>Actions</th>
					</tr>
				</thead>
				<tbody>
					{loading && (
						<tr><td className={styles.td} colSpan={3}>Loading…</td></tr>
					)}
					{!loading && error && (
						<tr><td className={styles.td} colSpan={3} style={{ color: '#fca5a5' }}>{error}</td></tr>
					)}
					{!loading && !error && boards.length === 0 && (
						<tr><td className={styles.td} colSpan={3}>No boards found for this project</td></tr>
					)}
					{!loading && !error && boards.map((board) => (
						<tr key={board.id}>
							<td className={styles.td}>
								{editingId === board.id ? (
									<input
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
										autoFocus
										style={{ padding: '0.25rem', border: '1px solid var(--card-border)', borderRadius: '0.25rem' }}
									/>
								) : (
									<Link to={`/board/${board.id}`} style={{ color: 'var(--link-color)' }}>{board.name}</Link>
								)}
							</td>
							<td className={styles.td} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{board.id}</td>
							<td className={styles.td}>
								{editingId === board.id ? (
									<>
										<button onClick={() => handleUpdate(board.id)} style={{ marginRight: '0.5rem' }}>Save</button>
										<button onClick={() => setEditingId(null)}>Cancel</button>
									</>
								) : (
									<>
										<button
											onClick={() => {
												setEditingId(board.id);
												setEditName(board.name);
											}}
											style={{ marginRight: '0.5rem' }}
										>
											Edit
										</button>
										<button onClick={() => handleDelete(board.id, board.name)}>Delete</button>
									</>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<div className={styles.footer}>
				<span>{boards.length} board(s)</span>
			</div>
		</section>
			</div>
		</div>
	);
}

