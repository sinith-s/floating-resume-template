"use client";
import PlatformPager from "./PlatformPager";
import {pageItems,turnPage} from "./platformPagination";
import { stationReveal } from "./stationReveal";
import {useEffect,useRef,useState,type MutableRefObject} from "react";
import {useFrame} from "@react-three/fiber";
import * as THREE from "three";
import {Block} from "./TechnologyDisplay";
import {Label} from "./ExperienceTimeline";
import {useNight} from "./DayNight";
import {SKILL_AREAS,type SkillArea} from "./skillsCatalog";

function SkillNode({area,index,reveal}:{area:SkillArea;index:number;reveal:MutableRefObject<number>}){
  const ref=useRef<THREE.Group>(null), arm=useRef<THREE.Mesh>(null);const night=useNight();
  const angle=index*Math.PI/4, x=Math.sin(angle)*4.45,y=Math.cos(angle)*2.95;
  useFrame(()=>{if(!ref.current||!arm.current)return;const p=THREE.MathUtils.smootherstep(reveal.current,index*.025,.78+index*.025);const spread=.12+.88*p;
    ref.current.position.set(x*spread,.8+y*spread,.55+Math.abs(Math.sin(angle))*.38);ref.current.scale.setScalar(.3+.7*p);ref.current.rotation.y=-Math.sin(angle)*.08*(1-p);
    const length=Math.hypot(x,y)*spread;arm.current.position.set(x*spread/2,.8+y*spread/2,-.12);arm.current.rotation.z=-Math.atan2(x,y);arm.current.scale.y=length;
  });
  return <>
    <mesh ref={arm} raycast={()=>{}}><boxGeometry args={[.045,1,.065]}/><meshBasicMaterial color={night?"#298bb0":"#94afd7"} toneMapped={false}/></mesh>
    <group ref={ref} onClick={event=>{event.stopPropagation();window.dispatchEvent(new CustomEvent("skill-open",{detail:area.id}))}} onPointerOver={()=>{document.body.style.cursor="pointer"}} onPointerOut={()=>{document.body.style.cursor=""}}>
      <Block width={2.6} height={1.23} depth={.3} color={night?"#42ccff":"#064de8"}/>
      <group position={[0,0,.18]}><Block width={2.4} height={1.05} depth={.1} color={night?"#0a1d39":"#f5f8ff"}/></group>
      <group position={[0,.13,.25]}><Label text={area.short} color={night?"#e0f7ff":"#183e72"} width={2.16} height={.38}/></group>
      <group position={[0,-.28,.26]}><Label text={"EXPLORE SKILLS  +"} color={night?"#f5d475":"#0755ed"} width={1.96} height={.20}/></group>
      {[-1,1].map(side=><group key={side} position={[side*1.23,0,.21]}><Block width={.11} height={.64} depth={.12} color="#ffd04b"/></group>)}
    </group>
  </>;
}

export default function SkillsCompass(){
  const [page,setPage]=useState(0);
  const root=useRef<THREE.Group>(null),reveal=useRef(0),quiet=useRef(false),world=useRef(new THREE.Vector3());const night=useNight();
  useEffect(()=>{const media=matchMedia("(prefers-reduced-motion: reduce)");const update=()=>{quiet.current=media.matches};update();media.addEventListener("change",update);return()=>{media.removeEventListener("change",update);document.body.style.cursor=""}},[]);
  useFrame(({camera},delta)=>{if(!root.current)return;root.current.getWorldPosition(world.current);const target=quiet.current?1:stationReveal(camera.position.z-world.current.z);reveal.current=quiet.current?1:THREE.MathUtils.damp(reveal.current,target,8,Math.min(delta,.05))});
  return <group ref={root} name="capability-compass">
    <PlatformPager page={page} total={SKILL_AREAS.length} size={8} onChange={d=>setPage(p=>turnPage(p,d,SKILL_AREAS.length,8))}/>
    <group position={[0,5,-.4]}><Block width={6.4} height={.75} depth={.3} color="#064de8"/><Label text="CAPABILITY COMPASS" color="#fff" width={5.95} height={.49} z={.17}/></group>
    <group position={[0,-1.55,-.4]}><Block width={.32} height={3} depth={.4} color={night?"#18567d":"#0755ed"}/></group>
    <group position={[0,-3,-.4]}><Block width={3} height={.18} depth={1.5} color={night?"#194169":"#dce8f9"}/></group>
    {pageItems(SKILL_AREAS,page,8).map((area,index)=><SkillNode key={area.id} area={area} index={index} reveal={reveal}/>)}
    <group position={[0,.8,.25]} onClick={event=>{event.stopPropagation();window.dispatchEvent(new CustomEvent("skill-open",{detail:pageItems(SKILL_AREAS,page,8)[0]?.id}))}}>
      <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[1.1,1.1,.35,8]}/><meshBasicMaterial color={night?"#258cc1":"#064de8"} toneMapped={false}/></mesh>
      <mesh position={[0,0,.2]}><torusGeometry args={[.95,.045,6,48]}/><meshBasicMaterial color="#ffd04b" toneMapped={false}/></mesh>
      <Label text="SKILLS" color="#fff" width={1.64} height={.5} z={.23}/>
    </group>
  </group>;
}
