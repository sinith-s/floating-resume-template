import resume from "./profile";

export type TechnologyCategory = {
  id: string; title: string; short: string; items: string[];
  logos: [string, string][]; note?: string;
};

// Validated profile data is the source of technology categories.
export const TECHNOLOGY_CATEGORIES: TechnologyCategory[] = resume.technologies as TechnologyCategory[];
