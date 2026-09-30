"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useNight } from "./DayNight";
import PlatformEngraving from "./PlatformEngraving";

// Dimensions calibrated to the sheet: 14.4-unit deck, eight fittings,
// long pointed underside. All six supplied paintings stay in one texture.
function buildRock() {
  const segments=96,rings=30,points:number[]=[],indices:number[]=[];
  const profile=[[0,6.88],[.12,6.45],[.28,5.55],[.46,4.25],[.64,2.9],[.82,1.55],[.96,.44],[1,.025]];
  for(let ring=0;ring<=rings;ring++) {
    const t=ring/rings;
    const band=profile.findIndex((p,i)=>i>0&&t<=p[0]);
    const a=profile[Math.max(0,band-1)],b=profile[Math.max(1,band)];
    const base=THREE.MathUtils.lerp(a[1],b[1],(t-a[0])/(b[0]-a[0]));
    for(let i=0;i<segments;i++){
      const angle=i/segments*Math.PI*2;
      const ridge=(Math.cos(angle*16+t*1.4)*.29+Math.cos(angle*9-.4)*.12)*Math.sin(t*Math.PI);
      const chip=Math.sin(i*17.13+ring*11.7)*.085*Math.sin(t*Math.PI);
      const r=Math.max(.025,base+ridge+chip);
      // Uneven longitudinal flutes form the reference's descending rock blades.
      const drop=Math.pow((Math.sin(angle*13+.4)+1)*.5,5)*.48*Math.sin(t*Math.PI);
      points.push(Math.cos(angle)*r,-.5-t*8.95-drop,Math.sin(angle)*r);
    }
  }
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
    const a=j*segments+i,b=j*segments+(i+1)%segments;
    indices.push(a,b,a+segments,b,b+segments,a+segments);
  }
  const indexed=new THREE.BufferGeometry();
  indexed.setAttribute("position",new THREE.Float32BufferAttribute(points,3));indexed.setIndex(indices);
  const geometry=indexed.toNonIndexed();indexed.dispose();geometry.computeVertexNormals();
  return geometry;
}

function referenceMaterial(atlas:THREE.Texture,view:"rock"|"top"|"rim") {
  const material=new THREE.MeshBasicMaterial({color:"#ffffff",toneMapped:false});
  material.onBeforeCompile=shader=>{
    shader.uniforms.referenceAtlas={value:atlas};
    shader.uniforms.referencePart={value:view==="top"?1:view==="rim"?2:0};
    shader.vertexShader="varying vec3 vReferencePosition;\nvarying vec3 vReferenceNormal;\n"+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nvReferencePosition = position;\nvReferenceNormal = normal;");
    shader.fragmentShader=`
      uniform sampler2D referenceAtlas;
      uniform int referencePart;
      varying vec3 vReferencePosition;
      varying vec3 vReferenceNormal;
      vec3 sourcePixel(vec2 pixel) {
        return texture2D(referenceAtlas,vec2(pixel.x/1536.0,1.0-pixel.y/1024.0)).rgb;
      }
      vec3 elevation(vec3 p, int view) {
        vec2 pixel;
        if(view==0) pixel=vec2(259.0+p.x*32.45,110.0-p.y*32.0+p.z*2.6);
        else if(view==1) pixel=vec2(767.0-p.x*32.45,110.0-p.y*32.0-p.z*2.6);
        else if(view==2) pixel=vec2(1277.0+p.z*32.45,110.0-p.y*32.0-p.x*2.6);
        else pixel=vec2(259.0-p.z*32.45,591.0-p.y*32.0+p.x*2.6);
        return sourcePixel(pixel);
      }
    `+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace("#include <color_fragment>",`
      vec3 p=vReferencePosition;
      vec3 n=normalize(vReferenceNormal);
      vec3 painted;
      if(referencePart==1) {
        painted=sourcePixel(vec2(767.0+p.x*28.5,704.0+p.z*28.5));
      } else {
        vec2 heading=normalize(p.xz+vec2(.00001));
        float blend=pow(abs(heading.x),8.0)/(pow(abs(heading.x),8.0)+pow(abs(heading.y),8.0));
        vec3 frontBack=elevation(p,p.z>=0.0?0:1);
        vec3 leftRight=elevation(p,p.x<0.0?2:3);
        painted=mix(frontBack,leftRight,blend);
        if(referencePart==0) {
          vec3 below=sourcePixel(vec2(1277.0+p.x*30.0,718.0-p.z*30.0));
          float underside=smoothstep(.72,.96,-n.y);
          painted=mix(painted,below,underside*.72);
        }
      }
      diffuseColor.rgb *= painted;
    `);
  };
  material.customProgramCacheKey=()=>"six-view-island-"+view;
  return material;
}

