import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  Moon,
  Sun,
} from 'lucide-react';
import { apiGetPublic, apiPostPublic } from '../../lib/api';

interface WaitlistPageProps {
  onBackToHome: () => void;
  onSignIn: () => void;
  onRegister: () => void;
}

type ShaderPaletteKey = 'ember' | 'cobalt' | 'silver';

interface ShaderPalette {
  label: string;
  bg: string;
  glowA: string;
  glowB: string;
  low: [number, number, number];
  mid: [number, number, number];
  high: [number, number, number];
  peak: [number, number, number];
  logoGlow: string;
  logoRim: string;
  extrudeDeep: string;
  extrudeMid: string;
  extrudeBright: string;
  faceTint: string;
}

const SHADER_PALETTES: Record<ShaderPaletteKey, ShaderPalette> = {
  ember: {
    label: 'Ember',
    bg: '#050405',
    glowA: 'rgba(249, 115, 22, 0.22)',
    glowB: 'rgba(234, 88, 12, 0.10)',
    low: [34, 18, 12],
    mid: [186, 72, 20],
    high: [251, 146, 60],
    peak: [255, 245, 235],
    logoGlow: 'rgba(249, 115, 22, 0.36)',
    logoRim: 'rgba(253, 186, 116, 0.72)',
    extrudeDeep: '#2A1810',
    extrudeMid: '#7C4327',
    extrudeBright: '#D68B5C',
    faceTint: '#FFF7ED',
  },
  cobalt: {
    label: 'Cobalt',
    bg: '#04060A',
    glowA: 'rgba(59, 130, 246, 0.22)',
    glowB: 'rgba(99, 102, 241, 0.12)',
    low: [16, 24, 48],
    mid: [37, 99, 235],
    high: [125, 184, 255],
    peak: [240, 249, 255],
    logoGlow: 'rgba(59, 130, 246, 0.36)',
    logoRim: 'rgba(147, 197, 253, 0.72)',
    extrudeDeep: '#101B33',
    extrudeMid: '#2D5299',
    extrudeBright: '#80B3FF',
    faceTint: '#EFF6FF',
  },
  silver: {
    label: 'Silver',
    bg: '#050506',
    glowA: 'rgba(255, 255, 255, 0.13)',
    glowB: 'rgba(161, 161, 170, 0.07)',
    low: [28, 28, 32],
    mid: [110, 110, 118],
    high: [212, 212, 218],
    peak: [255, 255, 255],
    logoGlow: 'rgba(255, 255, 255, 0.22)',
    logoRim: 'rgba(255, 255, 255, 0.65)',
    extrudeDeep: '#18181B',
    extrudeMid: '#52525B',
    extrudeBright: '#A1A1AA',
    faceTint: '#FFFFFF',
  },
};

const WAITLIST_AVATARS = [
  {
    src: '/src/assets/images/waitlist_avatar_founder_1795775960980.jpg',
    alt: 'Ananya Rao, VP of Operations',
    initials: 'AR',
  },
  {
    src: '/src/assets/images/waitlist_avatar_director_1795775956413.jpg',
    alt: 'Daniel Keller, Operations Director',
    initials: 'DK',
  },
  {
    src: '/src/assets/images/waitlist_avatar_designer_1795775956238.jpg',
    alt: 'Mei Lin, Principal Systems Designer',
    initials: 'ML',
  },
  {
    src: '/src/assets/images/waitlist_avatar_engineer_1795775958069.jpg',
    alt: 'Marcus Cole, Staff Platform Engineer',
    initials: 'MC',
  },
];

const ASCII_RAMP = ' .·:;+=*#%@';

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  const c = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * c),
    Math.round(a[1] + (b[1] - a[1]) * c),
    Math.round(a[2] + (b[2] - a[2]) * c),
  ];
}

