import type { Project } from '../types';

interface Props {
	project: Project;
	className?: string;
}

export default function ProjectCard({ project, className }: Props) {
	return (
		<div className={`rounded-md border border-gray-200 bg-white p-3 shadow-sm ${className ?? ''}`}>
			<div className="flex items-center justify-between gap-2">
				<h4 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h4>
				<span
					className={
						`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
							project.status === 'in-progress' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'
						}`
					}
				>
					{project.status}
				</span>
			</div>
			<div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
				<div className="inline-flex items-center gap-1">
					<span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
					<span className="truncate">{project.owner.name}</span>
				</div>
				{project.dueDate && (
					<div className="inline-flex items-center gap-1">
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
						<time dateTime={project.dueDate}>{new Date(project.dueDate).toLocaleDateString()}</time>
					</div>
				)}
			</div>
		</div>
	);
}
