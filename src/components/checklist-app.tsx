"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  BarChart3,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Flame,
  LayoutList,
  Lock,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trophy,
} from "lucide-react";
import {
  createChecklist,
  formatDisplayDate,
  getChallengeStats,
  getTodayKey,
  matchesQuery,
  normalizeChecklist,
} from "@/src/lib/checklists";
import { getChecklists, saveChecklist } from "@/src/lib/indexed-db";
import { registerServiceWorker } from "@/src/lib/service-worker";
import type { Checklist } from "@/src/types";

type AppView = "dashboard" | "create" | "detail";
type NavSection = "Today" | "All Challenges" | "Archive" | "Stats" | "Settings";

const navItems: Array<{ label: NavSection; icon: typeof CalendarDays }> = [
  { label: "Today", icon: CalendarDays },
  { label: "All Challenges", icon: LayoutList },
  { label: "Archive", icon: Archive },
  { label: "Stats", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

const templates = [
  { title: "Drink 8 glasses of water", days: 14, icon: Sparkles },
  { title: "Read 20 minutes", days: 30, icon: Clock3 },
  { title: "No phone before bed", days: 21, icon: Moon },
  { title: "Walk after lunch", days: 10, icon: Target },
];

export function ChecklistApp() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<AppView>("dashboard");
  const [activeSection, setActiveSection] = useState<NavSection>("Today");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const todayKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    registerServiceWorker();

    getChecklists()
      .then((storedChecklists) => {
        setChecklists(sortChecklists(storedChecklists.map(normalizeChecklist)));
      })
      .catch(() => setStorageError("Local storage could not be opened."))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredChecklists = useMemo(() => {
    return sortChecklists(checklists)
      .filter((checklist) => {
        if (activeSection === "Archive") {
          return checklist.archived;
        }

        if (activeSection === "Today") {
          return !checklist.archived && getChallengeStats(checklist, todayKey).status !== "Upcoming";
        }

        return activeSection === "All Challenges" || activeSection === "Stats" || activeSection === "Settings";
      })
      .filter((checklist) => matchesQuery(checklist, query));
  }, [activeSection, checklists, query, todayKey]);

  const activeChallenges = checklists.filter((checklist) => !checklist.archived);
  const completedDays = checklists.reduce(
    (total, checklist) => total + getChallengeStats(checklist, todayKey).completed,
    0,
  );
  const totalDays = checklists.reduce(
    (total, checklist) => total + getChallengeStats(checklist, todayKey).durationDays,
    0,
  );
  const completionRate = totalDays === 0 ? 0 : Math.round((completedDays / totalDays) * 100);
  const bestStreak = checklists.reduce(
    (best, checklist) => Math.max(best, getChallengeStats(checklist, todayKey).currentStreak),
    0,
  );
  const selectedChecklist = checklists.find((checklist) => checklist.id === selectedId) ?? null;

  function persist(checklist: Checklist) {
    setStorageError(null);
    void saveChecklist(checklist).catch(() => setStorageError("Your latest change could not be saved locally."));
  }

  function addChallenge(title: string, durationDays: number, startDate = todayKey) {
    const checklist = createChecklist(title, startDate, durationDays);
    setChecklists((current) => sortChecklists([checklist, ...current]));
    persist(checklist);
    setSelectedId(checklist.id);
    setView("detail");
  }

  function createChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const startDate = String(formData.get("startDate") ?? todayKey);
    const durationDays = Number(formData.get("durationDays") ?? 30);

    if (title) {
      addChallenge(title, durationDays, startDate);
    }
  }

  return (
    <main className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-stone-50 text-stone-950 transition-colors duration-200 dark:bg-[#11100f] dark:text-stone-50">
        <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:gap-6 lg:px-8 lg:py-6">
          <aside className="rounded-[28px] border border-stone-200/80 bg-white/80 p-3 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] lg:sticky lg:top-6 lg:h-[calc(100vh-48px)] lg:w-72 lg:p-4">
            <div className="flex items-center justify-between gap-3 px-2 py-2 lg:flex-col lg:items-stretch">
              <button
                className="flex items-center gap-3 rounded-2xl px-1 py-1 text-left transition hover:scale-[1.01]"
                type="button"
                onClick={() => setView("dashboard")}
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                  <Check size={22} strokeWidth={3} />
                </span>
                <span>
                  <span className="block text-lg font-extrabold tracking-tight">Checklist</span>
                  <span className="hidden text-xs font-medium text-stone-500 dark:text-stone-400 sm:block">
                    Personal challenges
                  </span>
                </span>
              </button>

              <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300 lg:flex">
                <Lock className="mr-1.5" size={13} />
                Private on this device
              </div>
            </div>

            <nav className="mt-3 grid grid-cols-5 gap-1 lg:mt-8 lg:grid-cols-1" aria-label="Sections">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.label;

                return (
                  <button
                    className={`group flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold transition duration-200 lg:justify-start ${
                      isActive
                        ? "bg-stone-950 text-white shadow-soft dark:bg-white dark:text-stone-950"
                        : "text-stone-500 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.label);
                      setView("dashboard");
                    }}
                  >
                    <Icon size={18} />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <HeaderBar
              isDark={isDark}
              onCreate={() => setView("create")}
              onToggleTheme={() => setIsDark((current) => !current)}
            />

            {storageError ? (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                {storageError}
              </p>
            ) : null}

            {view === "dashboard" ? (
              <DashboardView
                activeChallenges={activeChallenges.length}
                bestStreak={bestStreak}
                checklists={filteredChecklists}
                completionRate={completionRate}
                isLoading={isLoading}
                query={query}
                todayKey={todayKey}
                totalChallenges={checklists.length}
                onCreate={() => setView("create")}
                onOpen={(id) => {
                  setSelectedId(id);
                  setView("detail");
                }}
                onQueryChange={setQuery}
                onTemplateCreate={(title, durationDays) => addChallenge(title, durationDays)}
              />
            ) : null}

            {view === "create" ? (
              <CreateChallengeView todayKey={todayKey} onBack={() => setView("dashboard")} onCreate={createChallenge} />
            ) : null}

            {view === "detail" && selectedChecklist ? (
              <ChallengePreview checklist={selectedChecklist} todayKey={todayKey} onBack={() => setView("dashboard")} />
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function HeaderBar({
  isDark,
  onCreate,
  onToggleTheme,
}: {
  isDark: boolean;
  onCreate: () => void;
  onToggleTheme: () => void;
}) {
  return (
    <header className="flex flex-col gap-3 rounded-[28px] border border-stone-200/80 bg-white/80 p-3 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
        <Lock size={14} />
        Private on this device
      </div>

      <div className="flex items-center gap-2">
        <button
          className="grid size-11 place-items-center rounded-2xl border border-stone-200 bg-white text-stone-600 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/10 dark:text-stone-200"
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <motion.button
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 sm:flex-none"
          type="button"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreate}
        >
          <Plus size={18} />
          New Challenge
        </motion.button>
      </div>
    </header>
  );
}

function DashboardView({
  activeChallenges,
  bestStreak,
  checklists,
  completionRate,
  isLoading,
  query,
  todayKey,
  totalChallenges,
  onCreate,
  onOpen,
  onQueryChange,
  onTemplateCreate,
}: {
  activeChallenges: number;
  bestStreak: number;
  checklists: Checklist[];
  completionRate: number;
  isLoading: boolean;
  query: string;
  todayKey: string;
  totalChallenges: number;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onQueryChange: (query: string) => void;
  onTemplateCreate: (title: string, durationDays: number) => void;
}) {
  const isEmpty = totalChallenges === 0;

  return (
    <div className="py-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
              <Sparkles size={14} />
              Today&apos;s focus
            </p>
            <h1 className="text-balance text-5xl font-black tracking-[-0.04em] text-stone-950 dark:text-white sm:text-6xl lg:text-7xl">
              A calmer way to keep promises to yourself.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-300 sm:text-lg">
              Track personal challenges without accounts, sync, or clutter. Every list stays fast,
              private, and available offline.
            </p>
          </div>

          <label className="relative block max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              className="h-14 w-full rounded-2xl border border-stone-200 bg-white pl-12 pr-4 text-sm font-semibold text-stone-950 shadow-sm transition placeholder:text-stone-400 hover:border-stone-300 focus:border-blue-400 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-stone-500"
              placeholder="Search challenges"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              aria-label="Search challenges"
            />
          </label>
        </div>

        <motion.aside
          className="rounded-[32px] border border-stone-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.06]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-stone-400">Week preview</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Momentum</h2>
            </div>
            <ShieldCheck className="text-blue-600" size={28} />
          </div>
          <div className="mt-6 grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, index) => (
              <div
                className={`grid aspect-square place-items-center rounded-2xl text-sm font-black ${
                  index === 3
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-stone-100 text-stone-400 dark:bg-white/10 dark:text-stone-500"
                }`}
                key={index}
              >
                {index === 3 ? <Check size={18} strokeWidth={3} /> : index + 1}
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-stone-500 dark:text-stone-400">
            Today is highlighted. Past and future days stay quiet until they matter.
          </p>
        </motion.aside>
      </section>

      <StatsStrip
        activeChallenges={activeChallenges}
        bestStreak={bestStreak}
        completionRate={completionRate}
        isEmpty={isEmpty}
      />

      {isLoading ? (
        <p className="mt-8 text-sm font-semibold text-stone-500">Loading your local challenges...</p>
      ) : null}

      {!isLoading && checklists.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {checklists.map((checklist, index) => (
            <ChallengeCard
              checklist={checklist}
              index={index}
              key={checklist.id}
              todayKey={todayKey}
              onOpen={() => onOpen(checklist.id)}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && checklists.length === 0 ? (
        <EmptyState onCreate={onCreate} onTemplateCreate={onTemplateCreate} />
      ) : null}
    </div>
  );
}

function StatsStrip({
  activeChallenges,
  bestStreak,
  completionRate,
  isEmpty,
}: {
  activeChallenges: number;
  bestStreak: number;
  completionRate: number;
  isEmpty: boolean;
}) {
  const stats = [
    { label: "Current Streak", value: `${bestStreak} days`, hint: "Build one day at a time", icon: Flame },
    { label: "Completion Rate", value: `${completionRate}%`, hint: "Your long-term average", icon: Trophy },
    { label: "Active Challenges", value: activeChallenges, hint: "Open commitments", icon: Target },
  ];

  return (
    <div className="mt-8 grid gap-3 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <motion.article
            className={`rounded-[24px] border p-5 transition ${
              isEmpty
                ? "border-stone-200 bg-white/55 text-stone-400 dark:border-white/10 dark:bg-white/[0.04]"
                : "border-stone-200 bg-white text-stone-950 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            }`}
            key={stat.label}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold">{stat.label}</span>
              <Icon size={18} />
            </div>
            <strong className="mt-5 block text-3xl font-black tracking-tight">{stat.value}</strong>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{stat.hint}</p>
          </motion.article>
        );
      })}
    </div>
  );
}

