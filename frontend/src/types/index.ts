export type ID = string;

export interface OwnerRef {
	id: ID;
	name: string;
}

export interface Milestone {
	title: string;
	date?: string; // ISO string
	completed: boolean;
}

export interface OKR {
	objective: string;
	keyResults: string[];
}

export interface Project {
	id: ID;
	name: string;
	status: "idea" | "discovery" | "in-progress" | "blocked" | "done";
	owner: OwnerRef;
	stakeholders?: string[];
	okr?: OKR;
	timelineStart?: string; // ISO string
	timelineEnd?: string; // ISO string
	milestones?: Milestone[];
	risksAssumptions?: string[];
	nextAction?: string;
	blockers?: string[];
	notes?: string;
	description?: string;
	dueDate?: string; // ISO string (legacy)
}

export interface ProjectsResponse {
	items: Project[];
	total: number;
}

export interface Board {
	id: ID;
	name: string;
	projectId?: ID;
	description?: string;
}

export interface Column {
	id: ID;
	boardId: ID;
	title: string;
	position: number;
}

export interface Label {
	name: string;
	color: string;
}

export interface ChecklistItem {
	text: string;
	completed: boolean;
}

export interface Card {
	id: ID;
	columnId: ID;
	boardId?: ID;
	title: string;
	description?: string;
	position: number;
	projectId?: ID;
	assignees?: string[];
	labels?: Label[];
	dueDate?: string; // ISO datetime string
	checklist?: ChecklistItem[];
	attachmentCount?: number;
	commentCount?: number;
}
