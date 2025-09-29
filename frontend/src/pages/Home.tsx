import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import { SignInCard } from '../components/SignInCard';
import { UserCard } from '../components/UserCard';
import { ItemsPanel } from '../components/ItemsPanel';

export const Home: React.FC = () => {
	const { status } = useAuth();

	if (status === 'loading') {
		return <div style={{ padding: '2rem' }}>Loading…</div>;
	}
	if (status === 'idle' || status === 'error') {
		return <SignInCard />;
	}
	return (
		<div style={{ display: 'grid', gap: '1rem', padding: '1rem' }}>
			<UserCard />
			<ItemsPanel />
		</div>
	);
};


