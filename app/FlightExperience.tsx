"use client";

import resume, {ACTIVE_STATION_IDS} from "./profile";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, Suspense, useEffect, useRef, useState } from "react";
import { useProgress } from "./TemplateHelpers";
import { JourneyLoader } from "./JourneyLoader";
import * as THREE from "three";
import { TechnologyWorld } from "./TechnologyObjects";
import CardGridBoard from "./CardGridBoard";
import CertificationBadges from "./CertificationBadges";
import ExperienceTimeline from "./ExperienceTimeline";
import TechnologyDisplay from "./TechnologyDisplay";
import ProjectDock from "./ProjectDock";
import SkillsCompass from "./SkillsCompass";
import MangaPlatform from "./MangaPlatform";
import AdaptiveSky from "./AdaptiveSky";
import { glideStep, wheelTravel } from "./flightMotion";
import { createFlightPath, LOOP_LENGTH } from "./flightPath";

export type Station={code:string;nav:string;title:string;subtitle:string;body:string;tags:string[];list:string[];z:number;x:number;y:number;focusX:number;focusY:number;exitX:number;exitY:number;color:string;accent:string};

const STATION_LAYOUT = [
  {
    "z": -58,
    "x": 17,
    "y": 10,
    "focusX": 2.3,
    "focusY": 0.7,
    "exitX": 18,
    "exitY": 10,
    "color": "#dbad93",
    "accent": "#d8c68e"
  },
  {
    "z": -142,
    "x": -13,
    "y": -12,
    "focusX": 1.9,
    "focusY": -0.5,
    "exitX": -18,
    "exitY": -10,
    "color": "#97b8cc",
    "accent": "#c8a5bc"
  },
  {
    "z": -233,
    "x": -23,
    "y": 17,
    "focusX": -1.4,
    "focusY": 0.2,
    "exitX": -18,
    "exitY": 12,
    "color": "#c8a5bc",
    "accent": "#dbad93"
  },
  {
    "z": -326,
    "x": 19,
    "y": 24,
    "focusX": 1.6,
    "focusY": 0.7,
    "exitX": 18,
    "exitY": 10,
    "color": "#d8c68e",
    "accent": "#97b8cc"
  },
  {
    "z": -420,
    "x": 9,
    "y": -17,
    "focusX": -0.4,
    "focusY": -0.4,
    "exitX": 12,
    "exitY": -18,
    "color": "#c5ccd2",
    "accent": "#dbad93"
  }
];
export const STATIONS:Station[]=resume.stations.map((station,index)=>({...station,...STATION_LAYOUT[index]}));

const sampleFlightPath = createFlightPath(ACTIVE_STATION_IDS.map(i=>STATIONS[i]));
// Recycle only beyond the viewer, so the next lap is already visible ahead.
function loopZ(z:number,cameraZ:number){return cameraZ+THREE.MathUtils.euclideanModulo(z-cameraZ+LOOP_LENGTH-30,LOOP_LENGTH)-(LOOP_LENGTH-30)}




function StationView({station,index}:{station:Station;index:number}){const group=useRef<THREE.Group>(null);const lastFade=useRef(1);const {camera,size}=useThree();const mobile=size.width<=850;useFrame(({clock})=>{if(!group.current)return;const time=clock.elapsedTime;const worldZ=loopZ(station.z,camera.position.z);const relativeZ=worldZ-camera.position.z;group.current.visible=relativeZ<-3&&relativeZ>-510;if(!group.current.visible)return;const evadeRaw=THREE.MathUtils.smoothstep(relativeZ,mobile?-18:-34,-4);const evade=evadeRaw*evadeRaw;const fade=1-THREE.MathUtils.smoothstep(relativeZ,-14,-3);group.current.position.x=station.x+station.exitX*evade+Math.sin(time*.23+index*1.7)*.32;group.current.position.y=station.y+station.exitY*evade+Math.sin(time*.35+index)*.30;group.current.position.z=worldZ+Math.sin(time*.19+index*.8)*.32;
if(mobile){
  // Fit the reading stop to the frustum, leaving room for fixed controls.
  const distance=-relativeZ;
  const halfHeight=distance*Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov/2));
  const scale=Math.min(1,halfHeight*(size.width/size.height)*1.6/14.4,halfHeight*1.25/13);
  group.current.scale.setScalar(scale);
  const reading=1-THREE.MathUtils.smoothstep(distance,22,60);
  group.current.position.x=THREE.MathUtils.lerp(group.current.position.x,camera.position.x+station.exitX*evade,reading);
  group.current.position.y=THREE.MathUtils.lerp(group.current.position.y,camera.position.y-2*scale+station.exitY*evade,reading);
}else group.current.scale.setScalar(1);
group.current.lookAt(camera.position);group.current.rotateZ(Math.sin(time*.18+index)*.012+(station.exitY>0?1:-1)*evade*.045);if(Math.abs(fade-lastFade.current)>.0001){lastFade.current=fade;group.current.traverse(child=>{if(!(child instanceof THREE.Mesh)&&!(child instanceof THREE.Line))return;const materials=Array.isArray(child.material)?child.material:[child.material];materials.forEach(material=>{const baseOpacity=child.userData.baseOpacity??1;material.transparent=baseOpacity<1||fade<.999||material instanceof THREE.MeshBasicMaterial&&!!material.alphaTest;material.opacity=fade*baseOpacity;material.depthWrite=baseOpacity===1&&fade>.35})})}});return <group ref={group} name={`station-${index}`} position={[station.x,station.y,station.z]}><Suspense fallback={null}><MangaPlatform label={station.nav==="Certifications"?"CERTIFICATIONS":station.nav==="Projects"?"PROJECTS":station.nav==="Skills"?"SKILLS":undefined}/></Suspense><Suspense fallback={null}>{(station.nav==="Projects"?<ProjectDock/>:station.nav==="Skills"?<SkillsCompass/>:station.nav==="Certifications"?<CertificationBadges/>:station.nav==="Companies worked"?<ExperienceTimeline/> :station.nav==="Technologies used"?<TechnologyDisplay/>:<CardGridBoard station={station} index={index}/>)}</Suspense></group>}




