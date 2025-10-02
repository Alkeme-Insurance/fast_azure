import { useEffect, useState } from 'react';
import styles from './BoardPanel.module.css';
import { useBoardApi } from '../api/board';
import type { Board } from '../types';
import { Link } from 'react-router-dom';

export const BoardPanel: React.FC = () => {
	const { listBoards, createBoard, updateBoard, deleteBoard } = useBoardApi();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [items, setItems] = useState<Board[]>([]);
	const [adding, setAdding] = useState(false);
	const [newName, setNewName] = useState('');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState('');
	const [deletingId, setDeletingId] = useState<string | null>(null);

	useEffect(() => {
		setLoading(true);
		listBoards()
			.then((res) => {
				setItems(res.items);
				setLoading(false);
			})
			.catch((e) => {
				setError(String(e));
				setLoading(false);
			});
	}, []);

	return (
		<section className={styles.panel}>
			<div className={styles.header}>
				<h2 style={{ margin: 0 }}>Boards</h2>
				{adding ? (
					<form
						onSubmit={async (e) => {
							e.preventDefault();
							const name = newName.trim();
							if (!name) return;
							try {
								const created = await createBoard(name);
								setItems((prev) => [...prev, created]);
								setNewName('');
								setAdding(false);
							} catch (e) {
								setError(String(e));
							}
						}}
						style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}
					>
						<input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder="Board name"
							style={{ padding: '.5rem', borderRadius: 8, border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--fg)' }}
						/>
						<button type="submit">Create</button>
						<button type="button" onClick={() => setAdding(false)}>Cancel</button>
					</form>
				) : (
					<button onClick={() => setAdding(true)}>Add Board</button>
				)}
			</div>
				<table className={styles.table}>
				<thead>
					<tr>
							<th className={styles.th}>ID</th>
							<th className={styles.th}>Name</th>
						<th className={styles.th}>Open</th>
					</tr>
				</thead>
				<tbody>
						{loading && (
							<tr><td className={styles.td} colSpan={3}>Loading…</td></tr>
					)}
						{!loading && error && (
							<tr><td className={styles.td} colSpan={3} style={{ color: '#fca5a5' }}>{error}</td></tr>
					)}
						{!loading && !error && items.map((b) => (
							<tr key={b.id}>
								<td className={styles.td}>{b.id}</td>
								<td className={styles.td}>
								{editingId === b.id ? (
									<input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '.5rem', borderRadius: 8, border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--fg)' }} />
								) : (
									<Link to={`/board/${b.id}`}>{b.name}</Link>
								)}
							</td>
							<td className={styles.td}>
								<Link to={`/board/${b.id}`}>Open</Link>
								{editingId === b.id ? (
									<>
										<button
											style={{ marginLeft: '.5rem' }}
											onClick={async () => {
												try {
													await updateBoard(b.id, editName);
													setItems((prev) => prev.map((x) => (x.id === b.id ? { ...x, name: editName } : x)));
													setEditingId(null);
												} catch (e) {
													setError(String(e));
												}
										}}
									>
										Save
									</button>
									<button style={{ marginLeft: '.5rem' }} onClick={() => setEditingId(null)}>Cancel</button>
								</>
								) : (
									<>
										<button style={{ marginLeft: '.5rem' }} onClick={() => { setEditingId(b.id); setEditName(b.name); }}>Edit</button>
										<button
											style={{ marginLeft: '.5rem' }}
											disabled={deletingId === b.id}
											onClick={async () => {
												if (!confirm(`Delete board "${b.name}"?`)) return;
												setDeletingId(b.id);
												try {
													await deleteBoard(b.id);
													setItems((prev) => prev.filter((x) => x.id !== b.id));
												} catch (e) {
													setError(String(e));
												} finally {
													setDeletingId(null);
												}
										}}
									>
										Delete
									</button>
								</>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
};


