import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import styles from './SignInCard.module.css';

export const SignInCard: React.FC = () => {
	const { login } = useAuth();
	return (
		<div className={styles.container}>
			<section className={styles.card}>
				<h1 className={styles.title}>Fast Azure</h1>
				<p className={styles.subtitle}>A minimal React + FastAPI starter with Azure AD SSO.</p>
				<button className={styles.button} onClick={login} aria-label="Sign in with SSO">
					Sign in with SSO
				</button>
			</section>
		</div>
	);
};


