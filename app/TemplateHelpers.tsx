"use client";
import {useEffect, useRef, useSyncExternalStore} from "react";
import {useFrame, useThree} from "@react-three/fiber";
import {DefaultLoadingManager} from "three";
import {OrbitControls as ThreeOrbitControls} from "three/examples/jsm/controls/OrbitControls.js";

const initial={active:false,loaded:0,total:0,errors:[] as string[]};
let snapshot=initial;
const listeners=new Set<()=>void>();
function publish(next:typeof initial){snapshot=next;listeners.forEach(fn=>fn());}
DefaultLoadingManager.onStart=(_url,loaded,total)=>publish({...snapshot,active:true,loaded,total});
DefaultLoadingManager.onProgress=(_url,loaded,total)=>publish({...snapshot,active:loaded<total,loaded,total});
DefaultLoadingManager.onLoad=()=>publish({...snapshot,active:false});
DefaultLoadingManager.onError=url=>publish({...snapshot,errors:[...snapshot.errors,url]});
function subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
export function useProgress(){return useSyncExternalStore(subscribe,()=>snapshot,()=>initial);}

export function OrbitControls({target,enableDamping,minDistance,maxDistance}:{target:[number,number,number];enableDamping:boolean;minDistance:number;maxDistance:number}){
  const {camera,gl}=useThree();
  const controls=useRef<ThreeOrbitControls|null>(null);
  const [x,y,z]=target;
  useEffect(()=>{
    const instance=new ThreeOrbitControls(camera,gl.domElement);
    instance.target.set(x,y,z);instance.enableDamping=enableDamping;
    instance.minDistance=minDistance;instance.maxDistance=maxDistance;
    instance.update();controls.current=instance;
    return()=>{instance.dispose();controls.current=null;};
  },[camera,gl,x,y,z,enableDamping,minDistance,maxDistance]);
  useFrame(()=>controls.current?.update());
  return null;
}