function CameraRig({enabled,started,onJourneyChange,onStation,onProgress}:{enabled:boolean;started:boolean;onJourneyChange:(active:boolean)=>void;onStation:(n:number)=>void;onProgress:(p:number)=>void}){const {camera}=useThree();const enabledRef=useRef(enabled);enabledRef.current=enabled;const paused=useRef(false);useEffect(()=>{const pause=(event:Event)=>{paused.current=Boolean((event as CustomEvent<boolean>).detail)};addEventListener("journey-pause",pause);return()=>removeEventListener("journey-pause",pause)},[]);const target=useRef({z:10});const current=useRef(10);const velocity=useRef(0);const journeyState=useRef(started);const pointer=useRef({x:0,y:0});const last=useRef(-1);const lastProgress=useRef(-1);const pointerOffset=useRef({x:0,y:0});useEffect(()=>{journeyState.current=started},[started]);useEffect(()=>{const wheel=(e:WheelEvent)=>{if(paused.current||!enabledRef.current)return;e.preventDefault();target.current.z=THREE.MathUtils.clamp(target.current.z+wheelTravel(e.deltaY,e.deltaMode,innerHeight),current.current-85,current.current+85)};const move=(e:MouseEvent)=>{pointer.current.x=(e.clientX/innerWidth-.5)*2;pointer.current.y=(e.clientY/innerHeight-.5)*2};let touchY=0;const start=(e:TouchEvent)=>{touchY=e.touches[0]?.clientY||0};const touch=(e:TouchEvent)=>{if(paused.current||!enabledRef.current)return;const y=e.touches[0]?.clientY||touchY;target.current.z=THREE.MathUtils.clamp(target.current.z+(touchY-y)*.15,current.current-85,current.current+85);touchY=y};const key=(e:KeyboardEvent)=>{if(paused.current||!enabledRef.current)return;if(["ArrowDown","PageDown"," "].includes(e.key)){e.preventDefault();target.current.z=target.current.z+18}if(["ArrowUp","PageUp"].includes(e.key)){e.preventDefault();target.current.z=target.current.z-18}};const jump=(e:Event)=>{const station=STATIONS[(e as CustomEvent<number>).detail];if(station)target.current.z=-station.z-15};addEventListener("wheel",wheel,{passive:false});addEventListener("mousemove",move);addEventListener("touchstart",start,{passive:true});addEventListener("touchmove",touch,{passive:true});addEventListener("keydown",key);addEventListener("station-jump",jump);return()=>{removeEventListener("wheel",wheel);removeEventListener("mousemove",move);removeEventListener("touchstart",start);removeEventListener("touchmove",touch);removeEventListener("keydown",key);removeEventListener("station-jump",jump)}},[]);useFrame((_,delta)=>{if(paused.current||!enabledRef.current){target.current.z=current.current;velocity.current=0;return}const glide=glideStep(current.current,velocity.current,target.current.z,delta);current.current=glide.position;velocity.current=glide.velocity;const completedLaps=Math.floor((current.current-10)/LOOP_LENGTH);current.current-=completedLaps*LOOP_LENGTH;target.current.z-=completedLaps*LOOP_LENGTH;const phase=current.current-10;const inJourney=phase>3&&phase<LOOP_LENGTH-3;if(inJourney!==journeyState.current){journeyState.current=inJourney;onJourneyChange(inJourney)}camera.position.z=-current.current+20;const path=sampleFlightPath(phase);
const ahead=sampleFlightPath(phase+14);
pointerOffset.current.x=THREE.MathUtils.damp(pointerOffset.current.x,pointer.current.x*.8,2.6,Math.min(delta,.05));
pointerOffset.current.y=THREE.MathUtils.damp(pointerOffset.current.y,-pointer.current.y*.32,2.6,Math.min(delta,.05));
camera.position.x=path.x+pointerOffset.current.x;
camera.position.y=path.y+pointerOffset.current.y;const nearest=ACTIVE_STATION_IDS.reduce((best,i)=>Math.abs(camera.position.z-loopZ(STATIONS[i].z,camera.position.z))<Math.abs(camera.position.z-loopZ(STATIONS[best].z,camera.position.z))?i:best,ACTIVE_STATION_IDS[0]??0);const distance=ACTIVE_STATION_IDS.length?Math.abs(camera.position.z-loopZ(STATIONS[nearest].z,camera.position.z)):Infinity;// Follow the route's direction with restrained yaw/pitch; level out for reading.
const yaw=THREE.MathUtils.clamp(-Math.atan2(ahead.x-path.x,14)*.38,-.23,.23);
const pitch=THREE.MathUtils.clamp(Math.atan2(ahead.y-path.y,14)*.38,-.20,.20);
camera.rotation.order="YXZ";
camera.rotation.y=THREE.MathUtils.damp(camera.rotation.y,yaw-pointer.current.x*.016,2.6,Math.min(delta,.05));
camera.rotation.x=THREE.MathUtils.damp(camera.rotation.x,pitch+pointer.current.y*.012,2.6,Math.min(delta,.05));
camera.rotation.z=THREE.MathUtils.damp(camera.rotation.z,-yaw*.07,2.2,Math.min(delta,.05));if(nearest!==last.current&&distance<72){last.current=nearest;onStation(nearest)}const progress=Math.round(phase/LOOP_LENGTH*1000)/1000;if(progress!==lastProgress.current){lastProgress.current=progress;onProgress(progress)}},-1);return null}


