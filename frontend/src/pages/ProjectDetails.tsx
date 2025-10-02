import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectsApi } from '../api/projects';
import type { Project } from '../types';
import ProjectCard from '../components/ProjectCard';

export default function ProjectDetails() {
	const { projectId } = useParams();
	const { getById } = useProjectsApi();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [project, setProject] = useState<Project | null>(null);

	useEffect(() => {
		if (!projectId) return;
		setLoading(true);
		getById(projectId)
			.then((p) => { setProject(p); setLoading(false); })
			.catch((e) => { setError(String(e)); setLoading(false); });
	}, [projectId]);

	if (!projectId) return <div style={{ padding: '1rem' }}>No project id.</div>;
	if (loading) return <div style={{ padding: '1rem' }}>Loading…</div>;
	if (error) return <div style={{ padding: '1rem', color: '#fca5a5' }}>{error}</div>;
	if (!project) return <div style={{ padding: '1rem' }}>Not found.</div>;

	return (
		<div style={{ padding: '1rem' }}>
			<div style={{ marginBottom: '.5rem' }}>
				<Link to="/projects">← Back to Projects</Link>
			</div>
			<ProjectCard project={project} />
		</div>
	);
}


