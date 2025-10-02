import type { Project } from '../types';
import styles from './ProjectsPanel.module.css';

interface ProjectDetailPanelProps {
	project: Project | null;
	loading: boolean;
}

export const ProjectDetailPanel: React.FC<ProjectDetailPanelProps> = ({ project, loading }) => {
	if (loading) {
		return (
			<section className={styles.panel}>
				<div className={styles.header}>
					<h2 style={{ margin: 0 }}>Project Details</h2>
				</div>
				<div style={{ padding: '1rem' }}>Loading…</div>
			</section>
		);
	}

	if (!project) {
		return (
			<section className={styles.panel}>
				<div className={styles.header}>
					<h2 style={{ margin: 0 }}>Project Details</h2>
				</div>
				<div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No project found</div>
			</section>
		);
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'idea': return '#94a3b8'; // gray
			case 'discovery': return '#60a5fa'; // blue
			case 'in-progress': return '#34d399'; // green
			case 'blocked': return '#f87171'; // red
			case 'done': return '#a78bfa'; // purple
			default: return '#94a3b8';
		}
	};

	return (
		<section className={styles.panel}>
			<div className={styles.header}>
				<h2 style={{ margin: 0 }}>{project.name}</h2>
			</div>

			<div style={{ padding: '1.5rem', maxHeight: 'calc(100vh - 12rem)', overflowY: 'auto' }}>
				{/* Status */}
				<div style={{ marginBottom: '1.5rem' }}>
					<label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
						Status
					</label>
					<span
						style={{
							display: 'inline-block',
							padding: '0.25rem 0.75rem',
							borderRadius: '9999px',
							fontSize: '0.875rem',
							fontWeight: 500,
							backgroundColor: getStatusColor(project.status) + '20',
							color: getStatusColor(project.status),
							border: `1px solid ${getStatusColor(project.status)}40`
						}}
					>
						{project.status}
					</span>
				</div>

				{/* Description */}
				{project.description && (
					<div style={{ marginBottom: '1.5rem' }}>
						<label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
							Description
						</label>
						<p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
							{project.description}
						</p>
					</div>
				)}

				{/* Owner */}
				<div style={{ marginBottom: '1.5rem' }}>
					<label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
						Owner / PM
					</label>
					<p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
						{project.owner.name}
					</p>
				</div>

				{/* Stakeholders */}
				{project.stakeholders && project.stakeholders.length > 0 && (
					<div style={{ marginBottom: '1.5rem' }}>
						<label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
							Stakeholders
						</label>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
							{project.stakeholders.map((stakeholder, i) => (
								<span
									key={i}
									style={{
										padding: '0.25rem 0.5rem',
										fontSize: '0.75rem',
										backgroundColor: 'var(--card-bg)',
										border: '1px solid var(--card-border)',
										borderRadius: '0.25rem',
										color: 'var(--text-primary)'
									}}
								>
									{stakeholder}
								</span>
							))}
						</div>
					</div>
				)}

				{/* OKR */}
				{project.okr && (
					<div style={{ marginBottom: '1.5rem' }}>
						<label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
							OKR (Objectives and Key Results)
						</label>
						<div style={{ padding: '1rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.5rem' }}>
							<p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
								{project.okr.objective}
							</p>
							{project.okr.keyResults && project.okr.keyResults.length > 0 && (
								<ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
									{project.okr.keyResults.map((kr, i) => (
										<li key={i} style={{ marginBottom: '0.25rem' }}>{kr}</li>
									))}
								</ul>
							)}
						</div>
					</div>
				)}

				{/* Timeline */}
				{(project.timelineStart || project.timelineEnd) && (
					<div style={{ marginBottom: '1.5rem' }}>
						<label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
							Timeline
						</label>
						<div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
							{project.timelineStart && (
								<div>
									<strong>Start:</strong> {new Date(project.timelineStart).toLocaleDateString()}
								</div>
							)}
							{project.timelineEnd && (
								<div>
									<strong>End:</strong> {new Date(project.timelineEnd).toLocaleDateString()}
								</div>
							)}
						</div>
					</div>
				)}

				{/* Milestones */}
				{project.milestones && project.milestones.length > 0 && (
					<div style={{ marginBottom: '1.5rem' }}>
						<label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
							Milestones
						</label>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
							{project.milestones.map((milestone, i) => (
								<div
									key={i}
									style={{
										padding: '0.75rem',
										backgroundColor: 'var(--card-bg)',
										border: '1px solid var(--card-border)',
										borderRadius: '0.25rem',
										display: 'flex',
										alignItems: 'center',
										gap: '0.75rem'
									}}
								>
									<input
										type="checkbox"
										checked={milestone.completed}
										readOnly
										style={{ cursor: 'default' }}
									/>
									<div style={{ flex: 1 }}>
										<div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', textDecoration: milestone.completed ? 'line-through' : 'none' }}>
											{milestone.title}
										</div>
										{milestone.date && (
											<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
												{new Date(milestone.date).toLocaleDateString()}
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Risks & Assumptions */}
				{project.risksAssumptions && project.risksAssumptions.length > 0 && (
					<div style={{ marginBottom: '1.5rem' }}>
						<label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
							Risks / Assumptions
						</label>
						<ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
							{project.risksAssumptions.map((risk, i) => (
								<li key={i} style={{ marginBottom: '0.5rem' }}>{risk}</li>
							))}
						</ul>
					</div>
				)}

				{/* Next Action */}
				{project.nextAction && (
					<div style={{ marginBottom: '1.5rem' }}>
						<label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
							Next Action
						</label>
						<p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', padding: '0.75rem', backgroundColor: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '0.25rem' }}>
							{project.nextAction}
						</p>
					</div>
				)}

				{/* Blockers */}
				{project.blockers && project.blockers.length > 0 && (
					<div style={{ marginBottom: '1.5rem' }}>
						<label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
							Blockers
						</label>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
							{project.blockers.map((blocker, i) => (
								<div
									key={i}
									style={{
										padding: '0.75rem',
										fontSize: '0.875rem',
										backgroundColor: '#fee2e2',
										border: '1px solid #fca5a5',
										borderRadius: '0.25rem',
										color: '#991b1b'
									}}
								>
									{blocker}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Notes */}
				{project.notes && (
					<div style={{ marginBottom: '1.5rem' }}>
						<label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
							Notes
						</label>
						<p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--text-primary)', padding: '0.75rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.25rem', whiteSpace: 'pre-wrap' }}>
							{project.notes}
						</p>
					</div>
				)}
			</div>
		</section>
	);
};

