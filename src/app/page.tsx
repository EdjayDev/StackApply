"use client";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
  type Variants,
} from "framer-motion";
import { memo, useCallback, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Static data — module scope so it's never re-created on render
// ---------------------------------------------------------------------------

type ColumnKey = "applied" | "interviewing" | "offer";

type Card = {
  id: string;
  title: string;
  company: string;
  salary: string;
  tag: string;
};

const COLUMN_META: { key: ColumnKey; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "interviewing", label: "Interviewing" },
  { key: "offer", label: "Offer" },
];

const NEXT_COLUMN: Record<ColumnKey, ColumnKey> = {
  applied: "interviewing",
  interviewing: "offer",
  offer: "applied",
};

const INITIAL_CARDS: Record<ColumnKey, Card[]> = {
  applied: [
    { id: "c1", title: "Frontend Engineer", company: "Stripe", salary: "$160k", tag: "Remote" },
    { id: "c2", title: "UI/UX Designer", company: "Linear", salary: "$145k", tag: "Hybrid" },
  ],
  interviewing: [
    { id: "c3", title: "Design Engineer", company: "Vercel", salary: "$180k", tag: "Remote" },
    { id: "c4", title: "Product Lead", company: "Airbnb", salary: "$210k", tag: "SF" },
  ],
  offer: [
    { id: "c5", title: "Staff Developer", company: "Figma", salary: "$240k", tag: "Remote" },
    { id: "c6", title: "Senior Creator", company: "Apple", salary: "$220k", tag: "Cupertino" },
  ],
};

type FeatureTarget = ColumnKey | "toolbar" | "sync";

const FEATURES: {
  id: string;
  label: string;
  description: string;
  target: FeatureTarget;
}[] = [
  {
    id: "sync",
    label: "Live sync, always on",
    description:
      "Every update, from a new application to a status change, lands across your devices the moment it happens. No refresh, no stale board.",
    target: "sync",
  },
  {
    id: "filters",
    label: "Filters that actually filter",
    description:
      "Switch between All, Active, and Archived and the board narrows instantly, so a crowded pipeline never feels like clutter.",
    target: "toolbar",
  },
  {
    id: "applied",
    label: "Applied, at a glance",
    description:
      "Company, role, salary, and work mode sit right on the card. You'll never open a tab just to remember what you applied to.",
    target: "applied",
  },
  {
    id: "interviewing",
    label: "Tap a card to move it",
    description:
      "Click any card to advance it to the next stage. It's a stand-in for drag and drop, and it's just as satisfying.",
    target: "interviewing",
  },
  {
    id: "offer",
    label: "Offers, front and center",
    description:
      "The Offer column is where the whole board has been pointing. Comp is visible immediately, so comparisons take seconds.",
    target: "offer",
  },
];

const TABS = ["all", "active", "archived"] as const;
type Tab = (typeof TABS)[number];

const SHAPE_CARD_KEYS = Array.from({ length: 12 }, (_, i) => i);

// ---------------------------------------------------------------------------
// Animation choreography
// ---------------------------------------------------------------------------

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

const featureVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 + i * 0.1 },
  }),
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.8 + i * 0.08 },
  }),
};

const SPRING_CONFIG = { damping: 25, stiffness: 150 };

// ---------------------------------------------------------------------------
// ShapeCard — a single tilting background tile
// ---------------------------------------------------------------------------

const ShapeCard = memo(function ShapeCard() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-60, 60], [6, -6]);
  const rotateY = useTransform(x, [-60, 60], [-6, 6]);

  const smoothRotateX = useSpring(rotateX, SPRING_CONFIG);
  const smoothRotateY = useSpring(rotateY, SPRING_CONFIG);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      x.set(e.clientX - rect.left - rect.width / 2);
      y.set(e.clientY - rect.top - rect.height / 2);
    },
    [x, y],
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

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
});

// ---------------------------------------------------------------------------
// BackgroundLayer — ambient glow + tilting tile grid.
// Fully static (no props, no external state), memoized so that interactions
// elsewhere in Hero (tab switches, card drags, hover) never re-render or
// re-run the 12 spring/transform hooks living inside ShapeCard.
// ---------------------------------------------------------------------------

