"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  type Variants,
} from "framer-motion";
import { useRef, useState } from "react";

// A single background shape card that tilts subtly toward the cursor with a glassmorphism look
function ShapeCard() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-60, 60], [6, -6]);
  const rotateY = useTransform(x, [-60, 60], [-6, 6]);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothRotateX = useSpring(rotateX, springConfig);
  const smoothRotateY = useSpring(rotateY, springConfig);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: smoothRotateX,
        rotateY: smoothRotateY,
        transformPerspective: 800,
      }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-3xl bg-gradient-to-br from-white/80 via-white/40 to-white/10 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    />
  );
}

const BG_GRID = "grid grid-cols-4 grid-rows-3 gap-6";

// --- Animation choreography ---
const textVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const frameVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.94, rotateX: 10 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
  },
};

const columnVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.6 + i * 0.1,
    },
  }),
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.8 + i * 0.08,
    },
  }),
};

const COLUMNS = [
  {
    label: "Applied",
    count: 12,
    key: "applied",
    items: [
      {
        title: "Frontend Engineer",
        company: "Stripe",
        salary: "$160k",
        tag: "Remote",
      },
      {
        title: "UI/UX Designer",
        company: "Linear",
        salary: "$145k",
        tag: "Hybrid",
      },
    ],
  },
  {
    label: "Interviewing",
    count: 3,
    key: "interviewing",
    items: [
      {
        title: "Design Engineer",
        company: "Vercel",
        salary: "$180k",
        tag: "Remote",
      },
      { title: "Product Lead", company: "Airbnb", salary: "$210k", tag: "SF" },
    ],
  },
  {
    label: "Offer",
    count: 1,
    key: "offer",
    items: [
      {
        title: "Staff Developer",
        company: "Figma",
        salary: "$240k",
        tag: "Remote",
      },
      {
        title: "Senior Creator",
        company: "Apple",
        salary: "$220k",
        tag: "Cupertino",
      },
    ],
  },
];

export default function Hero() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 pt-24 pb-36 min-h-[820px] overflow-hidden selection:bg-brand-primary selection:text-white">
      {/* AMBIENT GLOWS — Creates top-tier studio lighting atmosphere */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-brand-primary/20 via-indigo-500/15 to-purple-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* BACKGROUND LAYER — Interactive tilting shape cards */}
      <div className={`absolute inset-0 ${BG_GRID} -z-20 opacity-55 p-4`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <ShapeCard key={i} />
        ))}
      </div>

      {/* NAV — Floating minimalist header */}
      <nav className="absolute top-8 right-8 z-30 flex items-center gap-6">
        <button className="text-sm font-medium text-brand-secondary/70 hover:text-brand-secondary transition-colors">
          Log In
        </button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="text-sm font-medium bg-brand-secondary text-white px-5 py-2.5 rounded-full shadow-lg shadow-brand-secondary/10 hover:bg-brand-primary transition-all duration-300"
        >
          Sign Up Free
        </motion.button>
      </nav>

      {/* CENTERED CONTENT COLUMN */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={textVariants}
          className="flex flex-col items-center max-w-2xl"
        >
          {/* Eyebrow badge */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 border border-brand-secondary/10 shadow-sm backdrop-blur-md mb-6 cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-brand-secondary/80 font-semibold">
              v2.4 Live Sync Active
            </span>
          </motion.div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-brand-secondary">
            Where careers find{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-indigo-600 to-purple-600">
              momentum
            </span>
            .
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-brand-secondary/60 leading-relaxed max-w-xl">
            Job hunting shouldn&apos;t mean losing track of where you applied,
            forgetting to follow up, or wondering if you&apos;re actually making
            progress.
          </p>
        </motion.div>

        {/* Dashboard Mockup - High fidelity window container with depth */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={frameVariants}
          style={{ transformPerspective: 1200 }}
          className="relative mt-16 w-full max-w-[680px] rounded-3xl border border-white/90 bg-white/90 backdrop-blur-2xl shadow-[0_30px_100px_-20px_rgba(28,28,30,0.18)] overflow-hidden"
        >
          {/* FLOATING NOTIFICATION BADGES (Interactive extra elements) */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute -left-12 top-24 hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-white shadow-xl px-4 py-2.5 rounded-2xl z-20 pointer-events-none"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm font-bold">
              ✨
            </span>
            <div className="text-left">
              <p className="text-xs font-semibold text-brand-secondary">
                Offer Received!
              </p>
              <p className="text-[10px] text-brand-secondary/50 font-mono">
                Figma • $240k TC
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="absolute -right-12 bottom-16 hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-white shadow-xl px-4 py-2.5 rounded-2xl z-20 pointer-events-none"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 text-sm font-bold">
              🚀
            </span>
            <div className="text-left">
              <p className="text-xs font-semibold text-brand-secondary">
                Interview Booked
              </p>
              <p className="text-[10px] text-brand-secondary/50 font-mono">
                Vercel • Tomorrow, 2 PM
              </p>
            </div>
          </motion.div>

          {/* Window Chrome */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-secondary/5 bg-brand-secondary/[0.01]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400/80 hover:opacity-100 transition-opacity cursor-pointer" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80 hover:opacity-100 transition-opacity cursor-pointer" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80 hover:opacity-100 transition-opacity cursor-pointer" />
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-secondary/[0.04] border border-brand-secondary/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] text-brand-secondary/60 font-medium">
                stackapply.app/workspace/active
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-brand-secondary/40">
              <span className="text-xs font-mono">⌘K</span>
            </div>
          </div>

          {/* Sub-toolbar filter switchers */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-brand-secondary/5 bg-white/40">
            <div className="flex items-center gap-2">
              {["all", "active", "archived"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs font-medium px-3 py-1 rounded-lg capitalize transition-all ${
                    activeTab === tab
                      ? "bg-brand-secondary text-white shadow-xs"
                      : "text-brand-secondary/60 hover:text-brand-secondary hover:bg-brand-secondary/5"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="text-[11px] font-mono text-brand-secondary/40">
              16 total applications tracked
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-3 gap-4 p-5 bg-gradient-to-b from-transparent to-brand-secondary/[0.02]">
            {COLUMNS.map((col, i) => (
              <motion.div
                key={col.label}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={columnVariants}
                className="flex flex-col gap-3 p-2.5 rounded-2xl bg-brand-secondary/[0.02] border border-brand-secondary/5"
              >
                <div className="flex items-center justify-between px-1.5 pt-1">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-brand-secondary/60 font-semibold">
                    {col.label}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                      col.key === "interviewing"
                        ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
                        : "bg-brand-secondary/8 text-brand-secondary/60"
                    }`}
                  >
                    {col.count}
                  </span>
                </div>

                {col.items.map((item, j) => (
                  <motion.div
                    key={j}
                    custom={j}
                    variants={cardVariants}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      col.key === "interviewing" && j === 0
                        ? "border-brand-primary/40 bg-white shadow-md shadow-brand-primary/5 ring-1 ring-brand-primary/10"
                        : "border-brand-secondary/8 bg-white/70 hover:bg-white shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-brand-secondary tracking-tight">
                        {item.title}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-brand-secondary/5 text-brand-secondary/60">
                        {item.tag}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-brand-secondary/60 font-medium">
                      <span>{item.company}</span>
                      <span className="font-mono text-emerald-600 font-semibold">
                        {item.salary}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