function OpeningReady({canFinish,onReady}:{canFinish:boolean;onReady:()=>void}){
  const frames=useRef(0),warming=useRef(false),compiled=useRef(false),done=useRef(false),settledAt=useRef<number|null>(null);
  useFrame(({gl,scene,camera,clock})=>{
    if(done.current)return;
    if(!canFinish){frames.current=0;settledAt.current=null;return}
    // Allow Suspense children and the day/night shader patches to settle.
    ++frames.current;
    if(settledAt.current===null)settledAt.current=clock.elapsedTime;
    if(!warming.current){
      if(clock.elapsedTime-settledAt.current<.3||frames.current<3)return;
      warming.current=true;
      scene.traverse(object=>{
        if(!(object instanceof THREE.Mesh || object instanceof THREE.Line))return;
        const materials=Array.isArray(object.material)?object.material:[object.material];
        for(const material of materials){
          for(const value of Object.values(material)){
            if(value instanceof THREE.Texture)gl.initTexture(value);
          }
        }
      });
      // Compile materials before the first trip, not as each island approaches.
      gl.compileAsync(scene,camera).then(()=>{compiled.current=true;frames.current=0})
        .catch(()=>{gl.compile(scene,camera);compiled.current=true;frames.current=0});
    }
    if(compiled.current&&frames.current>=3){done.current=true;onReady()}
  });
  return null;
}
function FlightExperience({started,onJourneyChange,onStation,onProgress}:{started:boolean;onJourneyChange:(active:boolean)=>void;onStation:(n:number)=>void;onProgress:(p:number)=>void}){
  const [fontsReady,setFontsReady]=useState(false),[fontError,setFontError]=useState(false),[ready,setReady]=useState(false);
  const [pixelRatio,setPixelRatio]=useState(1);
  const {active:loading,loaded,total,errors}=useProgress();
  useEffect(()=>{const media=matchMedia("(max-width: 850px)");const update=()=>setPixelRatio(media.matches?1:1.25);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update)},[]);
  useEffect(()=>{let active=true;Promise.all([document.fonts.load('800 76px "Barlow Condensed"'),document.fonts.load('700 76px "Cabin Sketch"'),document.fonts.load('28px "Patrick Hand"')]).then(()=>{if(active)setFontsReady(true)}).catch(()=>{if(active)setFontError(true)});return()=>{active=false}},[]);
  return <><JourneyLoader ready={ready} error={!ready&&(fontError||errors.length>0)}/>
    <div className="flightMount" inert={!ready}><Canvas fallback={<JourneyLoader error/>} camera={{position:[0,.35,10],fov:58,near:.1,far:900}} dpr={[1,pixelRatio]} gl={{antialias:true,powerPreference:"high-performance"}}>
    <color attach="background" args={["#fcfbf8"]}/><fog attach="fog" args={["#deebfa",170,560]}/><AdaptiveSky/><ambientLight intensity={2.15}/><directionalLight position={[8,13,8]} intensity={2.15}/>
    <Suspense fallback={null}><TechnologyWorld/></Suspense>
    {fontsReady&&ACTIVE_STATION_IDS.map(index=><StationView key={STATIONS[index].code} station={STATIONS[index]} index={index}/>)}
    <OpeningReady canFinish={fontsReady&&!loading&&loaded===total&&errors.length===0} onReady={()=>setReady(true)}/>
    <CameraRig enabled={ready} started={started} onJourneyChange={onJourneyChange} onStation={onStation} onProgress={onProgress}/>
    </Canvas></div></>;
}

// Home progress changes every scroll frame; do not reconcile the 3D tree with it.
export default memo(FlightExperience);
