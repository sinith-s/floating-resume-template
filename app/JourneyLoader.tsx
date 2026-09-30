"use client";

import resume from "./profile";
import { Component, useEffect, useState, type ReactNode } from "react";

export function JourneyLoader({ready=false,error=false}:{ready?:boolean;error?:boolean}){
  const [slow,setSlow]=useState(false);
  useEffect(()=>{if(ready)return;const timeout=setTimeout(()=>setSlow(true),25000);return()=>clearTimeout(timeout)},[ready]);
  return <div className={`journeyLoader ${ready?"isReady":""}`} aria-hidden={ready} inert={ready}>
    <section aria-label="Journey loading status" aria-live="polite" aria-busy={!ready&&!error}>
      <span className="loaderMonogram" aria-hidden="true">{resume.identity.monogram}</span>
      <p className="loaderEyebrow">{`${resume.identity.firstName} ${resume.identity.lastName}`.toUpperCase()}</p>
      <h2>{error?"A little turbulence":"Welcome aboard"}</h2>
      <p>{error?"We couldn’t start your journey. Please try again.":ready?"Ready to explore":"Your journey will begin shortly."}</p>
      {!error&&<div className="loaderDots" role="status" aria-label="Loading"><i/><i/><i/></div>}
      {!ready&&(slow||error)&&<><p className="loaderHelp">{!error&&"This is taking longer than expected. You can wait or retry."}</p><button onClick={()=>location.reload()}>Retry loading</button></>}
      <noscript>Please enable JavaScript to explore this 3D portfolio.</noscript>
    </section>
  </div>;
}

export class JourneyBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<JourneyLoader error/>:this.props.children}
}