function samplePaletteColor(palette: ShaderPalette, intensity: number): string {
  const v = Math.max(0, Math.min(1, intensity));
  let rgb: [number, number, number];
  if (v < 0.45) {
    rgb = lerpColor(palette.low, palette.mid, v / 0.45);
  } else if (v < 0.8) {
    rgb = lerpColor(palette.mid, palette.high, (v - 0.45) / 0.35);
  } else {
    rgb = lerpColor(palette.high, palette.peak, (v - 0.8) / 0.2);
  }
  const alpha = (0.16 + v * 0.84).toFixed(2);
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

interface AsciiShaderCanvasProps {
  paletteKey: ShaderPaletteKey;
  pointerRef: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
}

const AsciiShaderCanvas: React.FC<AsciiShaderCanvasProps> = ({ paletteKey, pointerRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paletteRef = useRef<ShaderPalette>(SHADER_PALETTES[paletteKey]);

  useEffect(() => {
    paletteRef.current = SHADER_PALETTES[paletteKey];
  }, [paletteKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let startTime = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const cellW = 10;
    const cellH = 14;

    const renderFrame = (now: number) => {
      const t = prefersReducedMotion ? 1.8 : (now - startTime) * 0.00072;
      const palette = paletteRef.current;

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);

      if (width > 0 && height > 0) {
        const cols = Math.ceil(width / cellW);
        const rows = Math.ceil(height / cellH);
        const ptr = pointerRef.current;
        const px = ptr.active ? ptr.x : 0.5 + Math.cos(t * 0.65) * 0.15;
        const py = ptr.active ? ptr.y : 0.5 + Math.sin(t * 0.5) * 0.12;

        // Ambient glowing core underlay behind ASCII glyphs
        const cx = width * (0.5 + Math.sin(t * 0.4) * 0.08);
        const cy = height * (0.5 + Math.cos(t * 0.32) * 0.08);
        const radius = Math.max(width, height) * 0.56;
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.03, cx, cy, radius);
        grad.addColorStop(0, palette.glowA);
        grad.addColorStop(0.45, palette.glowB);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        const rampLen = ASCII_RAMP.length - 1;

        for (let r = 0; r < rows; r++) {
          const ny = (r + 0.5) / rows;
          const cyPos = r * cellH + cellH * 0.5;
          const dyCenter = ny - 0.5;

          for (let c = 0; c < cols; c++) {
            const nx = (c + 0.5) / cols;
            const dxCenter = (nx - 0.5) * (width / Math.max(height, 1));
            const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);

            // Smooth organic flowing aurora waves
            const w1 = Math.sin(nx * 5.6 + t * 1.3 + Math.cos(ny * 4.2 - t * 0.85));
            const w2 = Math.cos(ny * 5.2 - t * 1.05 + Math.sin(nx * 4.6 + t * 0.65));
            const w3 = Math.sin(distCenter * 8.2 - t * 1.85);

            // Pointer luminous wave boost
            const dxPtr = (nx - px) * (width / Math.max(height, 1));
            const dyPtr = ny - py;
            const distPtr = Math.sqrt(dxPtr * dxPtr + dyPtr * dyPtr);
            const ptrBoost = Math.exp(-distPtr * distPtr * 13) * (ptr.active ? 0.48 : 0.18);

            // Subtle halo framing the floating 3D logo
            const centerHalo = Math.exp(-distCenter * distCenter * 5.2) * 0.34;

            // Smooth edge vignette
            const vignette = Math.max(0, 1 - distCenter * 1.12);

            const rawField = (w1 * 0.36 + w2 * 0.34 + w3 * 0.3) * 0.5 + 0.5;
            const curvedField = Math.pow(rawField, 1.35);
            const intensity = Math.max(
              0,
              Math.min(1, curvedField * 0.66 * (0.3 + vignette * 0.7) + centerHalo + ptrBoost)
            );

            if (intensity < 0.16) continue;

            const glyphIdx = Math.min(rampLen, Math.floor(intensity * rampLen));
            const glyph = ASCII_RAMP[glyphIdx];
            if (glyph === ' ') continue;

            ctx.fillStyle = samplePaletteColor(palette, intensity);
            ctx.fillText(glyph, c * cellW + cellW * 0.5, cyPos);
          }
        }
      }

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [pointerRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full block pointer-events-none"
    />
  );
};

interface Interactive3DLogoProps {
  palette: ShaderPalette;
  stageRef: React.RefObject<HTMLDivElement | null>;
}

// Exact geometric paths reconstructed from the official FLOWSTATE 3-ribbon F logo (viewBox 80 110 360 296)
const FLOWSTATE_F_RIBBONS = [
  // Top flowing ribbon
  'M 252 132 H 419 L 399 180 C 391 198 375 207 354 207 H 248 C 198 207 166 232 145 274 L 132 296 L 171 194 C 186 154 214 132 252 132 Z',
  // Middle flowing ribbon
  'M 230 232 H 368 L 351 272 C 344 285 330 292 313 292 H 232 C 184 292 148 316 118 356 L 100 385 L 132 300 C 151 254 185 232 230 232 Z',
  // Bottom flowing ribbon
  'M 222 305 H 244 L 222 354 C 210 376 192 385 166 385 H 100 L 116 361 C 141 324 176 305 222 305 Z',
];

// 19 stacked Z-slices for solid sculpted 3D metallic extrusion of the F ribbons
const EXTRUSION_SLICES = Array.from({ length: 19 }, (_, idx) => idx - 9);

const Interactive3DLogo: React.FC<Interactive3DLogoProps> = ({ palette, stageRef }) => {
  const [rotation, setRotation] = useState({ x: 12, y: -22 });
  const targetRef = useRef({ x: 12, y: -22 });
  const currentRef = useRef({ x: 12, y: -22 });
  const dragRef = useRef<{ dragging: boolean; lastX: number; lastY: number; spinOffsetY: number }>({
    dragging: false,
    lastX: 0,
    lastY: 0,
    spinOffsetY: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - start) * 0.001;
      const idleX = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.85) * 6;
      const idleY = prefersReducedMotion ? 0 : Math.cos(elapsed * 0.65) * 9;

      const desiredX = targetRef.current.x + (dragRef.current.dragging ? 0 : idleX);
      const desiredY =
        targetRef.current.y + dragRef.current.spinOffsetY + (dragRef.current.dragging ? 0 : idleY);

      currentRef.current.x += (desiredX - currentRef.current.x) * 0.085;
      currentRef.current.y += (desiredY - currentRef.current.y) * 0.085;

      setRotation({
        x: Number(currentRef.current.x.toFixed(2)),
        y: Number(currentRef.current.y.toFixed(2)),
      });

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleMove = (e: PointerEvent) => {
      if (dragRef.current.dragging) {
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        targetRef.current.y += dx * 0.65;
        targetRef.current.x = Math.max(-48, Math.min(48, targetRef.current.x - dy * 0.55));
        return;
      }
      const rect = stage.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
      const ny = (e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
      targetRef.current.x = -ny * 30;
      targetRef.current.y = nx * 36;
    };

    const handleLeave = () => {
      if (!dragRef.current.dragging) {
        targetRef.current.x = 12;
        targetRef.current.y = -22;
      }
    };

    const handleUp = () => {
      if (dragRef.current.dragging) {
        dragRef.current.dragging = false;
        setIsDragging(false);
      }
    };

    stage.addEventListener('pointermove', handleMove);
    stage.addEventListener('pointerleave', handleLeave);
    window.addEventListener('pointerup', handleUp);

    return () => {
      stage.removeEventListener('pointermove', handleMove);
      stage.removeEventListener('pointerleave', handleLeave);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [stageRef]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragRef.current.dragging = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    setIsDragging(true);
  };

  const handleClickFlourish = () => {
    dragRef.current.spinOffsetY += 360;
  };

  // Dynamic specular highlight vector driven by live 3D orientation
  const lightX1 = Math.max(0, Math.min(100, 18 - rotation.y * 0.7));
  const lightY1 = Math.max(0, Math.min(100, 8 + rotation.x * 0.7));
  const lightX2 = Math.max(0, Math.min(100, 88 - rotation.y * 0.5));
  const lightY2 = Math.max(0, Math.min(100, 94 + rotation.x * 0.5));

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ perspective: '1100px' }}
    >
      {/* Soft ambient dark-to-glow backdrop halo directly behind the sculpted F */}
      <div
        aria-hidden="true"
        className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-500"
        style={{ background: palette.logoGlow }}
      />
      <div
        aria-hidden="true"
        className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full blur-2xl pointer-events-none bg-black/65"
      />

      {/* Floating 3D Sculpted FLOWSTATE F Mark (No Square Box Wrapper) */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onDoubleClick={handleClickFlourish}
        aria-label="Interactive 3D FLOWSTATE emblem - drag to rotate or double-click to spin"
        className={`relative w-52 h-44 sm:w-64 sm:h-56 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-2xl ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          willChange: 'transform',
        }}
      >
        {EXTRUSION_SLICES.map((sliceIdx) => {
          const z = sliceIdx * 1.5;
          const isFront = sliceIdx === 9;
          const isBack = sliceIdx === -9;

          if (!isFront && !isBack) {
            // Smooth anodized metallic shading across the extruded side wall depth
            const norm = (sliceIdx + 9) / 18; // 0 (back) -> 1 (front)
            const fillColor =
              norm > 0.78 || norm < 0.22
                ? palette.extrudeBright
                : norm > 0.45
                ? palette.extrudeMid
                : palette.extrudeDeep;

            return (
              <svg
                key={sliceIdx}
                viewBox="80 112 360 294"
                aria-hidden="true"
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                style={{ transform: `translateZ(${z}px)` }}
                fill="none"
              >
                {FLOWSTATE_F_RIBBONS.map((d, idx) => (
                  <path
                    key={idx}
                    d={d}
                    fill={fillColor}
                    stroke={palette.extrudeDeep}
                    strokeWidth="0.6"
                  />
                ))}
              </svg>
            );
          }

          const gradId = isFront ? 'fsChromeFront' : 'fsChromeBack';
          const sheenId = isFront ? 'fsSheenFront' : 'fsSheenBack';

          return (
            <svg
              key={sliceIdx}
              viewBox="80 112 360 294"
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              style={{
                transform: `translateZ(${z}px)`,
                filter: isFront ? 'drop-shadow(0 20px 36px rgba(0, 0, 0, 0.75))' : undefined,
              }}
              fill="none"
            >
              <defs>
                {/* Brushed Satin Titanium-Chrome Face */}
                <linearGradient
                  id={gradId}
                  x1={`${lightX1}%`}
                  y1={`${lightY1}%`}
                  x2={`${lightX2}%`}
                  y2={`${lightY2}%`}
                >
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="32%" stopColor={palette.faceTint} />
                  <stop offset="68%" stopColor="#D4D4D8" />
                  <stop offset="100%" stopColor="#71717A" />
                </linearGradient>

                {/* Dynamic Specular Sheen Band */}
                <linearGradient
                  id={sheenId}
                  x1={`${100 - lightX1}%`}
                  y1="0%"
                  x2={`${lightX1}%`}
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                  <stop offset="44%" stopColor="#FFFFFF" stopOpacity="0" />
                  <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.55" />
                  <stop offset="56%" stopColor="#FFFFFF" stopOpacity="0" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
              </defs>

              {FLOWSTATE_F_RIBBONS.map((d, idx) => (
                <g key={idx}>
                  <path
                    d={d}
                    fill={`url(#${gradId})`}
                    stroke={palette.logoRim}
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                  />
                  <path d={d} fill={`url(#${sheenId})`} />
                </g>
              ))}
            </svg>
          );
        })}
      </button>
    </div>
  );
};

