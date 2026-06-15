"use client";

import React, { useMemo, useState } from "react";
import { format, eachDayOfInterval, subDays, startOfToday, getDay } from "date-fns";

type DayData = {
  date: Date;
  weight: number; // 0 to 1
};

export default function Heatmap({ data }: { data: DayData[] }) {
  const [hoveredDay, setHoveredDay] = useState<{ date: Date; weight: number; x: number; y: number } | null>(null);
  const today = startOfToday();

  const days = useMemo(() => {
    if (data && data.length > 0) return data;
    // Default: last 90 days with no data
    const pastDays = eachDayOfInterval({
      start: subDays(today, 89),
      end: today,
    });
    return pastDays.map((d) => ({
      date: d,
      weight: 0,
    }));
  }, [data, today]);

  const getColor = (weight: number) => {
    if (weight === 0) return "bg-slate-200/60 dark:bg-slate-800/60";
    if (weight > 0 && weight < 0.5) return "bg-indigo-300 dark:bg-indigo-800";
    if (weight >= 0.5 && weight < 1) return "bg-indigo-500 dark:bg-indigo-600";
    return "bg-violet-500 dark:bg-violet-500";
  };

  const getEmoji = (weight: number) => {
    if (weight === 0) return "😭";
    if (weight <= 0.25) return "🙂";
    if (weight <= 0.75) return "😇";
    return "🚀";
  };

  const handleMouseEnter = (day: DayData, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHoveredDay({
      date: day.date,
      weight: day.weight,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  return (
    <div className="w-full flex flex-col py-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          🗓️ Activity Heatmap
        </h3>
        <span className="text-xs text-muted-foreground">Last {days.length} days</span>
      </div>

      <div className="w-full overflow-x-auto pb-3 scrollbar-hide">
        <div className="grid grid-rows-7 grid-flow-col gap-[3px]" style={{ minWidth: "max-content" }}>
          {days.map((day, idx) => (
            <div
              key={idx}
              className={`w-[14px] h-[14px] rounded-[3px] ${getColor(day.weight)} transition-all duration-200 hover:ring-2 hover:ring-indigo-400/50 hover:scale-125 cursor-pointer`}
              onMouseEnter={(e) => handleMouseEnter(day, e)}
              onMouseLeave={() => setHoveredDay(null)}
            />
          ))}
        </div>
      </div>

      {/* Custom Tooltip */}
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
            <p className="font-medium">{format(hoveredDay.date, "MMM d, yyyy")}</p>
            <p className="text-muted-foreground">
              {hoveredDay.weight === 0
                ? "No activity"
                : `${Math.round(hoveredDay.weight * 100)}% complete`}{" "}
              {getEmoji(hoveredDay.weight)}
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-2 text-xs text-muted-foreground mt-1 px-1 items-center">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-slate-200/60 dark:bg-slate-800/60" />
        <div className="w-3 h-3 rounded-sm bg-indigo-300 dark:bg-indigo-800" />
        <div className="w-3 h-3 rounded-sm bg-indigo-500 dark:bg-indigo-600" />
        <div className="w-3 h-3 rounded-sm bg-violet-500 dark:bg-violet-500" />
        <span>More</span>
      </div>
    </div>
  );
}
