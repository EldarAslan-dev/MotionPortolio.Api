"use client";

import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { useReducedMotion } from "@/lib/useReducedMotion";

export type Portfolio3DItem = {
  id: string | number;
  title?: string;
  image?: string;
  video?: string;
  category?: string;
  url?: string;
};

const ROTATION_SPEED = 0.1;
const CYLINDER_RADIUS = 3.2;
const CARD_WIDTH = 1.78;
const CARD_HEIGHT = 1.12;
const CAMERA_DISTANCE = 6.55;
const CAMERA_HEIGHT = 1.72;
const CAMERA_FOV = 30;
const MOUSE_SENSITIVITY = 0.22;
const TILT_X = -0.4;
const MIN_CARDS = 10;
const HOVER_SCALE = 1.06;
const MOBILE_RADIUS = 2.35;
const MOBILE_CARD_WIDTH = 1.42;
const MOBILE_CARD_HEIGHT = 0.9;
const MOBILE_CAMERA_DISTANCE = 5.35;

const _world = new THREE.Vector3();

function padItems(items: Portfolio3DItem[], min: number): Portfolio3DItem[] {
  if (items.length === 0) return [];
  const out = [...items];
  let i = 0;
  while (out.length < min) {
    out.push(items[i % items.length]);
    i += 1;
  }
  return out;
}

function useMediaTexture(image?: string, video?: string, allowVideo?: boolean) {
  const map = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    let disposed = false;
    let videoEl: HTMLVideoElement | null = null;

    const apply = (tex: THREE.Texture) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      map.current?.dispose();
      map.current = tex;
    };

    if (allowVideo && video) {
      videoEl = document.createElement("video");
      videoEl.src = video;
      videoEl.muted = true;
      videoEl.loop = true;
      videoEl.playsInline = true;
      videoEl.preload = "metadata";
      void videoEl.play().catch(() => undefined);
      apply(new THREE.VideoTexture(videoEl));
      return () => {
        disposed = true;
        videoEl?.pause();
        if (videoEl) videoEl.src = "";
        map.current?.dispose();
        map.current = null;
      };
    }

    if (!image) return;

    const img = new Image();
    const absolute = image.startsWith("http://") || image.startsWith("https://");
    if (absolute && typeof window !== "undefined" && !image.startsWith(window.location.origin)) {
      img.crossOrigin = "anonymous";
    }
    img.decoding = "async";
    img.onload = () => {
      const tex = new THREE.Texture(img);
      apply(tex);
    };
    img.src = image;

    return () => {
      disposed = true;
      img.onload = null;
      map.current?.dispose();
      map.current = null;
    };
  }, [image, video, allowVideo]);

  return map;
}

function ProjectPanel({
  item,
  angle,
  radius,
  width,
  height,
  allowVideo,
  hoverRef,
}: {
  item: Portfolio3DItem;
  angle: number;
  radius: number;
  width: number;
  height: number;
  allowVideo: boolean;
  hoverRef: MutableRefObject<boolean>;
}) {
  const router = useRouter();
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(1);
  const localHover = useRef(false);
  const textureRef = useMediaTexture(item.image, item.video, allowVideo);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (mat && mat.map !== textureRef.current) {
      mat.map = textureRef.current;
      mat.color.set("#ffffff");
      mat.needsUpdate = true;
    }
    if (mesh && mat) {
      mesh.getWorldPosition(_world);
      const fade = THREE.MathUtils.clamp((_world.z + radius * 0.35) / (radius * 1.45), 0.32, 1);
      mat.opacity = fade;
      mat.transparent = fade < 0.98;
      mat.depthWrite = fade > 0.55;
    }
    const target = localHover.current ? HOVER_SCALE : 1;
    scaleRef.current = THREE.MathUtils.damp(scaleRef.current, target, 7, delta);
    mesh?.scale.setScalar(scaleRef.current);
  });

  return (
    <mesh
      ref={meshRef}
      position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]}
      rotation={[0, angle, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        localHover.current = true;
        hoverRef.current = true;
      }}
      onPointerOut={() => {
        localHover.current = false;
        hoverRef.current = false;
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (item.url) router.push(item.url);
      }}
    >
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        ref={matRef}
        color="#ffffff"
        roughness={0.82}
        metalness={0.03}
        toneMapped
      />
    </mesh>
  );
}

