"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NightMaterials, useNight } from "./DayNight";

// Procedural atmosphere: no background bitmap. Cloud layers live at world
// altitudes, so translation and turning both change the view through them.
const vertexShader = `
varying vec3 vDirection;
void main() {
  vDirection = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
uniform vec3 uEye;
uniform float uTime;
uniform float uNight;
varying vec3 vDirection;
float hash(vec3 p) {
  p = fract(p * .1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                 mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                 mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float cloud(vec2 p, float seed) {
  // Circular Z coordinates make the atmosphere continuous across every lap.
  float a = p.y * 6.2831853 / 600.0;
  vec3 q = vec3(p.x * .012 + uTime * .009, sin(a)*2.4, cos(a)*2.4) + seed;
  return noise(q)*.58 + noise(q*2.07)*.28 + noise(q*4.11)*.14;
}
// World-space, seamless terrain. The 600-unit period matches the flight loop;
// camera translation reveals new forest rather than zooming a background image.
vec3 forest(vec2 p, float distanceToGround) {
  float angle = p.y * 6.2831853 / 600.0;
  vec3 terrain = vec3(p.x*.025, sin(angle)*3.0, cos(angle)*3.0);
  float hills = noise(terrain);
  vec3 green = mix(vec3(.16,.36,.29),vec3(.43,.63,.39),smoothstep(.25,.75,hills));
  // Continuous woodland patches instead of a repeated grid of round trees.
  float detail = 1.0-smoothstep(250.0,850.0,distanceToGround);
  float woodland = noise(terrain*2.13+vec3(8.2,3.1,6.4));
  float foliage = noise(terrain*7.7+woodland*2.0);
  green = mix(green,vec3(.12,.32,.26),smoothstep(.43,.65,woodland)*.65);
  green += vec3(.055,.075,.025)*(foliage-.5)*detail;
  // Cobalt waterways and teal banks echo the islands' enamel-blue palette.
  float riverCenter = 42.0*sin(angle)+17.0*sin(angle*3.0+.8);
  float riverDistance = abs(p.x-riverCenter);
  float river = 1.0-smoothstep(4.0,6.5,riverDistance);
  float tributaryCenter = riverCenter+78.0*pow(.5+.5*sin(angle+.7),2.0);
  float tributary = 1.0-smoothstep(1.8,3.7,abs(p.x-tributaryCenter));
  // Uneven shores, with three distinct basins distributed along the route.
  float shore = (noise(terrain*3.1+12.0)-.5)*.55;
  float dz1 = mod(p.y+120.0+300.0,600.0)-300.0;
  float dz2 = mod(p.y+340.0+300.0,600.0)-300.0;
  float dz3 = mod(p.y-90.0+300.0,600.0)-300.0;
  float basin1 = length(vec2((p.x+110.0)/66.0,dz1/90.0))+shore;
  float basin2 = length(vec2((p.x-135.0)/95.0,dz2/60.0))+shore;
  float basin3 = length(vec2((p.x+240.0)/48.0,dz3/40.0))+shore;
  float basin = min(basin1,min(basin2,basin3));
  float lakes = 1.0-smoothstep(.91,1.0,basin);
  float ponds = smoothstep(.76,.80,noise(terrain*2.8+vec3(32.0,7.0,18.0)));
  float water = max(max(river,tributary),max(lakes,ponds));
  float bank = max(1.0-smoothstep(6.0,13.0,riverDistance),1.0-smoothstep(1.0,1.12,basin));
  green = mix(green,vec3(.27,.60,.57),bank*.6);
  float deepWater = 1.0-smoothstep(.3,1.0,basin);
  vec3 waterColor = mix(vec3(.18,.60,.79),vec3(.045,.29,.64),deepWater);
  green = mix(green,waterColor,water);
  vec3 nightLand = green*vec3(.09,.16,.23)+vec3(.002,.012,.018);
  nightLand += vec3(.008,.07,.15)*water;
  // Warm settlements viewed from altitude: irregular clusters, not an even
  // carpet of dots. Coordinates remain attached to the earth during flight.
  if(uNight>.001) {
    float towns = smoothstep(.43,.69,noise(terrain*.78+vec3(19.0,4.0,27.0)));
    vec2 lightGrid = p/3.0;
    vec2 lightCell = floor(lightGrid);
    lightCell.y = mod(lightCell.y,200.0);
    float house = hash(vec3(lightCell,41.0));
    vec2 offset = vec2(hash(vec3(lightCell,17.0)),hash(vec3(lightCell,29.0)))*.56+.22;
    float radius = length(fract(lightGrid)-offset);
    float footprint = max(fwidth(radius),.025);
    float core = 1.0-smoothstep(.025,.055+footprint,radius);
    float halo = exp(-radius*radius*38.0)*.25;
    float occupied = smoothstep(.90-towns*.68,.96-towns*.68,house)*towns;
    // Winding arterial roads connect the inhabited patches; no neon flicker.
    float roadDistance = abs(p.x-(riverCenter+24.0+12.0*sin(angle*2.0)));
    float roadWidth = max(fwidth(roadDistance),.35);
    float road = 1.0-smoothstep(.25,.65+roadWidth,roadDistance);
    float crossRoadDistance = abs(sin(angle*2.0+p.x*.013))*30.0;
    float crossRoad = 1.0-smoothstep(.20,.55+max(fwidth(crossRoadDistance),.3),crossRoadDistance);
    float landOnly = 1.0-smoothstep(.02,.25,water);
    float lights = ((core+halo)*occupied*1.8+(road+crossRoad)*(.12+.36*towns))*landOnly;
    vec3 amber = mix(vec3(1.0,.39,.065),vec3(1.0,.73,.30),house);
    nightLand += amber*lights;
    nightLand += vec3(.07,.024,.004)*towns*towns*landOnly;
  }
  green = mix(green,nightLand,uNight);
  vec3 haze = mix(vec3(.66,.82,.87),vec3(.004,.014,.028),uNight);
  return mix(green,haze,smoothstep(160.0,1400.0,distanceToGround)*.88);
}
void main() {
  vec3 ray = normalize(vDirection);
  float elevation = smoothstep(-.32, .78, ray.y + uEye.y*.0015);
  vec3 sky = mix(vec3(.92,.96,.99), vec3(.40,.68,.94), elevation);
  sky = mix(vec3(.78,.83,.94), sky, smoothstep(-.9,-.12,ray.y));
  vec3 sunDirection = normalize(vec3(-.65,.55,-.8));
  float glow = pow(max(dot(ray,sunDirection),0.0),18.0);
  sky += vec3(.12,.09,.035)*glow;
  for(int i=1;i<3;i++) {
    float layer = float(i);
    float altitude = i==0 ? -75.0 : 100.0+layer*65.0;
    float distanceToLayer = (altitude-uEye.y) / (abs(ray.y)<.001 ? .001 : ray.y);
    if(distanceToLayer>0.0 && distanceToLayer<2200.0) {
      vec2 point = uEye.xz + ray.xz*distanceToLayer;
      float density = cloud(point,layer*13.7);
      // Soft cel-like cloud banks with a pale blue shaded edge.
      float edge = smoothstep(.48,.57,density);
      float light = smoothstep(.56,.64,density);
      vec3 tint = mix(vec3(.74,.84,.96),vec3(.99,.99,1.0),light);
      float horizonFade = 1.0-smoothstep(900.0,2200.0,distanceToLayer);
      sky = mix(sky,tint,edge*horizonFade*(i==0 ? .75 : .66));
    }
  }
  vec3 nightSky = mix(vec3(.0015,.003,.012),vec3(.006,.002,.018),elevation) + sky*.002;
  sky = mix(sky,nightSky,uNight);
  // Independently twinkling stars fixed in world direction.
  vec2 uv = vec2(atan(ray.x,ray.z),asin(clamp(ray.y,-1.0,1.0)))*85.0;
  vec2 cell = floor(uv);
  float seed = hash(vec3(cell,4.0));
  float star = step(mix(.996,.98,uNight),seed);
  vec2 center = vec2(hash(vec3(cell,12.0)),hash(vec3(cell,23.0)))*.5+.25;
  float radius = length(fract(uv)-center);
  float sparkle = exp(-radius*radius*180.0) + .12*exp(-radius*radius*24.0);
  float twinkle = .35+.65*pow(.5+.5*sin(uTime*(.45+hash(vec3(cell,7.0))*1.2)+seed*1000.0),3.0);
  sky += vec3(.72,.85,1.0)*star*sparkle*mix(.28,2.8*twinkle,uNight);
  if(ray.y<-.015) {
    float groundDistance = (-95.0-uEye.y)/ray.y;
    vec2 groundPoint = uEye.xz+ray.xz*groundDistance;
    float earthReveal = smoothstep(.015,.16,-ray.y);
    sky = mix(sky,forest(groundPoint,groundDistance),earthReveal);
  }
  gl_FragColor = vec4(sky,1.0);
  #include <colorspace_fragment>
}`;

