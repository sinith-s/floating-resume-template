"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const NightContext = createContext(false);
export const useNight = () => useContext(NightContext);

export function DayNight({ children }: { children: ReactNode }) {
  const [night, setNight] = useState(false);
  useEffect(() => { try { setNight(localStorage.getItem("journey-night") === "true"); } catch {} }, []);
  return <NightContext.Provider value={night}><div data-theme={night ? "night" : "day"}>
    {children}
    <button className="themeToggle" role="switch" aria-checked={night} aria-label="Night theme"
      onClick={() => setNight(value => { try { localStorage.setItem("journey-night", String(!value)); } catch {} return !value; })}>
      <span aria-hidden="true">{night ? "☾" : "☀"}</span> {night ? "NIGHT" : "DAY"}
      <span className="themeTrack" aria-hidden="true"><i /></span>
    </button>
  </div></NightContext.Provider>;
}

// Adapt the existing painted materials rather than swapping/remounting the world.
// The reference projections and the station fade continue to run unchanged.
export function NightMaterials() {
  const night = useNight();
  const quiet = useRef(false);
  const nextMaterialScan = useRef(0);
  const uniforms = useMemo(() => ({ night: { value: 0 }, power: { value: 1 } }), []);
  const patched = useRef(new Map<THREE.Material, { compile: THREE.Material["onBeforeCompile"]; key: THREE.Material["customProgramCacheKey"] }>());
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { quiet.current = media.matches; }; update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => () => {
    patched.current.forEach((original, material) => {
      material.onBeforeCompile = original.compile; material.customProgramCacheKey = original.key; material.needsUpdate = true;
    }); patched.current.clear();
  }, []);
  useFrame(({ scene, clock }, delta) => {
    uniforms.night.value = THREE.MathUtils.damp(uniforms.night.value, night ? 1 : 0, 4, delta);
    const t = clock.elapsedTime;
    // Distinct voltage drops, separated by steady stretches. Never black out
    // the content or flicker the sky; reduced motion keeps the power steady.
    const phase = t % 9;
    const dip = (phase > 1.2 && phase < 1.45) || (phase > 2.2 && phase < 2.38) || (phase > 6.1 && phase < 6.42);
    const powerTarget = dip ? .38 : .98 + .02 * Math.sin(t * 1.7);
    uniforms.power.value = quiet.current ? 1 : THREE.MathUtils.damp(uniforms.power.value, powerTarget, 22, Math.min(delta,.05));
    // Uniforms animate each frame; discover newly mounted materials at 4 Hz.
    if (t < nextMaterialScan.current) return;
    nextMaterialScan.current = t + .25;
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return;
      let board = false;
      for (let parent: THREE.Object3D | null = object; parent; parent = parent.parent) {
        if (parent.name.includes("open-frame card display")) board = true;
      }
      const line = object instanceof THREE.LineSegments;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => {
        // Text faces have explicit high-contrast day/night palettes. Leave
        // their lettering steady; only the frame and platform lights flicker.
        if (material.userData.steadyBoardText) return;
        if (!(material instanceof THREE.MeshBasicMaterial || material instanceof THREE.LineBasicMaterial) || patched.current.has(material)) return;
        const original = { compile: material.onBeforeCompile, key: material.customProgramCacheKey };
        const cacheKey = original.key.call(material);
        patched.current.set(material, original);
        material.onBeforeCompile = (shader, renderer) => {
          original.compile.call(material, shader, renderer);
          shader.uniforms.uNightMode = uniforms.night;
          shader.uniforms.uElectricPower = uniforms.power;
          shader.fragmentShader = "uniform float uNightMode;\nuniform float uElectricPower;\n" + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", `
            vec3 dayColor = outgoingLight;
            float blueEnergy = max(0.0, dayColor.b - dayColor.r * .75);
            float goldEnergy = max(0.0, min(dayColor.r, dayColor.g) - dayColor.b);
            vec3 neonColor = dayColor * .12 + vec3(.008,.018,.055);
            neonColor += vec3(.03,.72,1.0) * blueEnergy * 1.7 * uElectricPower;
            neonColor += vec3(1.0,.48,.055) * goldEnergy * uElectricPower;
            ${board ? "float ink = 1.0 - smoothstep(.025,.24,max(dayColor.r,max(dayColor.g,dayColor.b))); neonColor += vec3(.66,.91,1.0)*ink;" : ""}
            ${line ? "neonColor = vec3(.06,.8,1.0)*uElectricPower;" : ""}
            outgoingLight = mix(dayColor, neonColor, uNightMode);
            #include <opaque_fragment>
          `);
        };
        material.customProgramCacheKey = () => cacheKey + "-night-v1-" + board + line;
        material.needsUpdate = true;
      });
    });
  });
  return null;
}
