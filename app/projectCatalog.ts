import resume from "./profile";

export type Project = {
  id: string; title: string; short: string; company: string; period: string;
  kind: string; summary: string; role: string; contributions: string[];
  stack: string[]; outcomes: string[]; featured?: boolean;
  chapters?: { title: string; text: string }[];
};

// Public-facing copy reconciled against project-inventory-and-design.md.
// Periods are employment windows, not invented project delivery dates.
export const PROJECTS: Project[] = resume.projects;
export const FEATURED_PROJECTS = (resume.featuredProjectIds.length?resume.featuredProjectIds:PROJECTS.slice(0,3).map(p=>p.id)).map(id => PROJECTS.find(project => project.id === id)!);
export const PROJECT_COMPANIES = [...new Set(PROJECTS.map(project => project.company))];
