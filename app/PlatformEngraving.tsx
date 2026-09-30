"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useNight } from "./DayNight";

/** Flush lettering with a shaded inset lip, rather than a floating sign. */
export default function PlatformEngraving({label}:{label:string}){
  const night=useNight();
  const texture=useMemo(()=>{
    const canvas=document.createElement("canvas");canvas.width=1536;canvas.height=256;
    const ctx=canvas.getContext("2d")!;
    ctx.font="900 132px Arial, sans-serif";
    ctx.textAlign="center";ctx.textBaseline="middle";
    const text=label.toUpperCase();
    // Lower highlight and upper shadow suggest a cut into the pale deck.
    ctx.lineWidth=5;ctx.strokeStyle=night?"#71cad7":"#ffffff";
    ctx.strokeText(text,768,133,1460);
    ctx.strokeStyle=night?"#04101e":"#35475f";
    ctx.strokeText(text,768,124,1460);
    const fill=ctx.createLinearGradient(0,78,0,177);
    fill.addColorStop(0,night?"#235366":"#40566e");
    fill.addColorStop(.28,night?"#6ec5d5":"#75869c");
    fill.addColorStop(1,night?"#a5e6ed":"#506982");
    ctx.fillStyle=fill;ctx.fillText(text,768,128,1460);
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    map.anisotropy=8;return map;
  },[label,night]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <mesh name={`${label} engraved deck lettering`} position={[0,.195,3.65]} rotation={[-Math.PI/2,0,0]} raycast={()=>{}}>
    <planeGeometry args={[9.4,2.2]}/>
    <meshBasicMaterial map={texture} transparent alphaTest={.02} toneMapped={false}
      polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} userData={{steadyBoardText:true}}/>
  </mesh>;
}
