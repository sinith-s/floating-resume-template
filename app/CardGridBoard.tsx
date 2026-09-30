"use client";

import resume from "./profile";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Station } from "./FlightExperience";
import { useNight } from "./DayNight";

const BLUE="#0755ed", GOLD="#f4cf60", WHITE="#f7f7f3", INK="#28313e";

const BOARD_COPY = resume.boardCopy;

function textLines(c:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lineHeight:number,limit:number) {
  let line="",row=0;
  for(const word of text.split(" ")){
    if(c.measureText(line+word).width>width&&line){
      c.fillText(line.trim(),x,y+row*lineHeight);
      if(++row>=limit)return;
      line="";
    }
    line+=word+" ";
  }
  if(row<limit)c.fillText(line.trim(),x,y+row*lineHeight);
}

function cardTexture(kind:string,s:Station,index:number,night:boolean){
  const canvas=document.createElement("canvas");
  canvas.width=kind==="main"?1200:900;canvas.height=kind==="main"?700:kind==="summary"?700:320;
  const c=canvas.getContext("2d")!,w=canvas.width,h=canvas.height;
  const ink=night?"#f2f7ff":INK,accent=night?"#b5eaff":"#174aa4";
  c.fillStyle=night?"#0a1426":kind==="header"||kind==="action"?"#1249ad":kind==="note"?GOLD:WHITE;c.fillRect(0,0,w,h);
  c.fillStyle=ink;
  if(kind==="header"||kind==="action"){
    c.fillStyle="#ffffff";c.font="bold 88px Arial, sans-serif";c.textAlign="center";c.textBaseline="middle";
    const label=kind==="header"?(index===2?"EXPERIENCE":s.nav.toUpperCase()):"VIEW DETAILS  →";
    c.fillText(label,w/2,h/2,w-110);
  }else if(kind==="main"){
    const copy=BOARD_COPY[index];
    c.font="bold 76px Arial, sans-serif";c.fillText(copy.title,65,125,w-130);
    c.fillStyle=accent;c.font="bold 48px Arial, sans-serif";c.fillText(copy.summary,65,220,w-130);
    c.fillStyle=ink;c.font="bold 60px Arial, sans-serif";
    copy.highlights.forEach((text,i)=>c.fillText(text,65,350+i*110,w-130));
  }else if(kind==="summary"){
    c.strokeStyle=accent;c.lineWidth=15;c.lineJoin="round";c.beginPath();c.moveTo(205,215);c.bezierCurveTo(90,215,100,105,175,105);c.bezierCurveTo(182,20,330,20,343,105);c.bezierCurveTo(440,92,460,215,367,215);c.closePath();c.stroke();
    c.fillStyle=accent;c.font="bold 58px Arial";c.fillText(s.tags[0],90,360,720);
    c.fillStyle=ink;c.font="bold 58px Arial, sans-serif";textLines(c,s.tags.slice(1).join(" · "),90,465,700,64,3);
  }else if(kind==="metric"){
    c.fillStyle=accent;[80,140,205].forEach((height,i)=>c.fillRect(90+i*90,260-height,55,height));
    c.font="bold 56px Arial";c.fillText(String(s.list.length).padStart(2,"0"),440,140);
    c.fillStyle=ink;c.font="bold 54px Arial, sans-serif";c.fillText("HIGHLIGHTS",440,215,380);
  }else{
    c.strokeStyle=ink;c.lineWidth=9;c.strokeRect(65,60,115,180);c.beginPath();c.moveTo(85,112);c.lineTo(150,112);c.moveTo(85,150);c.lineTo(150,150);c.moveTo(85,188);c.lineTo(130,188);c.stroke();
    c.fillStyle=ink;c.font="bold 60px Arial, sans-serif";textLines(c,s.tags.slice(0,2).join(" · "),230,130,595,64,2);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  return texture;
}

function Part({position,size,color,map}:{position:[number,number,number];size:[number,number,number];color:string;map?:THREE.Texture}){
  const geometry=useMemo(()=>new RoundedBoxGeometry(...size,2,Math.min(.035,size[2]/5)),[size[0],size[1],size[2]]);
  const edges=useMemo(()=>new THREE.EdgesGeometry(geometry,35),[geometry]);
  useEffect(()=>()=>{geometry.dispose();edges.dispose()},[geometry,edges]);
  return <group position={position}>
    <mesh geometry={geometry}><meshBasicMaterial color={color}/></mesh>
    <lineSegments geometry={edges} userData={{baseOpacity:.65}}><lineBasicMaterial color={INK} transparent opacity={.65}/></lineSegments>
    {map&&<mesh position={[0,0,size[2]/2+.003]}><planeGeometry args={[size[0]-.07,size[1]-.07]}/><meshBasicMaterial map={map} userData={{steadyBoardText:true}} toneMapped={false}/></mesh>}
  </group>;
}

function Bolts({width,height,z}:{width:number;height:number;z:number}){
  return <group>{[-1,1].flatMap(x=>[-1,1].map(y=><group key={x+":"+y} position={[x*(width/2-.17),y*(height/2-.17),z]}>
    <mesh><circleGeometry args={[.072,12]}/><meshBasicMaterial color="#333d46"/></mesh>
    <mesh position={[0,0,.006]}><circleGeometry args={[.044,12]}/><meshBasicMaterial color="#d6d8d4"/></mesh>
  </group>))}</group>;
}

export default function CardGridBoard({station,index}:{station:Station;index:number}){
  const night=useNight();
  const cards=useMemo(()=>[
    {kind:"header",x:0,y:4.28,w:7.35,h:1.5,color:BLUE},
    {kind:"main",x:-1.32,y:1.44,w:6.3,h:3.9,color:WHITE},
    {kind:"summary",x:3.37,y:2.35,w:2.7,h:2.07,color:WHITE},
    {kind:"metric",x:3.37,y:.27,w:2.7,h:1.4,color:WHITE},
    {kind:"note",x:-2.43,y:-1.57,w:4,h:1.43,color:GOLD},
    {kind:"action",x:2.38,y:-1.57,w:4.3,h:1.43,color:BLUE},
  ].map(card=>({...card,texture:cardTexture(card.kind,station,index,night)})),[station,index,night]);
  useEffect(()=>()=>cards.forEach(card=>card.texture.dispose()),[cards]);
  return <group name={station.nav+" open-frame card display"}>
    {[-5.18,5.18].map(x=><group key={x}>
      <Part position={[x,1,0]} size={[.48,7.8,.5]} color={WHITE}/>
      <Part position={[x,-2.83,0]} size={[1.65,.5,1.18]} color={WHITE}/>
      <Part position={[x,-2.47,0]} size={[.73,.34,.76]} color="#e1e4e5"/>
      <Part position={[x-Math.sign(x)*.29,1.15,-.02]} size={[.16,7.35,.2]} color={BLUE}/>
      {[4.53,-2.38].map(y=><Part key={y} position={[x-Math.sign(x)*.16,y,.30]} size={[.44,.87,.19]} color={GOLD}/>)}
      {[-.68,.68].map(offset=><Part key={offset} position={[x+offset,-2.81,.04]} size={[.16,.49,1.2]} color={GOLD}/>)}
    </group>)}
    {[4.27,2.6,.04,-1.56].map(y=><Part key={y} position={[0,y,-.02]} size={[10.38,.19,.23]} color={BLUE}/>)}
    <Part position={[1.8,1.05,-.07]} size={[.15,5.55,.19]} color={BLUE}/>
    {cards.map(card=><group key={card.kind} position={[card.x,card.y,.31]}
      onClick={card.kind==="action"?(event)=>{event.stopPropagation();window.dispatchEvent(new CustomEvent("station-notes",{detail:index}))}:undefined}
      onPointerOver={card.kind==="action"?()=>{document.body.style.cursor="pointer"}:undefined}
      onPointerOut={card.kind==="action"?()=>{document.body.style.cursor=""}:undefined}>
      <Part position={[0,0,0]} size={[card.w,card.h,.19]} color={card.color} map={card.texture}/>
      <Bolts width={card.w} height={card.h} z={.105}/>
      {[-1,1].map(side=><group key={side} position={[side*(card.w/2-.24),0,-.16]}>
        <Part position={[0,0,0]} size={[.24,Math.min(.82,card.h-.15),.1]} color="#bec5c8"/>
        <mesh position={[0,0,-.06]} rotation={[0,Math.PI,0]}><circleGeometry args={[.05,12]}/><meshBasicMaterial color={INK}/></mesh>
      </group>)}
    </group>)}
  </group>;
}