export default function AdaptiveSky() {
  const night = useNight();
  const dome = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const quiet = useRef(false);
  const elapsed = useRef(0);
  const uniforms = useMemo(() => ({ uEye: { value: new THREE.Vector3() }, uTime: { value: 0 }, uNight: { value: 0 } }), []);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { quiet.current = query.matches; };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useFrame(({ camera, scene }, delta) => {
    dome.current?.position.copy(camera.position);
    // R3F copies uniform wrappers into the material. Update the live GPU
    // material's wrappers, not the original useMemo input object.
    const live = material.current?.uniforms;
    if (!live) return;
    live.uEye.value.copy(camera.position);
    if (!quiet.current) elapsed.current += Math.min(delta, .05);
    live.uTime.value = elapsed.current;
    live.uNight.value = THREE.MathUtils.damp(live.uNight.value,night?1:0,4,delta);
    // Match the distant haze to the sky without obscuring close-up content.
    if (scene.fog instanceof THREE.Fog) {
      const n = live.uNight.value;
      scene.fog.color.setRGB(.86*(1-n)+.0015*n,.92*(1-n)+.003*n,.98*(1-n)+.012*n);
    }
  });
  return <mesh ref={dome} name="Adaptive illustrated sky" renderOrder={-100} frustumCulled={false}>
    <sphereGeometry args={[800, 32, 16]} />
    <NightMaterials />
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader}
      side={THREE.BackSide} depthWrite={false} depthTest={false} toneMapped={false} />
  </mesh>;
}
