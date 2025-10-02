import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './ProjectsPanel.module.css';
import { useProjectsApi } from '../api/projects';
import type { Project, OwnerRef } from '../types';

export const ProjectsPanel: React.FC = () => {
	const { list, create, remove, update } = useProjectsApi();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [items, setItems] = useState<Project[]>([]);
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [filterStatus, setFilterStatus] = useState<string>('');
	const [sort] = useState<{ key: keyof Project | 'dueDate'; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });
	const [adding, setAdding] = useState(false);
	const [newName, setNewName] = useState('');
	const [newOwner, setNewOwner] = useState('You');
	const [newStatus, setNewStatus] = useState('idea');
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState('');
	const [editOwner, setEditOwner] = useState('');
	const [editStatus, setEditStatus] = useState<'idea' | 'discovery' | 'in-progress' | 'blocked' | 'done'>('idea');

	useEffect(() => {
		setLoading(true);
		list({ page: 1, limit: 200 })
			.then((res) => {
				setItems(res.items);
				setLoading(false);
			})
			.catch((e) => {
				setError(String(e));
				setLoading(false);
			});
	}, []);

	const filtered = useMemo(() => {
		let data = [...items];
		if (filterStatus) data = data.filter((p) => p.status === filterStatus);
		const getValue = (p: Project): string | number => {
			switch (sort.key) {
				case 'name':
					return p.name;
				case 'status':
					return p.status;
				case 'dueDate':
					return p.dueDate ?? '';
				case 'id':
					return p.id;
				case 'owner':
					return p.owner?.name ?? '';
				default:
					return '';
			}
		};
		data.sort((a, b) => {
			const av = getValue(a);
			const bv = getValue(b);
			const cmp = String(av).localeCompare(String(bv));
			return sort.dir === 'asc' ? cmp : -cmp;
		});
		return data;
	}, [items, filterStatus, sort]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
	const pageItems = filtered.slice((page - 1) * limit, page * limit);

	return (
		<section className={styles.panel}>
			<div className={styles.header}>
				<h2>Projects</h2>
				<div className={styles.toolbar}>
					<label>Filter</label>
					<select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
						<option value="">All</option>
						<option value="idea">Idea</option>
						<option value="discovery">Discovery</option>
						<option value="in-progress">In Progress</option>
						<option value="blocked">Blocked</option>
						<option value="done">Done</option>
					</select>
				</div>
			</div>
			{adding ? (
				<form
					className={styles.form}
					onSubmit={async (e) => {
						e.preventDefault();
						const name = newName.trim();
						if (!name) return;
						try {
							const created = await create({
								name,
								status: newStatus as Project['status'],
								owner: { id: 'me', name: newOwner },
							});
							setItems((prev) => [created, ...prev]);
							setNewName('');
							setAdding(false);
						} catch (err) {
							setError(String(err));
						}
					}}
				>
					<input className={styles.input} placeholder="Project name" value={newName} onChange={(e) => setNewName(e.target.value)} />
					<select className={styles.input} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
						<option value="idea">Idea</option>
						<option value="discovery">Discovery</option>
						<option value="in-progress">In Progress</option>
						<option value="blocked">Blocked</option>
						<option value="done">Done</option>
					</select>
					<input className={styles.input} placeholder="Owner name" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
					<button className={styles.button} type="submit">Create</button>
					<button className={styles.button} type="button" onClick={() => setAdding(false)}>Cancel</button>
				</form>
			) : (
				<div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)', flexShrink: 0 }}>
					<button className={styles.button} type="button" onClick={() => setAdding(true)}>Add Project</button>
				</div>
			)}
			<div className={styles.scrollContainer}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th className={styles.th}>Name</th>
							<th className={styles.th}>Status</th>
							<th className={styles.th}>Owner</th>
							<th className={styles.th}>Due</th>
							<th className={styles.th}>Actions</th>
						</tr>
					</thead>
					<tbody>
					{loading && (
						<tr><td className={styles.td} colSpan={5}>Loading…</td></tr>
					)}
					{!loading && error && (
						<tr><td className={styles.td} colSpan={5} style={{ color: '#fca5a5' }}>{error}</td></tr>
					)}
					{!loading && !error && pageItems.map((p) => (
						<tr key={p.id}>
							<td className={styles.td}>
								{editingId === p.id ? (
									<input className={styles.input} value={editName} onChange={(e) => setEditName(e.target.value)} />
								) : (
									<Link to={`/projects/${p.id}/boards`} style={{ color: 'var(--link-color)', textDecoration: 'none' }}>
										{p.name}
									</Link>
								)}
							</td>
							<td className={styles.td}>
								{editingId === p.id ? (
									<select className={styles.input} value={editStatus} onChange={(e) => setEditStatus(e.target.value as Project['status'])}>
										<option value="idea">Idea</option>
										<option value="discovery">Discovery</option>
										<option value="in-progress">In Progress</option>
										<option value="blocked">Blocked</option>
										<option value="done">Done</option>
									</select>
								) : (
									p.status
								)}
							</td>
							<td className={styles.td}>
								{editingId === p.id ? (
									<input className={styles.input} value={editOwner} onChange={(e) => setEditOwner(e.target.value)} />
								) : (
									p.owner.name
								)}
							</td>
							<td className={styles.td}>{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '-'}</td>
							<td className={styles.td}>
								<button
									className={styles.button}
									disabled={deletingId === p.id}
									onClick={async () => {
										if (!confirm(`Delete project "${p.name}"?`)) return;
										setDeletingId(p.id);
										try {
											await remove(p.id);
											setItems((prev) => prev.filter((x) => x.id !== p.id));
										} catch (err) {
											setError(String(err));
										} finally {
											setDeletingId(null);
										}
									}}
								>
									Delete
								</button>
								{editingId === p.id ? (
									<>
										<button
											className={styles.button}
											onClick={async () => {
												try {
												const owner: OwnerRef = { id: (p.owner && (p.owner as OwnerRef).id) || 'me', name: editOwner };
												const changes: Partial<Project> = { name: editName, status: editStatus, owner };
													const updated = await update(p.id, changes);
													setItems((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
													setEditingId(null);
												} catch (err) {
													setError(String(err));
												}
										}}
									>
										Save
									</button>
									<button className={styles.button} onClick={() => setEditingId(null)}>Cancel</button>
								</>
								) : (
									<button
										className={styles.button}
										onClick={() => { setEditingId(p.id); setEditName(p.name); setEditOwner(p.owner.name); setEditStatus(p.status); }}
									>
										Edit
									</button>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			</div>
			<div className={styles.footer}>
				<div>Page {page} of {totalPages}</div>
				<div>
					<button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
					<button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
				</div>
			</div>
		</section>
	);
};
