"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { isVideoMedia, mediaUrl } from "@/lib/config";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { GalleryItem } from "@/lib/types";

type AtlasSlice = HTMLImageElement | HTMLVideoElement;

type Atlas = {
  texture: THREE.CanvasTexture;
  tick: () => void;
  dispose: () => void;
};

const IMAGE_COUNT = 7;
const DEG_PER_SEC = 6.5;
const RAD_PER_SEC = (DEG_PER_SEC * Math.PI) / 180;
const DRAG_GAIN = 0.0048;
const PARALLAX_Y = 0.045;
const RESUME_PER_SEC = 2.4;
const AXIS_LOCK = 10;

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  sw: number,
  sh: number,
) {
  const ir = sw / sh;
  const cr = dw / dh;
  let sx = 0;
  let sy = 0;
  let tw = sw;
  let th = sh;
  if (ir > cr) {
    tw = sh * cr;
    sx = (sw - tw) / 2;
  } else {
    th = sw / cr;
    sy = (sh - th) / 2;
  }
  ctx.drawImage(img, sx, sy, tw, th, dx, dy, dw, dh);
}

function needsCors(src: string): boolean {
  return /^https?:/i.test(src) && !src.startsWith(window.location.origin);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (needsCors(src)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.preload = "auto";
    video.autoplay = true;
    if (needsCors(src)) video.crossOrigin = "anonymous";
    const ready = () => {
      video.play().catch(() => {});
      resolve(video);
    };
    video.addEventListener("loadeddata", ready, { once: true });
    video.onerror = () => reject(new Error(src));
    video.src = src;
    video.load();
  });
}

function sliceSize(slice: AtlasSlice): { w: number; h: number } {
  if (slice instanceof HTMLVideoElement) {
    return { w: slice.videoWidth, h: slice.videoHeight };
  }
  return { w: slice.naturalWidth, h: slice.naturalHeight };
}

function paintSlice(
  ctx: CanvasRenderingContext2D,
  slice: AtlasSlice,
  index: number,
  cellW: number,
  cellH: number,
) {
  const { w, h } = sliceSize(slice);
  if (!w || !h) return;
  try {
    drawCover(ctx, slice, index * cellW - 2, 0, cellW + 4, cellH, w, h);
  } catch {
    /* tainted / not ready */
  }
}

async function makeAtlas(items: GalleryItem[]): Promise<Atlas | null> {
  if (items.length === 0) return null;

  const unique: GalleryItem[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const src = mediaUrl(item.posterUrl || item.url);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    unique.push(item);
    if (unique.length >= IMAGE_COUNT) break;
  }

  const results = await Promise.all(
    unique.map(async (item) => {
      try {
        if (isVideoMedia(item) && item.posterUrl) {
          return await loadImage(mediaUrl(item.posterUrl));
        }
        if (isVideoMedia(item)) {
          return await loadVideo(mediaUrl(item.url));
        }
        return await loadImage(mediaUrl(item.url));
      } catch {
        return null;
      }
    }),
  );
  const loaded = results.filter((slice): slice is AtlasSlice => !!slice);
  if (loaded.length === 0) return null;

  const slices = loaded.slice(0, IMAGE_COUNT);
  const cellW = 540;
  const cellH = 500;
  const canvas = document.createElement("canvas");
  canvas.width = cellW * IMAGE_COUNT;
  canvas.height = cellH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#d4cfc4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  slices.forEach((slice, index) => paintSlice(ctx, slice, index, cellW, cellH));

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const videos = slices.filter((s): s is HTMLVideoElement => s instanceof HTMLVideoElement);

  return {
    texture,
    tick: () => {
      if (videos.length === 0) return;
      videos.forEach((video) => {
        const index = slices.indexOf(video);
        if (index < 0 || video.readyState < 2) return;
        paintSlice(ctx, video, index, cellW, cellH);
      });
      texture.needsUpdate = true;
    },
    dispose: () => {
      texture.dispose();
      for (const video of videos) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    },
  };
}

function CameraRig({
  radius,
  mobile,
}: {
  radius: number;
  mobile: boolean;
}) {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const z = radius + (mobile ? 4.2 : 5.55);
    const y = z * Math.tan(THREE.MathUtils.degToRad(10));
    const designFov = THREE.MathUtils.degToRad(mobile ? 19 : 20);
    const designAspect = 2.2;
    const hFov = 2 * Math.atan(Math.tan(designFov / 2) * designAspect);
    const aspect = size.width / Math.max(size.height, 1);
    cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hFov / 2) / aspect));
    cam.near = 0.05;
    cam.far = 120;
    cam.position.set(0, y, z);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, radius, mobile, size.width, size.height]);

  return null;
}

function RingMaterial({
  texture,
  side,
}: {
  texture: THREE.Texture | null;
  side: THREE.Side;
}) {
  return (
    <meshStandardMaterial
      map={texture ?? undefined}
      color={texture ? "#ffffff" : "#c9c4b8"}
      side={side}
      roughness={0.9}
      metalness={0}
      envMapIntensity={0.2}
      transparent={false}
      depthTest
      depthWrite
      polygonOffset={side === THREE.BackSide}
      polygonOffsetFactor={1}
      polygonOffsetUnits={1}
    />
  );
}

