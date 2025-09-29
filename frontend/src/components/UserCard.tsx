import React, { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import styles from './UserCard.module.css';

export const UserCard: React.FC = () => {
	const { user, logout } = useAuth();
	const [showClaims, setShowClaims] = useState(false);

	const prettyClaims = useMemo(() => {
		if (!user?.claims) return '';
		const safe = { ...user.claims } as Record<string, unknown>;
		if (typeof safe['id_token'] === 'string') {
			safe['id_token'] = (safe['id_token'] as string).slice(0, 20) + '...';
		}
		return JSON.stringify(safe, null, 2);
	}, [user?.claims]);

	return (
		<section className={styles.card}>
			<h2 className={styles.title}>Signed in</h2>
			<div className={styles.grid}>
				<div className={styles.label}>Name</div>
				<div className={styles.value}>{user?.name ?? user?.displayName}</div>
				<div className={styles.label}>Email/UPN</div>
				<div className={styles.value}>{user?.preferred_username}</div>
				<div className={styles.label}>Tenant (tid)</div>
				<div className={styles.value}>{user?.tenantId}</div>
				<div className={styles.label}>Object ID (oid)</div>
				<div className={styles.value}>{user?.oid}</div>
			</div>
			<div className={styles.claims}>
				<button onClick={() => setShowClaims(v => !v)} aria-expanded={showClaims}>
					{showClaims ? 'Hide' : 'Show'} ID token claims
				</button>
				{showClaims && <pre className={styles.pre}>{prettyClaims}</pre>}
			</div>
			<div style={{ marginTop: '1rem' }}>
				<button onClick={logout}>Sign out</button>
			</div>
		</section>
	);
};


