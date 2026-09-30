"use client";
import resume from "./profile";
import PlatformPager from "./PlatformPager";
import {Label,Plate} from "./ExperienceTimeline";
import {pageItems,turnPage} from "./platformPagination";
import { stationReveal } from "./stationReveal";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useNight } from "./DayNight";
import { badgeAltitude, badgeDepth, badgeLift, type BadgeLayoutRef } from "./badgeLayout";

const BADGES = resume.certifications;

// Trace the supplied artwork, rather than inventing replacement logo geometry.
// White connected to the outside is background; enclosed white lettering stays.
function badgeGeometry(image: CanvasImageSource) {
  const n=128,canvas=document.createElement("canvas");canvas.width=canvas.height=n;
  const ctx=canvas.getContext("2d")!;ctx.drawImage(image,0,0,n,n);
  const pixels=ctx.getImageData(0,0,n,n).data;
  const exterior=new Uint8Array(n*n),queue:number[]=[];
  const background=(i:number)=>pixels[i*4+3]<100||(pixels[i*4]>246&&pixels[i*4+1]>246&&pixels[i*4+2]>246);
  const enqueue=(i:number)=>{if(!exterior[i]&&background(i)){exterior[i]=1;queue.push(i)}};
  for(let i=0;i<n;i++){enqueue(i);enqueue((n-1)*n+i);enqueue(i*n);enqueue(i*n+n-1)}
  for(let q=0;q<queue.length;q++){const i=queue[q],x=i%n,y=Math.floor(i/n);if(x)enqueue(i-1);if(x<n-1)enqueue(i+1);if(y)enqueue(i-n);if(y<n-1)enqueue(i+n)}
  const solid=(x:number,y:number)=>x>=0&&y>=0&&x<n&&y<n&&!exterior[y*n+x]&&pixels[(y*n+x)*4+3]>=100;
  const edges=new Map<number,number[]>(),stride=n+1;
  const edge=(x:number,y:number,a:number,b:number)=>{const key=y*stride+x;edges.set(key,[...(edges.get(key)||[]),b*stride+a])};
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(solid(x,y)){
    if(!solid(x,y-1))edge(x,y,x+1,y);
    if(!solid(x+1,y))edge(x+1,y,x+1,y+1);
    if(!solid(x,y+1))edge(x+1,y+1,x,y+1);
    if(!solid(x-1,y))edge(x,y+1,x,y);
  }
  const loops:THREE.Vector2[][]=[];
  while(edges.size){const start=edges.keys().next().value as number;let at=start;const points:THREE.Vector2[]=[];
    do{points.push(new THREE.Vector2((at%stride)/n-.5,.5-Math.floor(at/stride)/n));const next=edges.get(at);if(!next?.length)break;const dest=next.pop()!;if(!next.length)edges.delete(at);at=dest}while(at!==start&&points.length<n*n*4);
    if(points.length>3)loops.push(points);
  }
  loops.sort((a,b)=>Math.abs(THREE.ShapeUtils.area(b))-Math.abs(THREE.ShapeUtils.area(a)));
  const shape=new THREE.Shape(loops[0]);
  for(const loop of loops.slice(1))if(Math.sign(THREE.ShapeUtils.area(loop))!==Math.sign(THREE.ShapeUtils.area(loops[0])))shape.holes.push(new THREE.Path(loop));
  return new THREE.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:false,steps:1,curveSegments:1,
    UVGenerator:{generateTopUV:(_,v,a,b,c)=>[a,b,c].map(i=>new THREE.Vector2(v[i*3]+.5,v[i*3+1]+.5)),
      generateSideWallUV:()=>[new THREE.Vector2(0,0),new THREE.Vector2(1,0),new THREE.Vector2(1,1),new THREE.Vector2(0,1)]}});
}

