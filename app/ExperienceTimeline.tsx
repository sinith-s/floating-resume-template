"use client";

import resume from "./profile";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { useNight } from "./DayNight";
import PlatformPager from "./PlatformPager";
import {pageItems,turnPage} from "./platformPagination";
import { stationReveal } from "./stationReveal";

const BLUE = "#0755ed", GOLD = "#f4cf60";
const ROLE_LAYOUT: {position:[number,number,number];width:number}[] = [
{position:[0,-1.25,3.8],width:4.9},{position:[3.95,.5,3.6],width:3.65},
{position:[-4.05,.05,3.6],width:3.15},{position:[-3.35,2.9,3.6],width:3.8},
{position:[3.6,3.35,3.6],width:2.9}];
const ROLES = resume.experience.map((role,index)=>({...role,...ROLE_LAYOUT[index%5]}));

function makeLabel(text: string, color: string, aspect: number, background?: string, subtitle?: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200; canvas.height = Math.round(1200 / aspect);
  const c = canvas.getContext("2d")!;
  const h = canvas.height;
  if (background) { c.fillStyle = background; c.fillRect(0, 0, 1200, h); }
  c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = color;
  c.font = `800 ${Math.min(500, h * (subtitle ? .27 : .58))}px Arial, sans-serif`;
  c.fillText(text, 600, subtitle ? h * .39 : h / 2, 1080);
  if (subtitle) {
    c.fillStyle = GOLD; c.fillRect(470, h * .63, 260, h * .025);
    c.fillStyle = color; c.font = `600 ${h * .12}px Arial, sans-serif`;
    c.fillText(subtitle, 600, h * .82);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  return texture;
}

export function Label({ text, color, background, subtitle, width, height, z = 0 }: {
  text: string; color: string; background?: string; subtitle?: string; width: number; height: number; z?: number;
}) {
  const texture = useMemo(() => makeLabel(text, color, width / height, background, subtitle), [text, color, width, height, background, subtitle]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[0, 0, z]}>
    <planeGeometry args={[width, height]} />
    <meshBasicMaterial map={texture} transparent alphaTest={.015} toneMapped={false} userData={{ steadyBoardText: true }} />
  </mesh>;
}

export function Plate({ width, height, color }: { width: number; height: number; color: string }) {
  const geometry = useMemo(() => new RoundedBoxGeometry(width, height, .18, 2, .06), [width, height]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 35), [geometry]);
  useEffect(() => () => { geometry.dispose(); edges.dispose(); }, [geometry, edges]);
  return <group>
    <mesh geometry={geometry}><meshStandardMaterial color={color} roughness={.34} metalness={.2} /></mesh>
    <lineSegments geometry={edges}><lineBasicMaterial color="#243955" /></lineSegments>
    {[-1, 1].flatMap(x => [-1, 1].map(y => <mesh key={`${x}:${y}`} position={[x * (width / 2 - .14), y * (height / 2 - .14), .11]}>
      <sphereGeometry args={[.062, 8, 6]} /><meshStandardMaterial color={GOLD} metalness={.6} roughness={.25} />
    </mesh>))}
  </group>;
}

function RoleCard({ role, index }: { role: typeof ROLES[number]; index: number }) {
  const night = useNight();
  const open = () => window.dispatchEvent(new CustomEvent("station-notes", { detail: 2 }));
  useEffect(() => () => { document.body.style.cursor = ""; }, []);
  return <group position={[...role.position]} onClick={event => { event.stopPropagation(); open(); }}
    onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
    <Plate width={role.width + .13} height={1.83} color={night ? "#23bfff" : BLUE} />
    <group position={[0, 0, .105]}>
      <Plate width={role.width} height={1.7} color={night ? "#0b1b36" : "#fafbf8"} />
      <Label text={role.name} subtitle={role.dates} color={night ? "#eefaff" : "#263448"} width={role.width - .25} height={1.43} z={.1} />
    </group>
    <group position={[0, 1.02, .3]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.44, .44, .14, 32]} /><meshStandardMaterial color={index === 0 ? GOLD : BLUE} metalness={.4} roughness={.25} /></mesh>
      <mesh position={[0, 0, .08]}><circleGeometry args={[.35, 32]} /><meshBasicMaterial color={night ? "#102647" : "#fffbed"} /></mesh>
      <Label text={String(index + 1).padStart(2, "0")} color={night ? "#a8eaff" : "#0755b9"} width={.57} height={.64} z={.09} />
    </group>
  </group>;
}

function spiralPoint(t: number, radius = 5.35) {
  const angle = t * Math.PI * 5.3 + Math.PI / 2;
  return new THREE.Vector3(Math.cos(angle) * radius, -2.35 + t * 6.65, Math.sin(angle) * radius * .64);
}

