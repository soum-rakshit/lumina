"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  getDay,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getTasksForMonth } from "@/lib/actions";
import { useStatusStore } from "@/lib/statusStore";

type PlannerData = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  tasks: {
    id: string;
    name: string;
    rules: { startDate: string; endDate: string; weekdays: number[] }[];
    logs: { date: string; status: string }[];
  }[];
};

function getEmoji(pct: number): string {
  if (pct === 0) return "😭";
  if (pct <= 0.25) return "🙂";
  if (pct <= 0.75) return "😇";
  return "🚀";
}

// Compute daily stats for a specific day
function computeDayStats(
  day: Date,
  planners: PlannerData[],
  filterPlannerId: string,
  localStatuses: Record<string, string> = {}
) {
  const dayOfWeek = getDay(day);
  let totalTasks = 0;
  let completedTasks = 0;
  const normalizedDay = format(day, "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isToday = normalizedDay === todayStr;

  const filteredPlanners =
    filterPlannerId === "all"
      ? planners
      : planners.filter((p) => p.id === filterPlannerId);

  for (const planner of filteredPlanners) {
    for (const task of planner.tasks) {
      const isActive = task.rules.some((rule) => {
        const ruleStartStr = format(new Date(rule.startDate), "yyyy-MM-dd");
        const ruleEndStr = format(new Date(rule.endDate), "yyyy-MM-dd");
        return (
          normalizedDay >= ruleStartStr &&
          normalizedDay <= ruleEndStr &&
          rule.weekdays.includes(dayOfWeek)
        );
      });

      if (isActive) {
        totalTasks++;
        const log = task.logs.find(
          (l) => format(new Date(l.date), "yyyy-MM-dd") === normalizedDay
        );
        const serverStatus = log?.status || "PENDING";
        const effectiveStatus = (isToday && localStatuses[task.id]) ? localStatuses[task.id] : serverStatus;

        if (effectiveStatus === "COMPLETED") {
          completedTasks++;
        }
      }
    }
  }

  return { totalTasks, completedTasks };
}

export function MonthCalendar({
  planners: initialPlanners,
  compact = false,
}: {
  planners?: PlannerData[];
  compact?: boolean;
}) {
  const today = new Date();
  const [currentMonth] = useState(today);
  const [filter, setFilter] = useState("all");
  const [planners, setPlanners] = useState<PlannerData[]>(initialPlanners || []);
  const [hoveredDay, setHoveredDay] = useState<{
    day: Date;
    total: number;
    completed: number;
    x: number;
    y: number;
  } | null>(null);
  const [loading, setLoading] = useState(!initialPlanners);
  const { localStatuses } = useStatusStore();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    if (!initialPlanners) {
      loadData();
    }
  }, []);

  // Update when planners prop changes
  useEffect(() => {
    if (initialPlanners) {
      setPlanners(initialPlanners);
    }
  }, [initialPlanners]);

  const loadData = async () => {
    try {
      const data = await getTasksForMonth(monthStart, monthEnd);
      setPlanners(data as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDayHover = (day: Date, e: React.MouseEvent) => {
    const stats = computeDayStats(day, planners, filter, localStatuses);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHoveredDay({
      day,
      total: stats.totalTasks,
      completed: stats.completedTasks,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-48 bg-muted/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${compact ? "text-xs" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
          📅 {format(currentMonth, "MMMM yyyy")}
        </h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
        >
          <option value="all">All Planners</option>
          {planners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-semibold text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}

        {/* Empty cells for first week offset */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {daysInMonth.map((day) => {
          const stats = computeDayStats(day, planners, filter, localStatuses);
          const hasTasks = stats.totalTasks > 0;
          const normalizedDay = format(day, "yyyy-MM-dd");
          const todayStr = format(today, "yyyy-MM-dd");
          const isToday = normalizedDay === todayStr;
          const isFuture = normalizedDay > todayStr;
          const showEmoji = hasTasks && !isFuture;
          const pct = hasTasks ? stats.completedTasks / stats.totalTasks : -1;

          return (
            <div
              key={day.toISOString()}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-150 ${
                isToday
                  ? "ring-2 ring-indigo-500/40 bg-indigo-500/10"
                  : "hover:bg-muted/60"
              }`}
              onMouseEnter={(e) => handleDayHover(day, e)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {showEmoji ? (
                <span className={compact ? "text-sm" : "text-base leading-none"}>
                  {getEmoji(pct)}
                </span>
              ) : (
                <span
                  className={`${compact ? "text-[10px]" : "text-xs"} ${
                    isToday
                      ? "font-bold text-indigo-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(day, "d")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: hoveredDay.x,
            top: hoveredDay.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-popover border border-border rounded-lg shadow-xl px-3 py-2 text-xs whitespace-nowrap">
            <p className="font-medium">{format(hoveredDay.day, "MMM d, yyyy")}</p>
            {hoveredDay.total > 0 ? (
              <p className="text-muted-foreground">
                {hoveredDay.completed}/{hoveredDay.total} tasks{" "}
                {getEmoji(hoveredDay.completed / hoveredDay.total)}
              </p>
            ) : (
              <p className="text-muted-foreground">No tasks scheduled</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Today Progress Slider ──────────────────────────────────────────
export function TodayProgressSlider({ planners }: { planners?: PlannerData[] }) {
  const [todayPct, setTodayPct] = useState(0);
  const { localStatuses } = useStatusStore();

  useEffect(() => {
    if (planners) {
      const s = computeDayStats(new Date(), planners, "all", localStatuses);
      setTodayPct(s.totalTasks > 0 ? s.completedTasks / s.totalTasks : 0);
    }
  }, [planners, localStatuses]);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Today&apos;s Progress
      </span>
      <div className="mt-2 w-full bg-secondary h-2.5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(todayPct * 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
        <span>{Math.round(todayPct * 100)}% complete</span>
        <span className="text-lg leading-none">{getEmoji(todayPct)}</span>
      </p>
    </div>
  );
}

// ─── Mobile Floating Emoji Button + Sliding Drawer ───────────────
export function MobileCalendarDrawer({
  planners,
}: {
  planners?: PlannerData[];
}) {
  const [open, setOpen] = useState(false);
  const [todayPct, setTodayPct] = useState(0);
  const { localStatuses } = useStatusStore();

  useEffect(() => {
    if (planners) {
      const s = computeDayStats(new Date(), planners, "all", localStatuses);
      setTodayPct(s.totalTasks > 0 ? s.completedTasks / s.totalTasks : 0);
    }
  }, [planners, localStatuses]);

  return (
    <>
      {/* Floating Emoji */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-lg hover:scale-110 transition-transform md:hidden"
        aria-label="Open calendar"
      >
        {getEmoji(todayPct)}
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-background border-l border-border shadow-2xl overflow-y-auto md:hidden"
            >
              <div className="p-4 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">📅 Calendar</h3>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Calendar */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <MonthCalendar planners={planners} compact />
                </div>

                {/* Today Progress */}
                <TodayProgressSlider planners={planners} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
