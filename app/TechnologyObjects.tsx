"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const TECHNOLOGIES = ["Python", "Node.js", "AWS", "Vue.js", "ArgoCD", "Docker"];
const LOOP_LENGTH = 600;

function useLogoTextures() {
  const textures = useMemo(() => TECHNOLOGIES.map(name => {
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to prepare text textures");
    context.fillStyle = "#f5f8ff";
    context.strokeStyle = "#0755ed";
    context.lineWidth = 12;
    context.beginPath(); context.roundRect(14,58,484,140,24);
    context.fill(); context.stroke();
    context.fillStyle = "#17325b";
    context.font = "bold 58px sans-serif";
    context.textAlign = "center"; context.textBaseline = "middle";
    context.fillText(name,256,128,450);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }), []);
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures]);
  return textures;
}


function useQuietMotion() {
  const quiet = useRef(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { quiet.current = query.matches; };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return quiet;
}

export function TechnologyWorld() {
  const textures = useLogoTextures();
  const refs = useRef<(THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null)[]>([]);
  const quiet = useQuietMotion();
  const { size } = useThree();
  const count = size.width < 700 ? 36 : 60;
  const spreadX = Math.min(1.9, Math.max(.7, size.width / size.height));
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const items = useMemo(() => Array.from({ length: count }, (_, i) => {
    const angle = i * 2.399963;
    // Distribute across a broad volume, including the upper and lower edges.
    const radius = 18 + ((i * 17) % 43);
    return {
      x: Math.cos(angle) * radius * spreadX,
      y: Math.sin(angle) * radius,
      z: -12 - i * LOOP_LENGTH / count,
      size: 2.4 + ((i * 7) % 9) * .26,
      phase: i * .79,
      logo: i % TECHNOLOGIES.length,
    };
  }), [count, spreadX]);
  useFrame(({ camera, clock }) => {
    const time = quiet.current ? 0 : clock.elapsedTime;
    items.forEach((item, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const relativeZ = THREE.MathUtils.euclideanModulo(item.z - camera.position.z + 570, LOOP_LENGTH) - 570;
      const distance = -relativeZ;
      mesh.visible = distance > 2 && distance < 510;
      if (!mesh.visible) return;
      const approach = 1 - THREE.MathUtils.smoothstep(distance, 6, 30);
      mesh.position.set(
        item.x + Math.sin(time * .23 + item.phase) * .6 + Math.sign(item.x) * approach * 5,
        item.y + Math.cos(time * .31 + item.phase) * .45,
        camera.position.z + relativeZ + Math.sin(time * .17 + item.phase) * .25,
      );
      mesh.quaternion.copy(camera.quaternion);
      mesh.rotateZ(Math.sin(time * .18 + item.phase) * .14);
      mesh.rotateY(Math.sin(time * .16 + item.phase) * .2);
      mesh.material.opacity = .88 * THREE.MathUtils.smoothstep(distance, 3, 12);
    });
  });
  return <group name="Floating anime technology emblems">{items.map((item, i) =>
    <mesh
      key={i}
      ref={mesh => { refs.current[i] = mesh as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null; }}
      name={TECHNOLOGIES[item.logo]}
      geometry={geometry}
      position={[item.x, item.y, item.z]}
      scale={item.size}
    >
      <meshBasicMaterial map={textures[item.logo]} transparent alphaTest={.025} depthWrite={false} toneMapped={false} />
    </mesh>
  )}</group>;
}

export function StationTechnologies({ index }: { index: number }) {
  const textures = useLogoTextures();
  const group = useRef<THREE.Group>(null);
  const quiet = useQuietMotion();
  // Place the tools around the platform base, below its main content.
  const arrangements = [[2, 4, 0], [0, 1, 3], [2, 5, 4], [3, 1, 5], [2, 4, 0]];
  const logos = arrangements[index % arrangements.length];
  useFrame(({ clock }) => {
    if (!group.current) return;
    const time = quiet.current ? 0 : clock.elapsedTime;
    group.current.children.forEach((mesh, i) => {
      mesh.position.y = -2.3 + Math.sin(time * .45 + index + i * 2) * .22;
      mesh.rotation.z = Math.sin(time * .25 + i) * .1;
      mesh.rotation.y = Math.sin(time * .21 + i) * .12;
    });
  });
  return <group ref={group}>{logos.map((logo, i) =>
    <mesh key={i} name={TECHNOLOGIES[logo]} position={[-4 + i * 4, -2.3, 2.8]}>
      <planeGeometry args={[2.1, 2.1]} />
      <meshBasicMaterial map={textures[logo]} transparent alphaTest={.025} depthWrite={false} toneMapped={false} />
    </mesh>
  )}</group>;
}
