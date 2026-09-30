"use client";
import { stationReveal } from "./stationReveal";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Block } from "./TechnologyDisplay";
import { Label } from "./ExperienceTimeline";
import { useNight } from "./DayNight";
import { FEATURED_PROJECTS, PROJECTS, type Project } from "./projectCatalog";

const BLUE = "#064de8", GOLD = "#ffd04b";
function openProject(id: string) { window.dispatchEvent(new CustomEvent("project-open", { detail: id })); }

function Folio({ project, index, ordinal, visibleCount, progress, compact, selected }: { project: Project; index: number; ordinal: number; visibleCount: number; progress: MutableRefObject<number>; compact: boolean; selected: string }) {
  const ref = useRef<THREE.Group>(null), lift = useRef(0);
  const night = useNight();
  useFrame((_, delta) => {
    if (!ref.current) return;
    const p = THREE.MathUtils.smootherstep(progress.current, index * .10, .76 + index * .1);
    const side = index - (visibleCount-1)/2;
    ref.current.position.set(compact ? 0 : side * THREE.MathUtils.lerp(.22, 3.85, p), THREE.MathUtils.lerp(-1.5, compact ? .35 : index === 1 ? 1 : .15, p), THREE.MathUtils.lerp(-.6 - index * .22, index === 1 ? .7 : 1.25, p));
    lift.current = THREE.MathUtils.damp(lift.current, selected === project.id ? .4 : 0, 8, Math.min(delta,.05));
    ref.current.position.z += lift.current;
    ref.current.rotation.y = side * THREE.MathUtils.lerp(.64, .055, p);
    ref.current.rotation.z = side * THREE.MathUtils.lerp(-.12, .015, p);
    ref.current.scale.setScalar(THREE.MathUtils.lerp(.62, 1, p));
  });
  return <group ref={ref} onClick={e => { e.stopPropagation(); openProject(project.id); }}
    onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
    <Block width={3.55} height={4.15} depth={.42} color={night ? "#40bdff" : BLUE}/>
    <group position={[0, 0, .23]}><Block width={3.30} height={3.90} depth={.13} color={night ? "#0a1b37" : "#f5f8ff"}/></group>
    <group position={[-1.52, 0, .34]}><Block width={.13} height={3.73} depth={.12} color={GOLD}/></group>
    <group position={[0, 1.45, .33]}><Block width={2.96} height={.65} depth={.15} color={BLUE}/><Label text={`PROJECT ${String(ordinal).padStart(2,"0")}`} color="#fff" width={2.7} height={.44} z={.09}/></group>
    <group position={[0, .61, .35]}><Label text={project.short} color={night ? "#ecf9ff" : "#15315a"} width={3.05} height={.6}/></group>
    <group position={[0, -.08, .35]}><Label text={project.company} color={night ? "#9bddff" : BLUE} width={2.8} height={.38}/></group>
    <group position={[0, -.70, .35]}><Label text={project.kind.toUpperCase()} color={night ? "#b7cde3" : "#435776"} width={2.75} height={.29}/></group>
    <group position={[0, -1.38, .37]}><Block width={2.8} height={.54} depth={.12} color={GOLD}/><Label text="OPEN CASE STUDY  +" color="#17325b" width={2.5} height={.32} z={.08}/></group>
    {[-1,1].flatMap(x => [-1,1].map(y => <mesh key={`${x}-${y}`} position={[x*1.58,y*1.88,.34]}><sphereGeometry args={[.055,8,6]}/><meshBasicMaterial color={GOLD} toneMapped={false}/></mesh>))}
    <group position={[0,-2.4,-.05]}><Block width={.36} height={.7} depth={.4} color={BLUE}/></group>
    <group position={[0,-2.8,-.05]}><Block width={2.8} height={.25} depth={1.2} color={night ? "#153b62" : "#e6edfa"}/></group>
  </group>;
}

export default function ProjectDock() {
  const root = useRef<THREE.Group>(null), progress = useRef(0), quiet = useRef(false);
  const position = useRef(new THREE.Vector3());
  const { size } = useThree(); const compact = size.width <= 850;
  const [mobileIndex, setMobileIndex] = useState(0), [selected, setSelected] = useState("");
  const night = useNight();
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { quiet.current = media.matches; }; update(); media.addEventListener("change", update);
    const select = (event: Event) => setSelected((event as CustomEvent<string>).detail);
    const close = () => setSelected("");
    addEventListener("project-open", select); addEventListener("project-close", close);
    return () => { media.removeEventListener("change", update); removeEventListener("project-open", select); removeEventListener("project-close", close); document.body.style.cursor = ""; };
  }, []);
  useFrame(({ camera }, delta) => {
    if (!root.current) return;
    root.current.getWorldPosition(position.current);
    const target = quiet.current ? 1 : stationReveal(camera.position.z - position.current.z);
    progress.current = quiet.current ? 1 : THREE.MathUtils.damp(progress.current, target, 8, Math.min(delta,.05));
  });
  const next = (direction: number) => setMobileIndex(index => (index + direction + FEATURED_PROJECTS.length) % FEATURED_PROJECTS.length);
  return <group ref={root} name="project-dock">
    <group position={[0,4.28,-.5]}><Block width={6.1} height={.95} depth={.35} color={BLUE}/><Label text="THE PROJECT DOCK" color="#fff" width={5.55} height={.67} z={.2}/></group>
    {FEATURED_PROJECTS.map((project,index) => (compact ? index === mobileIndex : Math.floor(index/3)===Math.floor(mobileIndex/3)) && <Folio key={project.id} project={project} index={compact?0:index%3} ordinal={index+1} visibleCount={compact?1:Math.min(3,FEATURED_PROJECTS.length-Math.floor(mobileIndex/3)*3)} progress={progress} compact={compact} selected={selected}/>)}
    <group position={[0,-2.55,3.55]} onClick={e => { e.stopPropagation(); openProject(""); }} onPointerOver={() => { document.body.style.cursor="pointer"; }} onPointerOut={() => { document.body.style.cursor=""; }}>
      <Block width={4.8} height={.72} depth={.28} color={night ? "#174274" : GOLD}/><Label text={`ALL ${PROJECTS.length} CASE STUDIES  +`} color={night ? "#fff" : "#17325b"} width={4.3} height={.44} z={.16}/>
    </group>
    {(compact?FEATURED_PROJECTS.length>1:FEATURED_PROJECTS.length>3) && [-1,1].map(direction => <group key={direction} position={[direction*3.4,-2.55,3.55]} onClick={e => { e.stopPropagation(); compact?next(direction):setMobileIndex(i=>((Math.floor(i/3)+direction+Math.ceil(FEATURED_PROJECTS.length/3))%Math.ceil(FEATURED_PROJECTS.length/3))*3); }}>
      <Block width={1.1} height={.72} depth={.28} color={BLUE}/><Label text={direction<0?"PREV":"NEXT"} color="#fff" width={.94} height={.33} z={.16}/>
    </group>)}
  </group>;
}
