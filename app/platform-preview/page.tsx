"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "../TemplateHelpers";
import { Suspense, useEffect, useState } from "react";
import MangaPlatform from "../MangaPlatform";
import CardGridBoard from "../CardGridBoard";
import { STATIONS } from "../FlightExperience";

export const dynamic = "force-static";

const views = {
  Front: [0, -4, 27], Back: [0, -4, -27],
  Left: [-27, -4, 0], Right: [27, -4, 0],
  Top: [0, 23, .01], Bottom: [0, -35, .01],
} as const;

function ViewCamera({ view }: { view: keyof typeof views }) {
  const { camera } = useThree();
  useEffect(() => {
    const [x,y,z] = views[view];
    camera.position.set(x,y,z);
    camera.lookAt(0, -6, 0);
    camera.updateProjectionMatrix();
  }, [camera, view]);
  return <OrbitControls key={view} target={[0,-6,0]} enableDamping minDistance={12} maxDistance={55}/>;
}

export default function PlatformPreview() {
  const [view, setView] = useState<keyof typeof views>("Front");
  return <main style={{position:"fixed",inset:0,background:"#fcfbf8"}}>
    <Canvas camera={{position:[0,-4,27],fov:44}} dpr={[1,1.5]}>
      <color attach="background" args={["#fcfbf8"]}/>
      <Suspense fallback={null}><MangaPlatform/><CardGridBoard station={STATIONS[2]} index={2}/></Suspense>
      <ViewCamera view={view}/>
    </Canvas>
    <nav aria-label="Platform viewing angles" style={{position:"absolute",top:20,left:20,right:20,display:"flex",gap:8,flexWrap:"wrap"}}>
      {(Object.keys(views) as (keyof typeof views)[]).map(name=><button key={name} onClick={()=>setView(name)} aria-pressed={view===name} style={{padding:"8px 16px",border:"1px solid #738094",borderRadius:8,background:view===name?"#dcecff":"#fff",fontSize:18}}>{name}</button>)}
      <a href="/" style={{marginLeft:"auto",padding:10}}>Back to journey</a>
    </nav>
    <p style={{position:"absolute",bottom:18,left:20,right:20,textAlign:"center",pointerEvents:"none",fontSize:18}}>Drag to orbit · Scroll to zoom</p>
  </main>;
}
