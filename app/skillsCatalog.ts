import resume from "./profile";

export type SkillArea = { id:string; title:string; short:string; summary:string; skills:string[]; tools:string[]; projects:string[]; note?:string };

// Consolidated from the supplied resume, expanded Bold profile and user-provided
// AI/Karpenter experience. Capability labels are editorial groupings, not ratings.
export const SKILL_AREAS: SkillArea[] = resume.skills;
