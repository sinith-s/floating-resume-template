"use client";

import { useEffect, useRef, useState } from "react";
import { PROJECTS, PROJECT_COMPANIES, FEATURED_PROJECTS } from "./projectCatalog";

const SECTIONS = ["Overview", "My contribution", "Architecture & stack", "Outcomes"] as const;

export default function ProjectReader({ selectedId, onSelect, visible }: { selectedId: string; onSelect: (id: string) => void; visible: boolean }) {
  const [filter, setFilter] = useState("All projects"), [section, setSection] = useState<typeof SECTIONS[number]>("Overview");
  const heading = useRef<HTMLHeadingElement>(null);
  const selected = PROJECTS.find(project => project.id === selectedId);
  useEffect(() => { setSection("Overview"); if (visible) heading.current?.focus({ preventScroll: true }); }, [selectedId, visible]);
  const items = PROJECTS.filter(project => filter === "All projects" || (filter === "Featured" ? FEATURED_PROJECTS.some(p=>p.id===project.id) : project.company === filter));
  const navigate = (direction: number) => {
    const index = PROJECTS.findIndex(project => project.id === selectedId);
    onSelect(PROJECTS[(index + direction + PROJECTS.length) % PROJECTS.length].id);
  };
  return <div className="projectReader">
    {!selected ? <>
      <div className="projectIndexTop"><h3 ref={heading} tabIndex={-1}>Explore the archive</h3><span>{PROJECTS.length} CASE STUDIES</span></div>
      <label className="projectFilter">Browse projects<select value={filter} onChange={event => setFilter(event.target.value)}>
        {["All projects", "Featured", ...PROJECT_COMPANIES].map(name => <option key={name}>{name}</option>)}
      </select></label>
      <div className="projectIndex">
        {PROJECT_COMPANIES.filter(company => items.some(project => project.company === company)).map(company => <section key={company} className="projectCompany">
          <h4>{company}</h4><div className="projectIndexGrid">{items.filter(project => project.company === company).map(project => <button className="projectIndexCard" key={project.id} onClick={() => onSelect(project.id)}>
            <span className="projectKind">{project.kind}</span><strong>{project.title}</strong><span>{project.summary}</span><b>VIEW CASE STUDY ↗</b>
          </button>)}</div>
        </section>)}
      </div>
    </> : <>
      <div className="projectReaderTools"><button onClick={() => onSelect("")}>← All projects</button><span>{selected.company}</span></div>
      <h3 className="projectCaseTitle" ref={heading} tabIndex={-1}>{selected.title}</h3>
      <p className="projectCaseMeta">{selected.kind} · {selected.company === "Research" ? selected.period : `Role period: ${selected.period}`}</p>
      <div className="projectSectionNav" aria-label="Case study sections">{SECTIONS.map(name => <button key={name} aria-pressed={section === name} onClick={() => setSection(name)}>{name}</button>)}</div>
      <section key={`${selected.id}-${section}`} className="projectCaseContent" aria-label={section}>
        {section === "Overview" && <><p className="projectSummary">{selected.summary}</p><p><strong>My role</strong><br/>{selected.role}</p>
          {selected.chapters && <div className="projectChapters">{selected.chapters.map(chapter => <article key={chapter.title}><h4>{chapter.title}</h4><p>{chapter.text}</p></article>)}</div>}
        </>}
        {section === "My contribution" && <ul>{selected.contributions.map((text,index) => <li key={text}><span className="noteNumber">{String(index+1).padStart(2,"0")}</span><span>{text}</span></li>)}</ul>}
        {section === "Architecture & stack" && <><p>{selected.summary}</p><div className="projectStack">{selected.stack.map(tool => <span key={tool}>{tool}</span>)}</div><p className="projectDisclaimer">Technology summary only. Internal system diagrams and infrastructure details are not published.</p></>}
        {section === "Outcomes" && <ul>{selected.outcomes.map(text => <li key={text}>{text}</li>)}</ul>}
      </section>
      <nav className="projectReaderFooter" aria-label="Other projects"><button onClick={() => navigate(-1)}>← Previous project</button><span>{PROJECTS.indexOf(selected)+1} / {PROJECTS.length}</span><button onClick={() => navigate(1)}>Next project →</button></nav>
    </>}
  </div>;
}