function Artwork({file,color,night,hovered}:{file:string;color:string;night:boolean;hovered:boolean}){
  const source=useLoader(THREE.TextureLoader,file);
  const geometry=useMemo(()=>badgeGeometry(source.image),[source]);
  const texture=useMemo(()=>{const t=source.clone();t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.needsUpdate=true;return t},[source]);
  useEffect(()=>()=>{geometry.dispose();texture.dispose()},[geometry,texture]);
  return <mesh geometry={geometry}>
    <meshBasicMaterial attach="material-0" map={texture} transparent alphaTest={.35} toneMapped={false} userData={{steadyBoardText:true}}/>
    <meshStandardMaterial attach="material-1" color={color} metalness={.45} roughness={.3} emissive={color} emissiveIntensity={night?.85:hovered?.3:.06}/>
  </mesh>;
}
function Badge({index,badge,layout}:{index:number;badge:typeof BADGES[number];layout:BadgeLayoutRef}){
  const group=useRef<THREE.Group>(null),quiet=useRef(false);
  const [hovered,setHovered]=useState(false);const night=useNight();
  useEffect(()=>{const media=matchMedia("(prefers-reduced-motion: reduce)");const update=()=>{quiet.current=media.matches};update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update)},[]);
  useFrame(({clock},delta)=>{if(!group.current)return;const t=quiet.current?0:clock.elapsedTime;
    group.current.position.x=(index%2===0?-1:1)*layout.current.spread;
    group.current.position.y=badgeAltitude(index,layout.current)+badgeLift(index,t,layout.current);
    group.current.position.z=badgeDepth(index,layout.current);
    group.current.rotation.y=Math.sin(t*.36+index)*.075*layout.current.reveal;
    const size=THREE.MathUtils.damp(group.current.scale.x,layout.current.size*(hovered?1.06:1),12,Math.min(delta,.05));group.current.scale.setScalar(size);
  });
  return <group ref={group} name={badge.name} position={[(index%2===0?-1:1)*layout.current.spread,badgeAltitude(index,layout.current),badgeDepth(index,layout.current)]} scale={layout.current.size}>
    <group onPointerOver={e=>{e.stopPropagation();setHovered(true)}} onPointerOut={()=>setHovered(false)}
      onClick={e=>{e.stopPropagation();dispatchEvent(new CustomEvent("station-notes",{detail:4}))}}>
      {badge.file?<Artwork file={badge.file} color={badge.color} night={night} hovered={hovered}/>:<>
        <Plate width={1} height={.8} color={night?"#102448":"#f5f8fd"}/>
        <Label text={badge.name} color={night?"#bfefff":"#17488c"} width={.85} height={.55} z={.13}/>
      </>}
    </group>
  </group>;
}

export default function CertificationBadges(){
  const [page,setPage]=useState(0);
  const group=useRef<THREE.Group>(null);
  const layout=useRef({spread:0,size:1.25,top:1.5,bottom:1.5,reveal:0});
  const world=useMemo(()=>new THREE.Vector3(),[]);
  const expansion=useRef(0);
  useFrame(({camera},delta)=>{
    if(!group.current)return;
    group.current.getWorldPosition(world);
    // Depth, not pointer position or elapsed time, controls this reversible reveal.
    const depth=camera.position.z-world.z;
    const target=stationReveal(depth);
    expansion.current=THREE.MathUtils.damp(expansion.current,target,8,Math.min(delta,.05));
    const p=expansion.current;
    layout.current.reveal=p;
    layout.current.spread=THREE.MathUtils.lerp(0,3.55,p);
    layout.current.size=THREE.MathUtils.lerp(1.25,4.3,p);
    layout.current.top=THREE.MathUtils.lerp(1.5,4.5,p);
    layout.current.bottom=THREE.MathUtils.lerp(1.5,-.3,p);
  },-.5);
  return <group ref={group} name="Floating certification badges">{pageItems(BADGES,page,4).map((badge,index)=><Badge key={`${page}-${index}`} index={index} badge={badge} layout={layout}/>)}<PlatformPager page={page} total={BADGES.length} size={4} onChange={d=>setPage(p=>turnPage(p,d,BADGES.length,4))}/></group>;
}
