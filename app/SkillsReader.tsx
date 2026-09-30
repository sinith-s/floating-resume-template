"use client";
import {useState} from "react";
import {SKILL_AREAS} from "./skillsCatalog";
import {PROJECTS} from "./projectCatalog";

export default function SkillsReader({selectedId,onSelect}:{selectedId:string;onSelect:(id:string)=>void}){
  const [section,setSection]=useState("Capabilities");
  const area=SKILL_AREAS.find(item=>item.id===selectedId)??SKILL_AREAS[0];
  return <div className="skillsReader">
    <nav className="skillsChoices" aria-label="Skill areas">{SKILL_AREAS.map((item,index)=><button key={item.id} aria-pressed={area.id===item.id} onClick={()=>{onSelect(item.id);setSection("Capabilities")}}><span>{String(index+1).padStart(2,"0")}</span>{item.short}</button>)}</nav>
    <h3>{area.title}</h3><p className="skillsSummary">{area.summary}</p>
    <div className="projectSectionNav" aria-label="Skill details">{["Capabilities","Tools","In practice"].map(name=><button key={name} aria-pressed={section===name} onClick={()=>setSection(name)}>{name}</button>)}</div>
    <div className="skillsContent" key={area.id+section}>
      {section==="Capabilities"&&<ul className="skillsList">{area.skills.map(skill=><li key={skill}>{skill}</li>)}</ul>}
      {section==="Tools"&&<div className="projectStack">{area.tools.map(tool=><span key={tool}>{tool}</span>)}</div>}
      {section==="In practice"&&<div className="skillsEvidence">{area.projects.map(id=>{const project=PROJECTS.find(p=>p.id===id)!;return <button key={id} onClick={()=>window.dispatchEvent(new CustomEvent("project-open",{detail:id}))}><small>{project.company}</small><strong>{project.title}</strong><span>{project.summary}</span><b>READ CASE STUDY ↗</b></button>})}</div>}
      {area.note&&<p className="skillsNote">{area.note}</p>}
    </div>
  </div>;
}