function EmptyState({
  onCreate,
  onTemplateCreate,
}: {
  onCreate: () => void;
  onTemplateCreate: (title: string, durationDays: number) => void;
}) {
  return (
    <section className="mt-8">
      <motion.div
        className="relative overflow-hidden rounded-[36px] border border-stone-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.06] sm:p-8 lg:p-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(37,99,235,0.14)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-blue-100 blur-3xl dark:bg-blue-500/20" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-extrabold text-stone-600 dark:bg-white/10 dark:text-stone-300">
              <CalendarDays size={14} />
              Empty for now
            </p>
            <h2 className="max-w-xl text-3xl font-black tracking-[-0.03em] sm:text-4xl">
              Choose one small promise and make it visible.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-300">
              Your dashboard will fill with focused challenge cards, streaks, and progress as soon
              as you create your first one.
            </p>
            <motion.button
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
              type="button"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreate}
            >
              <Plus size={18} />
              New Challenge
            </motion.button>
          </div>

          <div className="relative mx-auto h-64 w-full max-w-[320px]">
            <motion.div
              className="absolute left-8 top-6 h-44 w-56 rotate-[-7deg] rounded-[28px] border border-stone-200 bg-stone-50 p-5 shadow-soft dark:border-white/10 dark:bg-white/10"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="h-3 w-24 rounded-full bg-stone-300 dark:bg-white/20" />
              <div className="mt-6 space-y-3">
                {[0, 1, 2].map((item) => (
                  <div className="flex items-center gap-3" key={item}>
                    <span className="grid size-6 place-items-center rounded-lg bg-blue-600 text-white">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <span className="h-3 flex-1 rounded-full bg-stone-200 dark:bg-white/15" />
                  </div>
                ))}
              </div>
            </motion.div>
            <div className="absolute bottom-8 right-6 grid size-20 place-items-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <Sparkles size={34} />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-6">
        <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
          Suggested challenges
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {templates.map((template) => {
            const Icon = template.icon;

            return (
              <motion.button
                className="rounded-[24px] border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.06]"
                key={template.title}
                type="button"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTemplateCreate(template.title, template.days)}
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
                  <Icon size={20} />
                </span>
                <span className="mt-4 block font-black tracking-tight">{template.title}</span>
                <span className="mt-2 block text-sm font-semibold text-stone-500">{template.days} days</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ChallengeCard({
  checklist,
  index,
  todayKey,
  onOpen,
}: {
  checklist: Checklist;
  index: number;
  todayKey: string;
  onOpen: () => void;
}) {
  const stats = getChallengeStats(checklist, todayKey);

  return (
    <motion.button
      className="group rounded-[28px] border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-lift dark:border-white/10 dark:bg-white/[0.06]"
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
          {stats.status}
        </span>
        <span className="text-sm font-bold text-stone-400">Day {stats.currentDay || 1}</span>
      </div>
      <h3 className="mt-5 text-2xl font-black tracking-[-0.03em]">{checklist.title}</h3>
      <p className="mt-2 text-sm font-semibold text-stone-500">
        {stats.completed}/{stats.durationDays} completed · Started {formatDisplayDate(stats.startDate)}
      </p>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
        <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${stats.percent}%` }} />
      </div>
    </motion.button>
  );
}

function CreateChallengeView({
  todayKey,
  onBack,
  onCreate,
}: {
  todayKey: string;
  onBack: () => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="mx-auto grid w-full max-w-xl gap-5 py-10">
      <button
        className="inline-flex w-fit items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-extrabold transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.06]"
        type="button"
        onClick={onBack}
      >
        <ChevronLeft size={18} />
        Back
      </button>

      <form
        className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.06] sm:p-8"
        onSubmit={onCreate}
      >
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-blue-600">New challenge</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">Start with one clear commitment.</h1>

        <div className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm font-bold">
            Challenge Name
            <input
              autoFocus
              className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 font-semibold dark:border-white/10 dark:bg-white/10"
              name="title"
              placeholder="Read 20 minutes"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Start Date
            <input
              className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 font-semibold dark:border-white/10 dark:bg-white/10"
              defaultValue={todayKey}
              name="startDate"
              required
              type="date"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Duration (days)
            <input
              className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 font-semibold dark:border-white/10 dark:bg-white/10"
              defaultValue={30}
              min={1}
              name="durationDays"
              required
              type="number"
            />
          </label>
        </div>

        <button className="mt-6 h-12 w-full rounded-2xl bg-blue-600 font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700" type="submit">
          Create Challenge
        </button>
      </form>
    </section>
  );
}

function ChallengePreview({
  checklist,
  todayKey,
  onBack,
}: {
  checklist: Checklist;
  todayKey: string;
  onBack: () => void;
}) {
  const stats = getChallengeStats(checklist, todayKey);

  return (
    <section className="py-8">
      <button
        className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-extrabold transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.06]"
        type="button"
        onClick={onBack}
      >
        <ChevronLeft size={18} />
        Back
      </button>
      <div className="rounded-[36px] border border-stone-200 bg-white p-7 shadow-soft dark:border-white/10 dark:bg-white/[0.06] sm:p-10">
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
          {stats.status}
        </span>
        <h1 className="mt-5 text-balance text-5xl font-black tracking-[-0.05em] sm:text-6xl">{checklist.title}</h1>
        <p className="mt-4 text-lg font-semibold text-stone-500">
          Day {stats.currentDay || 1} of {stats.durationDays} · {stats.completed} completed
        </p>
        <div className="mt-8 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${stats.percent}%` }} />
        </div>
      </div>
    </section>
  );
}

function sortChecklists(checklists: Checklist[]) {
  return [...checklists].sort((a, b) => b.updatedAt - a.updatedAt);
}
