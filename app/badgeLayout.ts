import type { RefObject } from "react";
import * as THREE from "three";

export type BadgeLayout = { spread:number; size:number; top:number; bottom:number; reveal:number };
export type BadgeLayoutRef = RefObject<BadgeLayout>;
export const badgeAltitude = (index:number, layout:BadgeLayout) => index<2?layout.top:layout.bottom;
export const badgeDepth = (index:number, layout:BadgeLayout) => THREE.MathUtils.lerp((3-index)*.13,index<2?-.7:1.1,layout.reveal);
export const badgeLift = (index:number,time:number,layout:BadgeLayout) => THREE.MathUtils.lerp(Math.sin(time*.75),Math.sin(time*.75+index*1.5),layout.reveal)*.12;
