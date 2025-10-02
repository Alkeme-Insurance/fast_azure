import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import { SignInCard } from '../components/SignInCard';
import { UserCard } from '../components/UserCard';
import { TaskList } from '../components/TaskList';
import { ProjectsPanel } from '../components/ProjectsPanel';
import { BoardPanel } from '../components/BoardPanel';

export const Home: React.FC = () => {
	const { status } = useAuth();

	if (status === 'loading') {
		return <div style={{ padding: '2rem' }}>Loading…</div>;
	}
	if (status === 'idle' || status === 'error') {
		return <SignInCard />;
	}
	return (
		<div style={{ 
			display: 'flex',
			flexWrap: 'wrap',
			gap: '1rem', 
			padding: '1rem',
			width: '100%',
			maxWidth: '100vw',
			boxSizing: 'border-box',
			alignContent: 'flex-start'
		}}>
			<div style={{ flex: '1 1 400px', minWidth: '400px', maxWidth: '600px' }}>
				<UserCard />
			</div>
			<div style={{ flex: '1 1 500px', minWidth: '500px', maxWidth: '900px' }}>
				<TaskList />
			</div>
			<div style={{ flex: '1 1 400px', minWidth: '400px', maxWidth: '800px' }}>
				<ProjectsPanel />
			</div>
			<div style={{ flex: '1 1 400px', minWidth: '400px', maxWidth: '800px' }}>
				<BoardPanel />
			</div>
		</div>
	);
};