interface AvatarStackItemProps {
  src: string;
  alt: string;
  initials: string;
  ringClass: string;
}

const AvatarStackItem: React.FC<AvatarStackItemProps> = ({ src, alt, initials, ringClass }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-label={alt}
        className={`w-8 h-8 rounded-full ring-2 ${ringClass} bg-[#262626] text-white text-[11px] font-semibold flex items-center justify-center shrink-0`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`w-8 h-8 rounded-full object-cover ring-2 ${ringClass} shrink-0`}
    />
  );
};

export const WaitlistPage: React.FC<WaitlistPageProps> = ({
  onBackToHome,
  onSignIn,
  onRegister,
}) => {
  const [surfaceTheme, setSurfaceTheme] = useState<'dark' | 'light'>('dark');
  const [paletteKey, setPaletteKey] = useState<ShaderPaletteKey>('ember');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(2418);
  const [enrollment, setEnrollment] = useState<{
    email: string;
    position: number;
    alreadyJoined: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0.5,
    y: 0.5,
    active: false,
  });

  useEffect(() => {
    let active = true;
    apiGetPublic<{ totalCount: number }>('/api/waitlist/stats')
      .then((res) => {
        if (active && typeof res.totalCount === 'number' && res.totalCount > 0) {
          setTotalCount(res.totalCount);
        }
      })
      .catch(() => {
        // Keep default count if offline
      });
    return () => {
      active = false;
    };
  }, []);

  const handleStagePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    pointerRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      active: true,
    };
  }, []);

  const handleStagePointerLeave = useCallback(() => {
    pointerRef.current.active = false;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setError('Enter a valid work or personal email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPostPublic<{
        entry: { email: string; position: number };
        alreadyJoined: boolean;
        totalCount: number;
      }>('/api/waitlist', {
        email: trimmed,
        source: 'waitlist_page',
      });
      setEnrollment({
        email: res.entry.email,
        position: res.entry.position,
        alreadyJoined: res.alreadyJoined,
      });
      if (typeof res.totalCount === 'number') {
        setTotalCount(res.totalCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join the waitlist right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyInvite = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/waitlist`
        : 'https://flowstate.app/waitlist';
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const isLight = surfaceTheme === 'light';
  const palette = SHADER_PALETTES[paletteKey];

  return (
    <div
      className={`min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 transition-colors duration-200 ${
        isLight
          ? 'bg-[#FAFAFA] text-[#111111] selection:bg-[#111111] selection:text-white'
          : 'bg-[#0A0A0A] text-white selection:bg-white selection:text-[#0A0A0A]'
      }`}
    >
      {/* Left Panel: Conversion-First Waitlist Column */}
      <section className="lg:col-span-6 flex flex-col justify-between px-6 sm:px-10 lg:px-14 xl:px-20 py-7 sm:py-9 min-h-[580px] lg:min-h-screen">
        {/* Top Row: Wordmark + Back / Theme Control */}
        <header className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-md cursor-pointer whitespace-nowrap shrink-0"
          >
            <img
              src="/icons/favicon_io/android-chrome-192x192.png"
              alt="FLOWSTATE"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-display font-bold text-base tracking-tight">FLOWSTATE</span>
          </button>

          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={onBackToHome}
              className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isLight
                  ? 'text-[#525252] hover:text-[#111111]'
                  : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to site</span>
            </button>

            <button
              type="button"
              onClick={() => setSurfaceTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'border-[#E5E5E5] bg-white text-[#525252] hover:text-[#111111] hover:border-[#D4D4D4]'
                  : 'border-white/10 bg-[#121212] text-[#A3A3A3] hover:text-white hover:border-white/25'
              }`}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Center Focal Block */}
        <main className="my-12 lg:my-auto py-4 max-w-[460px] w-full">
          {/* Clean Unboxed Kicker */}
          <div
            className={`flex items-center gap-2 text-xs font-medium mb-5 ${
              isLight ? 'text-[#737373]' : 'text-[#A3A3A3]'
            }`}
          >
            <span>Early Access</span>
            <span aria-hidden="true">·</span>
            <span>Enterprise Voice Automation</span>
          </div>

          <h1
            className="font-display font-bold tracking-[-0.035em] leading-[1.06] mb-4 [text-wrap:balance]"
            style={{ fontSize: 'clamp(2.25rem, 3.8vw, 3.35rem)' }}
          >
            Get early access to FLOWSTATE.
          </h1>

          <p
            className={`text-sm sm:text-[15px] leading-relaxed mb-8 max-w-[42ch] ${
              isLight ? 'text-[#525252]' : 'text-[#A3A3A3]'
            }`}
          >
            Join the priority rollout for dedicated organization workspaces, voice-driven runbooks,
            and human-in-the-loop governance.
          </p>

          {/* Waitlist Email Capture Form or Confirmed State */}
          {!enrollment ? (
            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              <div
                className={`p-1.5 rounded-xl border transition-colors flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 ${
                  isLight
                    ? 'bg-white border-[#E5E5E5] focus-within:border-[#111111]'
                    : 'bg-[#121212] border-white/15 focus-within:border-white/40'
                }`}
              >
                <label htmlFor="waitlist-email" className="sr-only">
                  Email address
                </label>
                <div className="relative flex-1 flex items-center">
                  <Mail
                    aria-hidden="true"
                    className={`w-4 h-4 absolute left-3.5 pointer-events-none ${
                      isLight ? 'text-[#737373]' : 'text-[#737373]'
                    }`}
                  />
                  <input
                    id="waitlist-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="name@company.com"
                    className={`w-full h-11 pl-10 pr-3 bg-transparent text-sm focus:outline-none ${
                      isLight
                        ? 'text-[#111111] placeholder:text-[#A3A3A3]'
                        : 'text-white placeholder:text-[#737373]'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`h-11 px-5 rounded-lg font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 ${
                    isLight
                      ? 'bg-[#111111] hover:bg-[#262626] text-white'
                      : 'bg-white hover:bg-[#E5E5E5] text-[#0A0A0A]'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Waitlist</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className={`flex items-center gap-2 text-xs ${
                    isLight ? 'text-red-700' : 'text-red-400'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          ) : (
            <div
              className={`rounded-xl border p-5 space-y-4 ${
                isLight
                  ? 'bg-white border-[#E5E5E5]'
                  : 'bg-[#121212] border-white/15'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2
                    className={`w-5 h-5 shrink-0 ${
                      isLight ? 'text-[#111111]' : 'text-white'
                    }`}
                  />
                  <div>
                    <h2 className="font-display text-sm font-bold">
                      {enrollment.alreadyJoined
                        ? "You're already on the waitlist"
                        : "You're on the waitlist"}
                    </h2>
                    <p
                      className={`text-xs mt-0.5 ${
                        isLight ? 'text-[#525252]' : 'text-[#A3A3A3]'
                      }`}
                    >
                      Reserved for <span className="font-medium">{enrollment.email}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-[11px] ${
                      isLight ? 'text-[#737373]' : 'text-[#737373]'
                    }`}
                  >
                    Queue spot
                  </div>
                  <div className="font-mono text-sm font-semibold tabular-nums">
                    #{enrollment.position.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className={`h-9 px-3.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    isLight
                      ? 'border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#F0F0F0] text-[#111111]'
                      : 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link copied' : 'Copy invite link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEnrollment(null);
                    setEmail('');
                    setError(null);
                  }}
                  className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isLight
                      ? 'text-[#525252] hover:text-[#111111]'
                      : 'text-[#A3A3A3] hover:text-white'
                  }`}
                >
                  Add another email
                </button>
              </div>
            </div>
          )}

          {/* Social Proof Avatar Group & Live Counter */}
          <div className="mt-7 flex items-center gap-3.5">
            <div className="flex items-center -space-x-2.5">
              {WAITLIST_AVATARS.map((person) => (
                <AvatarStackItem
                  key={person.alt}
                  src={person.src}
                  alt={person.alt}
                  initials={person.initials}
                  ringClass={isLight ? 'ring-[#FAFAFA]' : 'ring-[#0A0A0A]'}
                />
              ))}
            </div>
            <p
              className={`text-xs leading-snug ${
                isLight ? 'text-[#525252]' : 'text-[#A3A3A3]'
              }`}
            >
              <span
                className={`font-semibold tabular-nums ${
                  isLight ? 'text-[#111111]' : 'text-white'
                }`}
              >
                {totalCount.toLocaleString()}+
              </span>{' '}
              operations leaders joined
            </p>
          </div>
        </main>

        {/* Bottom Row: Quiet Footer Links & Social Icons */}
        <footer
          className={`pt-6 border-t flex flex-wrap items-center justify-between gap-4 text-xs ${
            isLight
              ? 'border-[#E5E5E5] text-[#737373]'
              : 'border-white/10 text-[#737373]'
          }`}
        >
          <div className="flex items-center gap-4">
            <span>© 2026 FLOWSTATE</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={onSignIn}
              className={`transition-colors cursor-pointer whitespace-nowrap ${
                isLight ? 'hover:text-[#111111]' : 'hover:text-white'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onRegister}
              className={`transition-colors cursor-pointer whitespace-nowrap ${
                isLight ? 'hover:text-[#111111]' : 'hover:text-white'
              }`}
            >
              Create workspace
            </button>
            <a
              href="mailto:hello@flowstate.ai"
              className={`transition-colors whitespace-nowrap ${
                isLight ? 'hover:text-[#111111]' : 'hover:text-white'
              }`}
            >
              Contact
            </a>
          </div>
        </footer>
      </section>

      {/* Right Panel: Glowing ASCII Shader + Custom Interactive 3D Logo */}
      <section className="lg:col-span-6 p-3 sm:p-4 lg:p-5 flex">
        <div
          ref={stageRef}
          onPointerMove={handleStagePointerMove}
          onPointerLeave={handleStagePointerLeave}
          className="relative flex-1 min-h-[420px] sm:min-h-[480px] lg:min-h-0 rounded-2xl overflow-hidden bg-[#060506] border border-white/10 flex flex-col justify-between p-6 sm:p-8 select-none"
        >
          {/* Procedural Glowing ASCII Shader Canvas */}
          <AsciiShaderCanvas paletteKey={paletteKey} pointerRef={pointerRef} />

          {/* Subtle Radial Depth Scrim */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, transparent 25%, rgba(0,0,0,0.58) 100%)',
            }}
          />

          {/* Top Quiet Label */}
          <div className="relative z-10 flex items-center justify-between text-xs text-white/60">
            <span className="font-mono tracking-tight">FLOWSTATE</span>
            <span className="tabular-nums">2026 Release</span>
          </div>

          {/* Center Interactive 3D Logo */}
          <div className="relative z-10 flex-1 flex items-center justify-center py-10">
            <Interactive3DLogo palette={palette} stageRef={stageRef} />
          </div>

          {/* Bottom Interactive Hint & Shader Lighting Switcher */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-white/55">Drag emblem to inspect</span>

            <div
              role="group"
              aria-label="Shader lighting preset"
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-black/55 backdrop-blur-md border border-white/10"
            >
              {(['ember', 'cobalt', 'silver'] as ShaderPaletteKey[]).map((key) => {
                const active = paletteKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPaletteKey(key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-[#0A0A0A]'
                        : 'text-white/65 hover:text-white'
                    }`}
                  >
                    {SHADER_PALETTES[key].label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
