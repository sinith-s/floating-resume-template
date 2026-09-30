"use client";
import { stationReveal } from "./stationReveal";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Label } from "./ExperienceTimeline";
import { useNight } from "./DayNight";
import PlatformPager from "./PlatformPager";
import {pageItems,turnPage} from "./platformPagination";
import { TECHNOLOGY_CATEGORIES } from "./technologyCatalog";

const BLUE = "#064de8", GOLD = "#ffd04b";

// Keep the enamel palette independent of the sky's bright ambient lighting.
// View-space normals give bevels and side walls a consistent manga-style shade;
// the standard material still owns depth, opacity and the station's exit fade.
function Enamel({ color }: { color: string }) {
  return <meshStandardMaterial color={color} roughness={.36} metalness={.08} toneMapped={false}
    onBeforeCompile={shader => {
      shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", `
        float key = dot(normalize(normal), normalize(vec3(-0.65, 0.9, 1.0)));
        float shade = mix(0.42, 1.0, smoothstep(-0.2, 0.85, key));
        outgoingLight = diffuseColor.rgb * shade;
        outgoingLight += vec3(0.035) * pow(max(key, 0.0), 18.0);
        #include <opaque_fragment>
      `);
    }} customProgramCacheKey={() => "technology-enamel-v1"} />;
}

function Header({ width, height, text }: { width: number; height: number; text: string }) {
  const night = useNight();
  return <group>
    <Block width={width + .1} height={height + .1} depth={.38} color={night ? "#39beff" : "#123a88"} />
    <group position={[0, 0, .2]}><Block width={width} height={height} depth={.16} color={night ? "#075095" : BLUE} /></group>
    <Label text={text} color="#ffffff" width={width - .25} height={height * .82} z={.29} />
    {[-1, 1].flatMap(x => [-1, 1].map(y => <mesh key={`${x}:${y}`} position={[x * (width / 2 - .1), y * (height / 2 - .09), .3]}>
      <sphereGeometry args={[.047, 8, 6]} /><Enamel color={GOLD} />
    </mesh>))}
  </group>;
}
const GROUPS = TECHNOLOGY_CATEGORIES.map((category, absoluteIndex) => {
  const index=absoluteIndex%11;
  const row = index < 3 ? 2 : index < 7 ? 1 : 0;
  const column = index < 3 ? index : index < 7 ? index - 3 : index - 7;
  return { ...category, title: category.short, x: (column - (row === 2 ? 1 : 1.5)) * 3.4,
    y: -1.45 + row * 2.7, z: 2.1 - row * 1.8, width: 2.93, diameter: 1.12 };
});

export function Block({ width, height, depth, color }: { width: number; height: number; depth: number; color: string }) {
  const geometry = useMemo(() => new RoundedBoxGeometry(width, height, depth, 3, Math.min(.075, height / 4, width / 4, depth / 4)), [width, height, depth]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 35), [geometry]);
  useEffect(() => () => { geometry.dispose(); edges.dispose(); }, [geometry, edges]);
  return <group><mesh geometry={geometry}><Enamel color={color} /></mesh>
    <lineSegments geometry={edges}><lineBasicMaterial color="#385475" /></lineSegments></group>;
}

function Medallion({ label, asset, diameter, x }: { label: string; asset: string; diameter: number; x: number }) {
  const night = useNight();
  const original = useLoader(THREE.TextureLoader, `/technology-logos/${asset}.svg`);
  // Rasterize the original vector at display resolution, preserving its aspect
  // ratio and colors. These assets are independent of the reference picture.
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
    const c = canvas.getContext("2d")!;
    const image = original.image as HTMLImageElement;
    const w = image.naturalWidth || image.width || 128;
    const h = image.naturalHeight || image.height || 128;
    const scale = 480 / Math.max(w, h);
    c.drawImage(image, (512 - w * scale) / 2, (512 - h * scale) / 2, w * scale, h * scale);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
    return map;
  }, [original]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group position={[x, 0, .64]} name={`${label} original logo medallion`}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[diameter / 2, diameter / 2, .36, 48]} />
      <Enamel color={night ? "#29baff" : "#2869ce"} /></mesh>
    <mesh position={[0, 0, .19]}><torusGeometry args={[diameter / 2 - .035, .055, 8, 48]} /><Enamel color="#dbe6f5" /></mesh>
    <mesh position={[0, 0, .185]}><circleGeometry args={[diameter / 2 - .06, 48]} />
      <Enamel color="#ffffff" /></mesh>
    <mesh position={[0, 0, .198]}><planeGeometry args={[diameter * .76, diameter * .76]} />
      <meshBasicMaterial map={texture} transparent alphaTest={.015} toneMapped={false} userData={{ steadyBoardText: true }} /></mesh>
    <group position={[0, -diameter / 2 - .21, 0]}>
      <Block width={diameter + .14} height={.4} depth={.88} color={night ? "#122340" : "#f8fafb"} />
      <group position={[0, -.18, 0]}><Block width={diameter + .2} height={.09} depth={.94} color={BLUE} /></group>
      <Label text={label} color={night ? "#dff7ff" : "#103b83"} width={diameter + .03} height={.32} z={.45} />
    </group>
  </group>;
}

function Category({ category, positioned = true }: { category: typeof GROUPS[number]; positioned?: boolean }) {
  const night = useNight();
  const { width, diameter, logos } = category;
  const baseY = -diameter / 2 - .51;
  const supportHeight = category.y + baseY + 2.92;
  return <group position={positioned ? [category.x, category.y, category.z] : [0, category.y + 3.1, 0]} name={`${category.title} technology display`}
    onClick={event => { event.stopPropagation(); window.dispatchEvent(new CustomEvent("technology-category", { detail: category.id })); }}>
    <group position={[0, -.05, -.16]}><Block width={width + .12} height={2.21} depth={.48} color={night ? "#1567a4" : BLUE} /></group>
    <group position={[0, -.05, .1]}><Block width={width} height={2.15} depth={.16} color={night ? "#0a1930" : "#f3f5f6"} /></group>
    <group position={[0, 1.25, .06]}>
      <Header width={width + .06} height={.59} text={category.title} />
    </group>
    {[-1, 1].map(side => <group key={side} position={[side * (width / 2 + .045), 0, 0]}>
      <Block width={.065} height={2.55} depth={.15} color={night ? "#58d6ff" : BLUE} />
      <group position={[0, 1.24, .08]}><Block width={.19} height={.48} depth={.3} color={GOLD} /></group>
    </group>)}
    <group position={[0, baseY, .24]}>
      <Block width={width + .35} height={.28} depth={1.55} color={night ? "#17304b" : "#fafbf8"} />
      <group position={[0, -.19, .02]}><Block width={width + .32} height={.13} depth={1.5} color={BLUE} /></group>
      {[-1, 1].map(side => <group key={side} position={[side * (width / 2 + .04), -.035, 0]}><Block width={.17} height={.48} depth={1.62} color={GOLD} /></group>)}
    </group>
    {supportHeight > .2 && <group position={[0, baseY - .17 - supportHeight / 2, -.3]}><Block width={width - .16} height={supportHeight} depth={1.1} color={night ? "#0c1c32" : "#e5ebf2"} /></group>}
    {logos.map(([label, asset], i) => <Medallion key={asset} label={label} asset={asset} diameter={diameter} x={(i - (logos.length - 1) / 2) * (width - .3) / logos.length} />)}
    {logos.length > 1 && <mesh position={[0, 0, .38]}><boxGeometry args={[width - .75, .018, .018]} /><meshBasicMaterial color={GOLD} /></mesh>}
    {logos.slice(1).map((_, i) => <mesh key={i} position={[(i - (logos.length - 2) / 2) * (width - .3) / logos.length, 0, .4]}>
      <sphereGeometry args={[.054, 8, 6]} /><meshBasicMaterial color="#ffe997" /></mesh>)}
  </group>;
}

type RevealState = MutableRefObject<{ progress: number; quiet: boolean }>;

function UnfoldingCategory({ category, index, reveal }: { category: typeof GROUPS[number]; index: number; reveal: RevealState }) {
  const root = useRef<THREE.Group>(null);
  const light = useRef<THREE.Mesh>(null);
  // Open the front tier first, then the middle and rear tiers. Alternate from
  // the centre outward rather than running a left-to-right wall of motion.
  const order = [9, 8, 10, 6, 4, 5, 7, 2, 0, 1, 3][index];
  useFrame(() => {
    if (!root.current) return;
    const { progress, quiet } = reveal.current;
    const p = quiet ? 1 : THREE.MathUtils.smootherstep(progress, order * .042, .56 + order * .042);
    const remaining = 1 - p;
    // The pivot stays on the deck. Supports telescope upward with their card,
    // so nothing drops through the island while the display is folded.
    root.current.position.set(category.x * (.34 + .66 * p), -3.1, category.z * (.38 + .62 * p));
    root.current.scale.set(.58 + .42 * p, .075 + .925 * p, .58 + .42 * p);
    root.current.rotation.y = Math.sign(category.x || 1) * remaining * .72;
    root.current.rotation.z = Math.sign(category.x) * remaining * .045;
    if (light.current) {
      const sweep = Math.sin(Math.PI * p);
      light.current.visible = !quiet && sweep > .035;
      light.current.position.y = .25 + (category.y + 4.5) * p;
      light.current.scale.x = .6 + .4 * sweep;
      light.current.userData.baseOpacity = .6 * sweep;
    }
  });
  return <group ref={root} name={`${category.title} scroll reveal`} position={[category.x * .34, -3.1, category.z * .38]} scale={[.58, .075, .58]}>
    <Category category={category} positioned={false} />
    <mesh ref={light} position={[0, .25, 1.13]} userData={{ baseOpacity: 0 }} raycast={() => {}}>
      <boxGeometry args={[category.width + .1, .035, .04]} /><meshBasicMaterial color="#ffdc70" transparent depthWrite={false} toneMapped={false} />
    </mesh>
  </group>;
}

export default function TechnologyDisplay() {
  const [page,setPage]=useState(0);
  const night = useNight();
  const root = useRef<THREE.Group>(null);
  const mast = useRef<THREE.Group>(null);
  const reveal = useRef({ progress: 0, quiet: false });
  const world = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reveal.current.quiet = media.matches; };
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useFrame(({ camera }, delta) => {
    if (!root.current) return;
    root.current.getWorldPosition(world);
    const depth = camera.position.z - world.z;
    // Recycled station transforms reset the sequence each lap. The reveal
    // completes at 36 units, ahead of the existing close-range sideward exit.
    const target = stationReveal(depth);
    reveal.current.progress = THREE.MathUtils.damp(reveal.current.progress, target, 10, Math.min(delta, .05));
    if (mast.current) {
      const p = reveal.current.quiet ? 1 : THREE.MathUtils.smootherstep(reveal.current.progress, 0, .72);
      mast.current.position.y = -3.1 + 9.5 * (.22 + .78 * p);
      mast.current.scale.setScalar(.72 + .28 * p);
    }
  }, -.25);
  useEffect(() => () => { document.body.style.cursor = ""; }, []);
  // Scale around deck height, not the display's centre. The whole footprint,
  // including shelf corners, remains inside the island's 7.2-unit radius.
  return <group ref={root} name="Tiered technology showcase" position={[0, -.49, -.5]} scale={.84} rotation={[0, -.16, 0]} onClick={event => { event.stopPropagation(); window.dispatchEvent(new CustomEvent("station-notes", { detail: 3 })); }}
    onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
    <group ref={mast} position={[0, -1.01, -1.5]}>
      <Header width={8.1} height={1.2} text="TECHNOLOGIES" />
      {[-4.14, 4.14].map(x => <group key={x} position={[x, 0, 0]}><Block width={.23} height={.7} depth={.29} color={GOLD} /></group>)}
      {[-2.9, 2.9].map(x => <group key={x} position={[x, -.85, -.15]}><Block width={.16} height={.9} depth={.22} color={BLUE} /></group>)}
    </group>
    <group position={[0, -2.98, 2.4]}>
      <Block width={13.35} height={.24} depth={2.2} color={night ? "#122845" : "#e7effa"} />
      <group position={[0, .14, 0]}><Block width={13.25} height={.08} depth={2.12} color={BLUE} /></group>
      {[-6.5, 6.5].map(x => <group key={x} position={[x, .02, 0]}><Block width={.2} height={.31} depth={2.23} color={GOLD} /></group>)}
    </group>
    {pageItems(GROUPS,page,11).map((category, index) => <UnfoldingCategory key={category.id} category={category} index={index} reveal={reveal} />)}
    <PlatformPager page={page} total={GROUPS.length} size={11} onChange={d=>setPage(p=>turnPage(p,d,GROUPS.length,11))} y={-3.6}/>
    <group position={[0, -3, 3.62]}><Label text={`${TECHNOLOGY_CATEGORIES.length} CATEGORIES · CLICK TO EXPLORE`} color={night ? "#fce3a0" : "#133d7b"} width={8} height={.32} z={.04} /></group>
  </group>;
}