const BackgroundLayer = memo(function BackgroundLayer() {
  return (
    <>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-tr from-brand-primary/20 via-indigo-500/15 to-purple-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-6 -z-20 opacity-55 p-4">
        {SHAPE_CARD_KEYS.map((i) => (
          <ShapeCard key={i} />
        ))}
      </div>
    </>
  );
});

// ---------------------------------------------------------------------------
// Nav — static, memoized (no props, doesn't depend on Hero state)
// ---------------------------------------------------------------------------

const Nav = memo(function Nav() {
  return (
    <nav className="absolute top-8 right-8 z-30 flex items-center gap-6">
      <button type="button" className="text-sm font-medium text-brand-secondary/70 hover:text-brand-secondary transition-colors">
        Log In
      </button>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className="text-sm font-medium bg-brand-secondary text-white px-5 py-2.5 rounded-full shadow-lg shadow-brand-secondary/10 hover:bg-brand-primary transition-all duration-300"
      >
        Sign Up Free
      </motion.button>
    </nav>
  );
});

// ---------------------------------------------------------------------------
// IntroSection — static copy block, memoized since it never changes
// ---------------------------------------------------------------------------

const IntroSection = memo(function IntroSection() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={textVariants}
      className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto"
    >
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

      <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-brand-secondary">
        Where careers find{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-indigo-600 to-purple-600">
          momentum
        </span>
        .
      </h1>

      <p className="mt-6 text-lg text-brand-secondary/60 leading-relaxed">
        Job hunting shouldn&apos;t mean losing track of where you applied, forgetting to
        follow up, or wondering if you&apos;re actually making progress.
      </p>

      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="mt-8 text-sm font-semibold bg-brand-secondary text-white px-6 py-3 rounded-full shadow-lg shadow-brand-secondary/10 hover:bg-brand-primary transition-all duration-300"
      >
        Start tracking free
      </motion.button>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// FeatureRow — one entry in the left-hand feature list.
// Memoized: only the row(s) whose active state actually flips re-render,
// instead of all five re-rendering on every hover.
// ---------------------------------------------------------------------------

const FeatureRow = memo(function FeatureRow({
  index,
  label,
  description,
  target,
  isActive,
  onHover,
  onLeave,
}: {
  index: number;
  label: string;
  description: string;
  target: FeatureTarget;
  isActive: boolean;
  onHover: (target: FeatureTarget) => void;
  onLeave: () => void;
}) {
  return (
    <motion.li
      custom={index}
      variants={featureVariants}
      onMouseEnter={() => onHover(target)}
      onMouseLeave={onLeave}
      className="list-none"
    >
      <button
        type="button"
        onFocus={() => onHover(target)}
        onBlur={onLeave}
        className={`group w-full cursor-default text-left rounded-2xl px-4 py-3.5 border transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 ${
          isActive
            ? "bg-white border-brand-primary/30 shadow-md shadow-brand-primary/5"
            : "border-transparent hover:bg-white/60"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isActive ? "bg-brand-primary" : "bg-brand-secondary/20"
            }`}
          />
          <span className="text-sm font-semibold text-brand-secondary">{label}</span>
        </div>
        <p className="mt-1.5 pl-4 text-xs leading-relaxed text-brand-secondary/55">
          {description}
        </p>
      </button>
    </motion.li>
  );
});

// ---------------------------------------------------------------------------
// FeatureList — left column; owns nothing but forwards stable callbacks
// ---------------------------------------------------------------------------

const FeatureList = memo(function FeatureList({
  activeFeature,
  onHover,
  onLeave,
}: {
  activeFeature: FeatureTarget | null;
  onHover: (target: FeatureTarget) => void;
  onLeave: () => void;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={textVariants}
      className="flex flex-col items-start text-left"
    >
      <ul className="flex flex-col gap-1 w-full">
        {FEATURES.map((feature, i) => (
          <FeatureRow
            key={feature.id}
            index={i}
            label={feature.label}
            description={feature.description}
            target={feature.target}
            isActive={activeFeature === feature.target}
            onHover={onHover}
            onLeave={onLeave}
          />
        ))}
      </ul>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// TaskCard — a single kanban card
// ---------------------------------------------------------------------------

const TaskCard = memo(function TaskCard({
  card,
  index,
  columnKey,
  highlighted,
  onAdvance,
}: {
  card: Card;
  index: number;
  columnKey: ColumnKey;
  highlighted: boolean;
  onAdvance: (from: ColumnKey, id: string) => void;
}) {
  const handleClick = useCallback(() => {
    onAdvance(columnKey, card.id);
  }, [onAdvance, columnKey, card.id]);

  return (
    <motion.button
      type="button"
      layout
      layoutId={card.id}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={handleClick}
      whileHover={{ y: -3, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className={`group p-4 rounded-2xl border text-left transition-all cursor-pointer w-full ${
        highlighted
          ? "border-brand-primary/40 bg-white shadow-md shadow-brand-primary/5 ring-1 ring-brand-primary/10"
          : "border-brand-secondary/8 bg-white/70 hover:bg-white shadow-xs"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-brand-secondary tracking-tight">
          {card.title}
        </span>
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-brand-secondary/5 text-brand-secondary/60">
          {card.tag}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-brand-secondary/60 font-medium">
        <span>{card.company}</span>
        <span className="font-mono text-emerald-600 font-semibold">{card.salary}</span>
      </div>
      <span className="mt-2 block text-[10px] font-mono uppercase tracking-wide text-brand-primary/50 opacity-0 group-hover:opacity-100 transition-opacity">
        Tap to advance →
      </span>
    </motion.button>
  );
});

// ---------------------------------------------------------------------------
// KanbanColumn
// ---------------------------------------------------------------------------

const KanbanColumn = memo(function KanbanColumn({
  columnKey,
  label,
  cards,
  index,
  isHighlighted,
  onAdvance,
}: {
  columnKey: ColumnKey;
  label: string;
  cards: Card[];
  index: number;
  isHighlighted: boolean;
  onAdvance: (from: ColumnKey, id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex flex-col gap-3 p-3 rounded-2xl bg-brand-secondary/[0.02] border border-brand-secondary/5 transition-all ${
        isHighlighted ? "ring-2 ring-brand-primary/60 shadow-[0_0_0_6px_rgba(99,102,241,0.08)]" : ""
      }`}
    >
      <div className="flex items-center justify-between px-1.5 pt-1">
        <span className="font-mono text-[11px] uppercase tracking-wider text-brand-secondary/60 font-semibold">
          {label}
        </span>
        <span
          className={`font-mono text-[10px] font-semibold rounded-full px-2 py-0.5 ${
            columnKey === "interviewing"
              ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
              : "bg-brand-secondary/8 text-brand-secondary/60"
          }`}
        >
          {cards.length}
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {cards.map((card, j) => (
          <TaskCard
            key={card.id}
            card={card}
            index={j}
            columnKey={columnKey}
            highlighted={columnKey === "interviewing" && j === 0}
            onAdvance={onAdvance}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// DashboardMockup — the whole right-hand interactive panel
// ---------------------------------------------------------------------------

const DashboardMockup = memo(function DashboardMockup({
  activeTab,
  onTabChange,
  activeFeature,
  columns,
  visibleColumns,
  totalCount,
  onAdvance,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  activeFeature: FeatureTarget | null;
  columns: Record<ColumnKey, Card[]>;
  visibleColumns: { key: ColumnKey; label: string }[];
  totalCount: number;
  onAdvance: (from: ColumnKey, id: string) => void;
}) {
  const highlightClass = (target: FeatureTarget) =>
    activeFeature === target
      ? "ring-2 ring-brand-primary/60 shadow-[0_0_0_6px_rgba(99,102,241,0.08)]"
      : "";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={frameVariants}
      style={{ transformPerspective: 1200 }}
      className="relative w-full max-w-[980px]"
    >
      {/* Floating notification badges */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute -left-6 -top-6 hidden xl:flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-white shadow-xl px-4 py-2.5 rounded-2xl z-20 pointer-events-none -rotate-3"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm font-bold">
          ✨
        </span>
        <div className="text-left">
          <p className="text-xs font-semibold text-brand-secondary">Offer Received!</p>
          <p className="text-[10px] text-brand-secondary/50 font-mono">Figma • $240k TC</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute -right-6 -bottom-6 hidden xl:flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-white shadow-xl px-4 py-2.5 rounded-2xl z-20 pointer-events-none rotate-3"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 text-sm font-bold">
          🚀
        </span>
        <div className="text-left">
          <p className="text-xs font-semibold text-brand-secondary">Interview Booked</p>
          <p className="text-[10px] text-brand-secondary/50 font-mono">Vercel • Tomorrow, 2 PM</p>
        </div>
      </motion.div>

      <div className="relative rounded-3xl border border-white/90 bg-white/90 backdrop-blur-2xl shadow-[0_30px_100px_-20px_rgba(28,28,30,0.18)] overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-secondary/5 bg-brand-secondary/[0.01]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400/80 hover:opacity-100 transition-opacity cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-amber-400/80 hover:opacity-100 transition-opacity cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-emerald-400/80 hover:opacity-100 transition-opacity cursor-pointer" />
          </div>
          <div
            className={`flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-secondary/[0.04] border border-brand-secondary/5 transition-all ${highlightClass(
              "sync",
            )}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] text-brand-secondary/60 font-medium">
              stackapply.app/workspace/active
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-secondary/40">
            <span className="text-xs font-mono">⌘K</span>
          </div>
        </div>

        {/* Filter toolbar */}
        <div
          className={`flex items-center justify-between px-6 py-3.5 border-b border-brand-secondary/5 bg-white/40 transition-all ${highlightClass(
            "toolbar",
          )}`}
        >
          <div className="flex items-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                aria-pressed={activeTab === tab}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${
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
            {totalCount} total applications tracked
          </div>
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-6 bg-gradient-to-b from-transparent to-brand-secondary/[0.02] min-h-[360px]">
          <AnimatePresence mode="popLayout">
            {visibleColumns.map((col, i) => (
              <KanbanColumn
                key={col.key}
                columnKey={col.key}
                label={col.label}
                cards={columns[col.key]}
                index={i}
                isHighlighted={activeFeature === col.key}
                onAdvance={onAdvance}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// Hero — top-level component; owns the only state that actually changes
// ---------------------------------------------------------------------------

export default function Hero() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [columns, setColumns] = useState<Record<ColumnKey, Card[]>>(INITIAL_CARDS);
  const [activeFeature, setActiveFeature] = useState<FeatureTarget | null>(null);

  const totalCount = useMemo(
    () => Object.values(columns).reduce((sum, list) => sum + list.length, 0),
    [columns],
  );

  const visibleColumns = useMemo(() => {
    if (activeTab === "active") return COLUMN_META.filter((c) => c.key !== "offer");
    if (activeTab === "archived") return COLUMN_META.filter((c) => c.key === "offer");
    return COLUMN_META;
  }, [activeTab]);

  const advanceCard = useCallback((from: ColumnKey, id: string) => {
    setColumns((prev) => {
      const card = prev[from].find((c) => c.id === id);
      if (!card) return prev;
      const to = NEXT_COLUMN[from];
      return {
        ...prev,
        [from]: prev[from].filter((c) => c.id !== id),
        [to]: [card, ...prev[to]],
      };
    });
  }, []);

  const handleFeatureHover = useCallback((target: FeatureTarget) => {
    setActiveFeature(target);
  }, []);

  const handleFeatureLeave = useCallback(() => {
    setActiveFeature(null);
  }, []);

  return (
    <section className="relative w-full max-w-[1600px] mx-auto px-6 pt-24 pb-36 min-h-[900px] overflow-hidden selection:bg-brand-primary selection:text-white">
      <BackgroundLayer />
      <Nav />
      <IntroSection />

      <div className="relative z-10 mt-16 max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 items-center">
        <FeatureList
          activeFeature={activeFeature}
          onHover={handleFeatureHover}
          onLeave={handleFeatureLeave}
        />
        <DashboardMockup
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeFeature={activeFeature}
          columns={columns}
          visibleColumns={visibleColumns}
          totalCount={totalCount}
          onAdvance={advanceCard}
        />
      </div>
    </section>
  );
}