function CylinderBand({
  atlas,
  reduced,
}: {
  atlas: Atlas | null;
  reduced: boolean;
}) {
  const texture = atlas?.texture ?? null;
  const atlasRef = useRef(atlas);
  atlasRef.current = atlas;
  const ring = useRef<THREE.Group>(null);
  const parallax = useRef<THREE.Group>(null);
  const { size, gl } = useThree();
  const mobile = size.width < 768;
  const radius = mobile ? 1.42 : 1.48;
  const height = mobile ? 0.96 : 1.08;
  const spin = useRef(0);
  const dragging = useRef(false);
  const resume = useRef(1);
  const mouse = useRef({ x: 0, y: 0 });
  const geo = useMemo(
    () => new THREE.CylinderGeometry(radius, radius, height, 96, 1, true),
    [radius, height],
  );

  useLayoutEffect(() => {
    if (!texture) return;
    texture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture, gl]);

  useEffect(() => () => geo.dispose(), [geo]);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "pan-y";
    const start = { x: 0, y: 0 };
    let lastX = 0;
    let pointerId: number | null = null;
    let axis: "none" | "h" | "v" = "none";

    const finish = (id: number | null) => {
      pointerId = null;
      axis = "none";
      dragging.current = false;
      if (id !== null) {
        try {
          el.releasePointerCapture(id);
        } catch {
          /* already released */
        }
      }
    };

    const onDown = (e: PointerEvent) => {
      pointerId = e.pointerId;
      start.x = lastX = e.clientX;
      start.y = e.clientY;
      axis = "none";
      if (e.pointerType !== "touch" && e.button === 0) {
        axis = "h";
        dragging.current = true;
        resume.current = 0;
        el.setPointerCapture(e.pointerId);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !dragging.current) {
        const box = el.getBoundingClientRect();
        const nx = box.width > 0 ? ((e.clientX - box.left) / box.width) * 2 - 1 : 0;
        const ny = box.height > 0 ? ((e.clientY - box.top) / box.height) * 2 - 1 : 0;
        mouse.current.x = THREE.MathUtils.clamp(nx, -1, 1);
        mouse.current.y = THREE.MathUtils.clamp(ny, -1, 1);
      }
      if (pointerId !== e.pointerId) return;
      if (e.pointerType === "touch" && axis === "none") {
        const adx = Math.abs(e.clientX - start.x);
        const ady = Math.abs(e.clientY - start.y);
        if (adx < AXIS_LOCK && ady < AXIS_LOCK) return;
        axis = adx > ady ? "h" : "v";
        if (axis === "h") {
          dragging.current = true;
          resume.current = 0;
          lastX = e.clientX;
          try {
            el.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
        }
      }
      if (axis !== "h") return;
      spin.current += (e.clientX - lastX) * DRAG_GAIN;
      lastX = e.clientX;
      e.preventDefault();
    };

    const onUp = (e: PointerEvent) => {
      if (pointerId !== null && e.pointerId !== pointerId) return;
      finish(pointerId);
    };

    const onLeave = () => {
      if (!dragging.current) {
        mouse.current.x = 0;
        mouse.current.y = 0;
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove, { passive: false });
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("lostpointercapture", onUp);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("lostpointercapture", onUp);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [gl]);

  useFrame((_, dt) => {
    atlasRef.current?.tick();
    const step = Math.min(dt, 1 / 30);
    if (!dragging.current) {
      resume.current = Math.min(1, resume.current + RESUME_PER_SEC * step);
      spin.current += RAD_PER_SEC * step * resume.current;
    }
    if (ring.current) ring.current.rotation.y = spin.current;
    if (parallax.current) {
      parallax.current.rotation.x = 0;
      const wantY = reduced ? 0 : mouse.current.x * PARALLAX_Y;
      parallax.current.rotation.y = THREE.MathUtils.damp(
        parallax.current.rotation.y,
        wantY,
        3.2,
        step,
      );
    }
  });

  return (
    <>
      <CameraRig radius={radius} mobile={mobile} />
      <hemisphereLight args={["#f7f4ee", "#c8c2b6", 0.92]} />
      <ambientLight intensity={0.48} />
      <directionalLight position={[2.1, 2.8, 2.6]} intensity={0.62} color="#fffaf3" />
      <directionalLight position={[-1.8, 1.1, 1.4]} intensity={0.28} color="#f2eee6" />
      <directionalLight position={[0.4, 0.6, -2.2]} intensity={0.16} color="#ffffff" />
      <group ref={parallax}>
        <group ref={ring}>
          <mesh geometry={geo}>
            <RingMaterial key={`o-${texture?.uuid ?? "ph"}`} texture={texture} side={THREE.FrontSide} />
          </mesh>
          <mesh geometry={geo}>
            <RingMaterial key={`i-${texture?.uuid ?? "ph"}`} texture={texture} side={THREE.BackSide} />
          </mesh>
        </group>
      </group>
    </>
  );
}

export function CylinderGallery({
  items,
  className = "",
}: {
  items: GalleryItem[];
  className?: string;
  scrollLinked?: boolean;
}) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const key = useMemo(
    () => items.map((item) => `${item.type}:${item.url}`).join("|"),
    [items],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let current: Atlas | null = null;
    makeAtlas(items).then((next) => {
      if (cancelled) {
        next?.dispose();
        return;
      }
      current = next;
      setAtlas(next);
    });
    return () => {
      cancelled = true;
      current?.dispose();
      setAtlas(null);
    };
  }, [key]);

  if (!mounted) return <div className={`cyl-stage ${className}`} />;

  return (
    <div className={`cyl-stage ${className}`}>
      <Canvas
        frameloop="always"
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: "high-performance" }}
        dpr={[1, 1.75]}
        camera={{ fov: 20, near: 0.05, far: 120, position: [0, 1.24, 7.03] }}
        style={{ background: "transparent", touchAction: "pan-y" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.setClearAlpha(0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.28;
          gl.domElement.style.touchAction = "pan-y";
        }}
      >
        <CylinderBand atlas={atlas} reduced={reduced} />
      </Canvas>
    </div>
  );
}
