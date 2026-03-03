import { motion, useReducedMotion } from "framer-motion";
import { Recycle } from "lucide-react";

/* ─── Static particle data (deterministic, no re-render cost) ─── */
const PARTICLES: Array<{
  id: number;
  left: string;
  size: number;
  dur: number;
  delay: number;
  opacity: number;
}> = [
  { id: 0,  left: "7%",  size: 5, dur: 12, delay: -1.2,  opacity: 0.10 },
  { id: 1,  left: "18%", size: 7, dur: 15, delay: -5.0,  opacity: 0.13 },
  { id: 2,  left: "29%", size: 4, dur: 11, delay: -8.5,  opacity: 0.09 },
  { id: 3,  left: "41%", size: 9, dur: 17, delay: -2.8,  opacity: 0.15 },
  { id: 4,  left: "53%", size: 5, dur: 13, delay: -11.0, opacity: 0.11 },
  { id: 5,  left: "64%", size: 6, dur: 16, delay: -6.7,  opacity: 0.14 },
  { id: 6,  left: "76%", size: 4, dur: 10, delay: -3.5,  opacity: 0.08 },
  { id: 7,  left: "87%", size: 8, dur: 14, delay: -9.2,  opacity: 0.12 },
  { id: 8,  left: "12%", size: 6, dur: 18, delay: -14.0, opacity: 0.10 },
  { id: 9,  left: "35%", size: 4, dur: 11, delay: -7.3,  opacity: 0.09 },
  { id: 10, left: "58%", size: 7, dur: 16, delay: -0.8,  opacity: 0.13 },
  { id: 11, left: "80%", size: 5, dur: 13, delay: -4.5,  opacity: 0.11 },
];

/* ─── Blob definitions ─────────────────────────────────────────── */
const BLOBS = [
  {
    id: 1,
    className: "absolute -left-20 -top-20 h-80 w-80",
    color: "hsl(142,70%,55%)",
    blur: "blur(80px)",
    animation: "blob-float-1 26s ease-in-out infinite",
    restOpacity: 0.20,
    hoverOpacity: 0.32,
  },
  {
    id: 2,
    className: "absolute -bottom-24 -left-4 h-96 w-96",
    color: "hsl(189,65%,55%)",
    blur: "blur(88px)",
    animation: "blob-float-2 32s ease-in-out infinite",
    restOpacity: 0.18,
    hoverOpacity: 0.28,
  },
  {
    id: 3,
    className: "absolute right-0 top-1/3 h-72 w-72",
    color: "hsl(162,60%,68%)",
    blur: "blur(72px)",
    animation: "blob-float-3 22s ease-in-out infinite",
    restOpacity: 0.16,
    hoverOpacity: 0.26,
  },
];

export default function AnimatedBrandPanel() {
  const prefersReduced = useReducedMotion();

  return (
    /* Panel root — class `auth-brand-panel` triggers the reduced-motion CSS rule */
    <motion.div
      className="auth-brand-panel group relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, hsl(142,60%,28%) 0%, hsl(162,55%,30%) 40%, hsl(189,50%,35%) 100%)",
      }}
      initial="rest"
      whileHover="hovered"
      animate="rest"
    >

      {/* ══ Layer A: Gradient shimmer sweep ══════════════════════════ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, transparent 0%, rgba(120,255,180,0.10) 35%, rgba(80,220,200,0.14) 55%, transparent 100%)",
          backgroundSize: "200% 200%",
          animation: "shimmer-pan 18s ease-in-out infinite",
          mixBlendMode: "soft-light",
          opacity: 0.7,
          willChange: "background-position",
        }}
      />

      {/* ══ Layer B: Floating blur blobs ═════════════════════════════ */}
      {BLOBS.map((b) => (
        <motion.div
          key={b.id}
          aria-hidden
          className={`${b.className} pointer-events-none rounded-full mix-blend-screen`}
          variants={{
            rest:    { opacity: b.restOpacity },
            hovered: { opacity: b.hoverOpacity },
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            background: b.color,
            filter: b.blur,
            animation: b.animation,
            willChange: "transform",
            transform: "translateZ(0)",
          }}
        />
      ))}

      {/* ══ Subtle watermark pattern ═════════════════════════════════ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='56' viewBox='0 0 56 56' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 6c0 0-14 10-14 22a14 14 0 0 0 28 0C42 16 28 6 28 6zm0 6c0 0-8 8-8 16a8 8 0 0 0 16 0c0-8-8-16-8-16z' fill='%23ffffff'/%3E%3C/svg%3E")`,
          backgroundSize: "56px 56px",
        }}
      />

      {/* ══ Layer C: Rising particle bubbles ═════════════════════════ */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-0 rounded-full bg-white"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animation: `particle-rise ${p.dur}s linear ${p.delay}s infinite`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>

      {/* ══ Brand content ════════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-10 text-center">

        {/* Radial ripple ring (behind logo) */}
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute h-36 w-36 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 45%, transparent 70%)",
              animation: "ripple-pulse 6s ease-in-out infinite",
              willChange: "transform, opacity",
            }}
          />

          {/* Logo mount animation wrapper (CSS spring-in) */}
          <div style={{ animation: "logo-spin-in 0.9s cubic-bezier(0.34,1.56,0.64,1) both" }}>
            {/* Logo: framer-motion float + hover rotate */}
            <motion.div
              className="flex h-16 w-16 cursor-default items-center justify-center rounded-2xl shadow-2xl"
              style={{
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(12px)",
                border: "1.5px solid rgba(255,255,255,0.35)",
                willChange: "transform",
              }}
              animate={prefersReduced ? {} : { y: [0, -5, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "loop",
              }}
              whileHover={{
                rotate: 5,
                transition: { type: "spring", stiffness: 280, damping: 14 },
              }}
            >
              <Recycle className="h-8 w-8 text-white drop-shadow" />
            </motion.div>
          </div>
        </div>

        {/* App name */}
        <div>
          <h1
            className="font-display text-4xl font-bold tracking-tight text-white"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.22)" }}
          >
            EcoCollect
          </h1>
          <p
            className="mt-2 text-sm font-medium leading-relaxed text-white/75"
            style={{ letterSpacing: "0.05em" }}
          >
            Nền tảng kết nối cộng đồng
            <br />
            vì môi trường xanh
          </p>
        </div>

        {/* Divider dots */}
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
          <span className="h-1.5 w-8 rounded-full bg-white/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {["Báo cáo rác thải", "Thu gom thông minh", "Tái chế hiệu quả"].map((label) => (
            <span
              key={label}
              className="rounded-full px-3 py-1 text-xs font-medium text-white/90"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.20)",
                backdropFilter: "blur(8px)",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom depth vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-40"
        style={{
          background: "linear-gradient(to top, hsl(189,50%,22%) 0%, transparent 100%)",
          opacity: 0.45,
        }}
      />
    </motion.div>
  );
}
