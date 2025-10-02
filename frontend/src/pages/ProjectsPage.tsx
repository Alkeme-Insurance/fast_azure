import { useEffect, useMemo, useState } from 'react';
import { useProjectsApi } from '../api/projects';
import type { Project } from '../types';
import ProjectCard from '../components/ProjectCard';
import { Link } from 'react-router-dom';

interface SortState { key: keyof Project | 'dueDate'; dir: 'asc' | 'desc'; }

export default function ProjectsPage() {
	const { list } = useProjectsApi();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [items, setItems] = useState<Project[]>([]);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(20);
	const [filterStatus, setFilterStatus] = useState<string>('');
	const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });
	const [selected, setSelected] = useState<Record<string, boolean>>({});

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
		data.sort((a, b) => {
			const av = (a as any)[sort.key];
			const bv = (b as any)[sort.key];
			if (av == null && bv == null) return 0;
			if (av == null) return 1;
			if (bv == null) return -1;
			const cmp = String(av).localeCompare(String(bv));
			return sort.dir === 'asc' ? cmp : -cmp;
		});
		return data;
	}, [items, filterStatus, sort]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
	const pageItems = filtered.slice((page - 1) * limit, page * limit);

	function toggleAll(checked: boolean) {
		const pageIds = pageItems.map((p) => p.id);
		setSelected((prev) => {
			const next = { ...prev };
			for (const id of pageIds) next[id] = checked;
			return next;
		});
	}

	return (
		<div className="p-4">
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<label className="text-sm text-gray-700">Status</label>
					<select
						value={filterStatus}
						onChange={(e) => {
							setFilterStatus(e.target.value);
							setPage(1);
						}}
						className="rounded-md border border-gray-300 px-2 py-1 text-sm"
					>
						<option value="">All</option>
						<option value="Active">Active</option>
						<option value="Closed">Closed</option>
					</select>
				</div>
				<div className="flex items-center gap-2">
					<label className="text-sm text-gray-700">Page size</label>
					<select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
						<option value={10}>10</option>
						<option value={20}>20</option>
						<option value={50}>50</option>
					</select>
				</div>
			</div>

			<div className="overflow-hidden rounded-md border border-gray-200">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
								<input
									type="checkbox"
									checked={pageItems.every((p) => selected[p.id]) && pageItems.length > 0}
									onChange={(e) => toggleAll(e.target.checked)}
								/>
							</th>
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
								<button
									onClick={() => setSort((s) => ({ key: 'name', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
									className="inline-flex items-center gap-1"
								>
									Name
								</button>
							</th>
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Owner</th>
							<th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
								<button
									onClick={() => setSort((s) => ({ key: 'dueDate', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
									className="inline-flex items-center gap-1"
								>
									Due Date
								</button>
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100 bg-white">
						{loading && (
							<tr><td className="p-4 text-sm text-gray-500" colSpan={5}>Loading…</td></tr>
						)}
						{!loading && error && (
							<tr><td className="p-4 text-sm text-red-600" colSpan={5}>{error}</td></tr>
						)}
						{!loading && !error && pageItems.map((p) => (
							<tr key={p.id} className="hover:bg-gray-50">
								<td className="px-3 py-2">
									<input
										type="checkbox"
										checked={!!selected[p.id]}
										onChange={(e) => setSelected((s) => ({ ...s, [p.id]: e.target.checked }))}
									/>
								</td>
								<td className="px-3 py-2 text-sm font-medium text-gray-900"><Link to={`/projects/${p.id}`}>{p.name}</Link></td>
								<td className="px-3 py-2 text-sm">
									<span className={`rounded-full px-2 py-0.5 text-xs ${p.status === 'in-progress' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'}`}>{p.status}</span>
								</td>
								<td className="px-3 py-2 text-sm text-gray-700">{p.owner.name}</td>
								<td className="px-3 py-2 text-sm text-gray-700">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '-'}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="mt-3 flex items-center justify-between">
				<div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
				<div className="inline-flex items-center gap-2">
					<button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50">Prev</button>
					<button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50">Next</button>
				</div>
			</div>

			<div className="mt-6">
				<h3 className="mb-2 text-sm font-semibold text-gray-800">Row details</h3>
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
					{Object.keys(selected).filter((id) => selected[id]).map((id) => {
						const proj = items.find((x) => x.id === id);
						return proj ? <ProjectCard key={id} project={proj} /> : null;
					})}
				</div>
			</div>
		</div>
	);
}
