"use client";

import { useEffect, useRef, useState } from "react";

// An original, softly voiced C-major / A-minor ambient progression. No files,
// downloads, microphone access or third-party audio services are involved.
const CHORDS = [[48,55,60,64,71],[45,52,57,60,67],[41,48,53,57,64],[43,50,55,59,64]];
const MELODY = [76,79,74,71,72,76,79,76,69,72,76,74,71,74,79,74];

class AmbientScore {
  context: AudioContext;
  master: GainNode;
  voices = new Set<OscillatorNode>();
  timer?: ReturnType<typeof setInterval>;
  fadeTimer?: ReturnType<typeof setTimeout>;
  next = 0;
  step = 0;
  constructor() {
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 2400;
    const delay = this.context.createDelay(2), feedback = this.context.createGain();
    delay.delayTime.value = .75; feedback.gain.value = .22;
    this.master.connect(filter); filter.connect(this.context.destination);
    filter.connect(delay); delay.connect(feedback); feedback.connect(delay);
    delay.connect(this.context.destination);
  }
  tone(note: number, at: number, duration: number, pad: boolean) {
    const oscillator = this.context.createOscillator(), gain = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 440 * 2 ** ((note-69)/12);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(pad ? .10 : .13, at+(pad ? 1.8 : .08));
    gain.gain.exponentialRampToValueAtTime(.0001, at+duration);
    oscillator.connect(gain); gain.connect(this.master);
    this.voices.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.voices.delete(oscillator); };
    oscillator.start(at); oscillator.stop(at+duration+.05);
  }
  schedule = () => {
    const now = this.context.currentTime;
    if (this.next < now) this.next = now+.05; // Never catch up in a burst after a stall.
    while(this.next < now+1) {
      if(this.step%4===0) CHORDS[Math.floor(this.step/4)%4].forEach((note,index)=>this.tone(note,this.next+index*.06,10,true));
      this.tone(MELODY[this.step%MELODY.length],this.next,3.5,false);
      this.next += 2; this.step++;
    }
  };
  async start() {
    clearTimeout(this.fadeTimer);
    clearInterval(this.timer);
    for(const voice of this.voices){try{voice.stop()}catch{}}
    await this.context.resume();
    if(this.context.state!=="running") throw new Error("Audio unavailable");
    this.next=this.context.currentTime+.08; this.step=0;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setValueAtTime(this.master.gain.value,this.context.currentTime);
    this.master.gain.linearRampToValueAtTime(.18,this.context.currentTime+1.5);
    this.schedule(); this.timer=setInterval(this.schedule,200);
  }
  stop(immediate=false) {
    clearInterval(this.timer); clearTimeout(this.fadeTimer);
    const now=this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value,now);
    this.master.gain.linearRampToValueAtTime(0,now+(immediate ? .01 : 1.2));
    const finish=()=>{for(const voice of this.voices){try{voice.stop()}catch{}};void this.context.suspend();};
    if(immediate) finish(); else this.fadeTimer=setTimeout(finish,1600);
  }
  dispose() { clearInterval(this.timer); clearTimeout(this.fadeTimer); void this.context.close(); }
}

export default function AmbientMusic({travelling}:{travelling:boolean}) {
  const engine=useRef<AmbientScore|null>(null),busy=useRef(false);
  const [playing,setPlaying]=useState(false),[error,setError]=useState(false);
  useEffect(()=>{
    const hide=()=>{if(document.hidden){engine.current?.stop(true);setPlaying(false)}};
    document.addEventListener("visibilitychange",hide);
    return()=>{document.removeEventListener("visibilitychange",hide);engine.current?.dispose();engine.current=null};
  },[]);
  const toggle=async()=>{
    if(busy.current)return;
    busy.current=true;setError(false);
    try {
      if(playing){engine.current?.stop();setPlaying(false)}
      else {engine.current??=new AmbientScore();await engine.current.start();setPlaying(true)}
    } catch {engine.current?.dispose();engine.current=null;setPlaying(false);setError(true)}
    finally {busy.current=false}
  };
  return <div className={`ambientMusic ${travelling?"isTravelling":""}`}>
    <button onClick={toggle} aria-pressed={playing} aria-label={playing?"Turn ambient music off":"Turn ambient music on"}>♫ MUSIC {playing?"ON":"OFF"}</button>
    {error&&<span role="status">Music unavailable. Please try again.</span>}
  </div>;
}
