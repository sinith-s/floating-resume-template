import data from "#resume-profile";
import type {Project} from "./projectCatalog";
import type {SkillArea} from "./skillsCatalog";
import type {TechnologyCategory} from "./technologyCatalog";

export type ResumeProfile = {
  schemaVersion:number;
  identity:{firstName:string;lastName:string;monogram:string;role:string;tagline:string;location?:string;siteUrl?:string;description:string;socialDescription?:string;socialImage?:string;email?:string;linkedin?:string;github?:string};
  projects:Project[];featuredProjectIds:string[];skills:SkillArea[];technologies:TechnologyCategory[];
  experience:{name:string;dates:string}[];experienceSummary?:string;
  certifications:{name:string;file?:string;color:string}[];
  stations:{code:string;nav:string;title:string;subtitle:string;body:string;tags:string[];list:string[]}[];
  boardCopy:{title:string;summary:string;highlights:string[]}[];
};
const raw=data as unknown as ResumeProfile;
export const resume={
  ...raw,
  identity:{location:"",siteUrl:"",socialDescription:raw.identity.description,socialImage:"",email:"",linkedin:"",github:"",...raw.identity},
  experienceSummary:raw.experienceSummary??raw.experience.length+" ROLES",
};
// Preserve stable renderer IDs even when earlier sections are absent.
export const ACTIVE_STATION_IDS=[resume.projects,resume.skills,resume.experience,resume.technologies,resume.certifications]
  .flatMap((items,index)=>items.length?[index]:[]);
export default resume;