export default function MangaPlatform({label}:{label?:string}={}){
  const night=useNight();
  const group=useRef<THREE.Group>(null),quiet=useRef(false);
  const source=useLoader(THREE.TextureLoader,"/platform-six-views.png");
  const resources=useMemo(()=>{
    const atlas=source.clone();atlas.colorSpace=THREE.SRGBColorSpace;atlas.anisotropy=8;atlas.needsUpdate=true;
    const rock=buildRock(),paint=referenceMaterial(atlas,"rock"),top=referenceMaterial(atlas,"top"),rim=referenceMaterial(atlas,"rim");
    const deck=new THREE.CircleGeometry(7.2,128).rotateX(-Math.PI/2);
    const edge=new THREE.EdgesGeometry(rock,65);
    const vines=Array.from({length:14},(_,i)=>{
      const a=i*2.399,x=Math.cos(a)*6.65,z=Math.sin(a)*6.65,length=1.1+(i%4)*.43;
      const points=Array.from({length:9},(_,j)=>new THREE.Vector3(x+Math.sin(j*1.2+i)*.095,-.52-j/8*length,z+Math.cos(j+i)*.095));
      return{points,tube:new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.018,4,false)};
    });
    return{atlas,rock,paint,top,rim,edge,vines,deck};
  },[source]);
  useEffect(()=>{
    const media=matchMedia("(prefers-reduced-motion: reduce)"),update=()=>{quiet.current=media.matches};
    update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update);
  },[]);
  useEffect(()=>()=>{resources.atlas.dispose();resources.rock.dispose();resources.deck.dispose();resources.edge.dispose();resources.paint.dispose();resources.top.dispose();resources.rim.dispose();resources.vines.forEach(v=>v.tube.dispose())},[resources]);
  useFrame(({clock})=>{
    if(!group.current)return;
    group.current.rotation.y=quiet.current?0:Math.sin(clock.elapsedTime*.12)*.055;
    group.current.rotation.x=.055+(quiet.current?0:Math.sin(clock.elapsedTime*.1)*.008);
  });
  return <group ref={group} name="Six-view reconstructed manga island" position={[0,-3.25,0]}>
    {night&&[.04,.13,.28].map((thickness,i)=><mesh key={thickness} position={[0,-.22,0]} rotation={[Math.PI/2,0,0]} userData={{baseOpacity:[1,.22,.07][i]}}>
      <torusGeometry args={[7.2,thickness,8,96]}/>
      <meshBasicMaterial color="#35cfff" transparent opacity={[1,.22,.07][i]} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}/>
    </mesh>)}
    <mesh material={resources.top} geometry={resources.deck} position={[0,.18,0]}/>
    {label&&<PlatformEngraving label={label}/>}
    <mesh><cylinderGeometry args={[7.2,7.18,.32,128,1,true]}/><meshBasicMaterial color="#e9edf3"/></mesh>
    <mesh position={[0,-.235,0]}><cylinderGeometry args={[7.18,7.17,.17,128,1,true]}/><meshBasicMaterial color="#065ad9"/></mesh>
    <mesh position={[0,-.385,0]}><cylinderGeometry args={[7.18,7.06,.13,128]}/><meshBasicMaterial color="#f1f1ed"/></mesh>
    {[7.2,6.82].map((r,i)=><mesh key={r} position={[0,.186,0]} rotation={[Math.PI/2,0,0]}>
      <torusGeometry args={[r,i===0?.016:.01,4,128]}/><meshBasicMaterial color="#5b5e65"/>
    </mesh>)}
    {Array.from({length:8},(_,i)=>{
      const a=i*Math.PI/4;return <group key={i} position={[Math.sin(a)*7.12,-.115,Math.cos(a)*7.12]} rotation={[0,a,0]}>
        <mesh><boxGeometry args={[.30,.62,.24]}/><meshBasicMaterial color="#b29539"/></mesh>
        <mesh position={[0,.012,.015]}><boxGeometry args={[.235,.58,.25]}/><meshBasicMaterial color="#edc75e"/></mesh>
        <mesh position={[-.095,.01,.15]}><boxGeometry args={[.025,.56,.018]}/><meshBasicMaterial color="#fff0b7"/></mesh>
      </group>;
    })}
    <mesh geometry={resources.rock} material={resources.paint}/>
    <lineSegments geometry={resources.edge} userData={{baseOpacity:.10}}><lineBasicMaterial color="#575864" transparent opacity={.10} depthWrite={false}/></lineSegments>
    {resources.vines.map((v,i)=><group key={i}>
      <mesh geometry={v.tube}><meshBasicMaterial color="#79814b"/></mesh>
      {v.points.slice(1).filter((_,j)=>j%2===0).map((p,j)=><mesh key={j} position={p} rotation={[j*.6,i,j*.8]} scale={[.055,.1,.025]}>
        <octahedronGeometry args={[1]}/><meshBasicMaterial color={j%2?"#8b9451":"#687746"}/>
      </mesh>)}
    </group>)}
    {Array.from({length:12},(_,i)=>{
      const a=i*2.399,r=3.9+(i%3)*.6;
      return <mesh key={i} position={[Math.cos(a)*r,-4.5-(i%4)*.65,Math.sin(a)*r]} rotation={[i*.5,i,0]} scale={[.14,.27+(i%3)*.11,.17]}>
        <dodecahedronGeometry args={[1,0]}/><meshBasicMaterial color={i%2?"#d5d9de":"#b8c2ce"}/>
      </mesh>;
    })}
  </group>;
}