function Ring({ items, reduced }: { items: Portfolio3DItem[]; reduced: boolean }) {
  const spinRef = useRef<THREE.Group>(null);
  const hoverRef = useRef(false);
  const auto = useRef(0);
  const scrollRef = useRef(0);
  const { camera, pointer, size } = useThree();
  const mobile = size.width < 640;
  const radius = mobile ? MOBILE_RADIUS : CYLINDER_RADIUS;
  const width = mobile ? MOBILE_CARD_WIDTH : CARD_WIDTH;
  const height = mobile ? MOBILE_CARD_HEIGHT : CARD_HEIGHT;
  const cards = useMemo(
    () => padItems(items, mobile ? 8 : MIN_CARDS),
    [items, mobile],
  );
  const count = Math.max(cards.length, 1);
  const allowVideo = !mobile && items.some((it) => Boolean(it.video) && !it.image);

  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame((_, delta) => {
    const spin = spinRef.current;
    if (!spin) return;
    const speed = reduced ? 0 : hoverRef.current ? ROTATION_SPEED * 0.2 : ROTATION_SPEED;
    auto.current += delta * speed;
    spin.rotation.y = auto.current + scrollRef.current * 0.00028;

    const cam = camera as THREE.PerspectiveCamera;
    const targetX = pointer.x * MOUSE_SENSITIVITY;
    const targetY = CAMERA_HEIGHT + pointer.y * MOUSE_SENSITIVITY * 0.32;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, targetX, 3.2, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, targetY, 3.2, delta);
    cam.position.z = mobile ? MOBILE_CAMERA_DISTANCE : CAMERA_DISTANCE;
    cam.lookAt(0, 0.12, 0);
  });

  return (
    <group rotation={[TILT_X, 0, 0]}>
      <group ref={spinRef}>
        {cards.map((item, i) => (
          <ProjectPanel
            key={`${item.id}-${i}`}
            item={item}
            angle={(i / count) * Math.PI * 2}
            radius={radius}
            width={width}
            height={height}
            allowVideo={allowVideo}
            hoverRef={hoverRef}
          />
        ))}
      </group>
    </group>
  );
}

function Lights() {
  const mobile = useThree((s) => s.size.width < 640);
  return (
    <>
      <ambientLight intensity={mobile ? 1.05 : 0.95} />
      <directionalLight position={[3.8, 5.6, 6.2]} intensity={mobile ? 0.62 : 0.8} />
      <directionalLight position={[-4.2, 1.4, 1.2]} intensity={0.22} />
    </>
  );
}

export function Portfolio3D({
  items,
  className = "",
}: {
  items: Portfolio3DItem[];
  className?: string;
}) {
  const reduced = useReducedMotion();
  const labeled = items.filter((item) => item.url);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div className="h-[230px] w-full touch-pan-y md:h-[360px] lg:h-[460px]">
        <Canvas
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          dpr={[1, 1.6]}
          camera={{
            fov: CAMERA_FOV,
            position: [0, CAMERA_HEIGHT, CAMERA_DISTANCE],
            near: 0.1,
            far: 40,
          }}
          resize={{ scroll: false }}
          aria-label="3D portfolio carousel"
        >
          <AdaptiveDpr />
          <Suspense fallback={null}>
            <Lights />
            <Ring items={items} reduced={reduced} />
          </Suspense>
        </Canvas>
      </div>
      {labeled.length > 0 ? (
        <nav className="sr-only" aria-label="Portfolio projects">
          {labeled.map((item) => (
            <a key={String(item.id)} href={item.url}>
              {item.title || "Project"}
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
