import React, { useState } from 'react';
import { useApi } from '../api/client';
import styles from './ItemsPanel.module.css';

type Item = { name?: string; description?: string } & Record<string, unknown>;

export const ItemsPanel: React.FC = () => {
	const { getJson, putJson } = useApi();
	const [me, setMe] = useState<Record<string, unknown> | null>(null);
	const [items, setItems] = useState<Record<string, Item> | null>(null);
	const [itemId, setItemId] = useState('plumbus');
	const [name, setName] = useState('The great Plumbus');
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function loadMe() {
		setError(null);
		setMessage(null);
		try {
			const data = await getJson<Record<string, unknown>>('/users/me');
			setMe(data);
		} catch (e) {
			setError((e as Error).message);
		}
	}

	async function loadItems() {
		setError(null);
		setMessage(null);
		try {
			const data = await getJson<Record<string, Item>>('/items');
			setItems(data);
		} catch (e) {
			setError((e as Error).message);
		}
	}

	async function updateItem() {
		setError(null);
		setMessage(null);
		try {
			const res = await putJson<{ item_id: string; name: string }>(`/items/${encodeURIComponent(itemId)}`, { name });
			setMessage(`Updated ${res.item_id}: ${res.name}`);
		} catch (e) {
			setError((e as Error).message);
		}
	}

	return (
		<section className={styles.panel}>
			<div className={styles.row}>
				<button onClick={loadMe}>Load My Profile</button>
				<button onClick={loadItems}>List Items</button>
			</div>
			{me && (
				<pre className={styles.pre}>{JSON.stringify(me, null, 2)}</pre>
			)}
			{items && (
				<table className={styles.table}>
					<thead>
						<tr><th className={styles.th}>Item ID</th><th className={styles.th}>Name</th></tr>
					</thead>
					<tbody>
						{Object.entries(items).map(([id, it]) => (
							<tr key={id}><td className={styles.td}>{id}</td><td className={styles.td}>{it.name ?? ''}</td></tr>
						))}
					</tbody>
				</table>
			)}
			<form className={styles.form} onSubmit={(e) => { e.preventDefault(); void updateItem(); }}>
				<input className={styles.input} placeholder="itemId" value={itemId} onChange={(e) => setItemId(e.target.value)} />
				<input className={styles.input} placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
				<button className={styles.button} type="submit">Update Item</button>
			</form>
			{message && <div className={styles.success}>{message}</div>}
			{error && <div className={styles.error} role="alert">{error}</div>}
		</section>
	);
};


