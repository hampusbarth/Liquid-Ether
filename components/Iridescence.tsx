"use client";

import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  color?: [number, number, number]; // RGB, 0..1
  mouseReact?: boolean;
  amplitude?: number;
  speed?: number;
};

export default function Iridescence({
  className,
  color = [1, 1, 1],
  mouseReact = false,
  amplitude = 0.1,
  speed = 1.0,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Renderer & canvas
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
      antialias: true,
    });
    const gl = renderer.gl;
    el.appendChild(gl.canvas);
    renderer.setSize(el.clientWidth, el.clientHeight);

    // Geometry + shader program
    const triangle = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(color[0], color[1], color[2]) },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
        uMouse: { value: [0, 0] },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(gl, { geometry: triangle, program });

    // Resize handler
    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };
    window.addEventListener("resize", resize);

    // Mouse (optional)
    const onMouseMove = (e: MouseEvent) => {
      program.uniforms.uMouse.value = [e.clientX, e.clientY];
    };
    if (mouseReact) window.addEventListener("mousemove", onMouseMove);

    // Render loop
    let raf = 0;
    const start = performance.now();
    const update = () => {
      program.uniforms.uTime.value = (performance.now() - start) / 1000;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(update);
    };
    update();

    // Cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (mouseReact) window.removeEventListener("mousemove", onMouseMove);
      try {
        el.removeChild(gl.canvas);
      } catch {}
      // @ts-ignore lose context if supported
      gl.getExtension?.("WEBGL_lose_context")?.loseContext?.();
    };
  }, [amplitude, speed, mouseReact, color]);

  return <div ref={containerRef} className={className} />;
}

// Minimal full-screen shader pair that gives a smooth “iridescent” feel.
// (ReactBits’ exact shader may differ; this one is TS-safe and works out of the box.)
const vertexShader = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec3  uColor;
uniform vec2  uResolution;
uniform vec2  uMouse;
uniform float uAmplitude;
uniform float uSpeed;
varying vec2  vUv;

// quick hash noise
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }

void main(){
  vec2 uv = vUv;
  vec2 st = (gl_FragCoord.xy / uResolution.xy);
  float t = uTime * uSpeed;

  // Thin-film interference-ish bands
  float bands = sin((uv.x + uv.y) * 16.0 + t) * 0.5 + 0.5;

  // subtle warp by mouse
  vec2 m = (uMouse / uResolution) - 0.5;
  uv += m * uAmplitude;

  // color mix
  vec3 base = uColor;
  vec3 hue  = vec3(0.6 + 0.4 * bands, 0.5 + 0.5 * (1.0-bands), 0.7);
  vec3 col  = mix(base * 0.6, hue, 0.8);

  // gentle grain
  col += hash(uv*50.0 + t) * 0.03;

  gl_FragColor = vec4(col, 1.0);
}
`;