"use client";
import {Label,Plate} from "./ExperienceTimeline";
import {pageCount} from "./platformPagination";
export default function PlatformPager({page,total,size,onChange,y=-3,z=4.7}:{page:number;total:number;size:number;onChange:(direction:number)=>void;y?:number;z?:number}){
  if(total<=size)return null;
  return <group position={[0,y,z]}>
    {[-1,1].map(direction=><group key={direction} position={[direction*3.9,0,0]}
      onClick={event=>{event.stopPropagation();onChange(direction)}}>
      <Plate width={1.65} height={.65} color="#0755ed"/>
      <Label text={direction<0?"← PREV":"NEXT →"} color="#fff" width={1.4} height={.4} z={.12}/>
    </group>)}
    <Label text={`PAGE ${page+1} / ${pageCount(total,size)}`} color="#17488c" background="#f5f8fd" width={2.2} height={.45} z={.1}/>
  </group>;
}