function SpiralTracks() {
  const night = useNight();
  const nodes = useRef<THREE.Group>(null);
  const world = useRef(new THREE.Vector3());
  const travel = useRef(0);
  const reveal = useRef(0);
  const reducedMotion = useRef(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reducedMotion.current = media.matches; };
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const geometry = useMemo(() => {
    const path = new THREE.CatmullRomCurve3(Array.from({ length: 181 }, (_, i) => spiralPoint(i / 180)));
    const innerPath = new THREE.CatmullRomCurve3(Array.from({ length: 181 }, (_, i) => spiralPoint(i / 180, 5.12)));
    const lightPath = new THREE.CatmullRomCurve3(Array.from({ length: 181 }, (_, i) => spiralPoint(i / 180, 4.65).add(new THREE.Vector3(0, .3, 0))));
    return [new THREE.TubeGeometry(path, 240, .055, 6, false), new THREE.TubeGeometry(innerPath, 240, .026, 5, false), new THREE.TubeGeometry(lightPath, 240, .022, 5, false)];
  }, []);
  useEffect(() => () => geometry.forEach(item => item.dispose()), [geometry]);
  useFrame(({ camera }, delta) => {
    if (!nodes.current) return;
    nodes.current.getWorldPosition(world.current);
    const target = reducedMotion.current ? 1 : stationReveal(camera.position.z - world.current.z);
    reveal.current = THREE.MathUtils.damp(reveal.current, target, 8, Math.min(delta, .05));
    if (!reducedMotion.current) travel.current += Math.min(delta, .05) * .035 * reveal.current;
    nodes.current.visible = reveal.current > .01;
    nodes.current?.children.forEach((node, i) => {
      const t = (i / 5 + travel.current) % 1;
      node.position.copy(spiralPoint(t, 4.65)).y += .3;
      node.scale.setScalar(reveal.current);
    });
  });
  return <group>
    <mesh geometry={geometry[0]}><meshBasicMaterial color={night ? "#50ccff" : "#6baeff"} /></mesh>
    <mesh geometry={geometry[1]}><meshBasicMaterial color={night ? "#d2f8ff" : "#e1f5ff"} /></mesh>
    <mesh geometry={geometry[2]}><meshBasicMaterial color={night ? "#ffdb74" : "#efc954"} /></mesh>
    <group ref={nodes}>{Array.from({ length: 5 }, (_, i) => <group key={i}>
      <mesh><sphereGeometry args={[.095, 10, 8]} /><meshBasicMaterial color="#fff4bc" /></mesh>
      <mesh userData={{ baseOpacity: .15 }}><sphereGeometry args={[.22, 10, 8]} /><meshBasicMaterial color={GOLD} transparent opacity={.15} depthWrite={false} /></mesh>
    </group>)}</group>
  </group>;
}

export default function ExperienceTimeline() {
  const [page,setPage]=useState(0);
  const night = useNight();
  return <group name="Experience spiral timeline">
    <mesh position={[0, .65, -.5]}><cylinderGeometry args={[.43, .53, 7.5, 24]} /><meshStandardMaterial color={night ? "#072966" : "#064fc4"} metalness={.6} roughness={.24} emissive={BLUE} emissiveIntensity={night ? .4 : .05} /></mesh>
    {[-.32, .32].map(x => <mesh key={x} position={[x, .65, -.15]}><boxGeometry args={[.034, 7.4, .035]} /><meshBasicMaterial color={night ? "#66e2ff" : "#8ccfff"} /></mesh>)}
    <mesh position={[0, -2.78, 0]}><cylinderGeometry args={[3.62, 3.62, .43, 80]} /><meshStandardMaterial color={BLUE} roughness={.3} metalness={.45} /></mesh>
    <mesh position={[0, -2.43, 0]}><cylinderGeometry args={[3.76, 3.76, .49, 80, 1, true]} /><meshStandardMaterial color={GOLD} side={THREE.DoubleSide} roughness={.32} metalness={.3} emissive={GOLD} emissiveIntensity={night ? .2 : 0} /></mesh>
    <group position={[0, -2.45, 3.8]}><Label text={resume.experienceSummary} color={night ? "#fff1bd" : "#283448"} background={night ? "#493914" : GOLD} width={6.05} height={.44} /></group>
    <SpiralTracks />
    <group position={[0, 5.35, 0]}>
      <Plate width={6.7} height={1.55} color={night ? "#073373" : "#064bbf"} />
      <Label text="EXPERIENCE" color="#ffffff" width={6.15} height={1.2} z={.1} />
    </group>
    {pageItems(ROLES,page,5).map((role, index) => <RoleCard key={`${page}-${index}`} role={role} index={page*5+index} />)}
    <PlatformPager page={page} total={ROLES.length} size={5} onChange={d=>setPage(p=>turnPage(p,d,ROLES.length,5))} y={-3.25}/>
  </group>;
}
