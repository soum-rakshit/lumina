/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import Heatmap from "@/components/Heatmap";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { motion } from "framer-motion";

export default function TimelineClient({ planners }: { planners: any[] }) {
  const heatmapData = useMemo(() => {
    const daysMap = new Map<string, { total: number; completed: number }>();
    planners.forEach((p) => {
      p.tasks.forEach((t: any) => {
        t.logs?.forEach((l: any) => {
          const dateStr = new Date(l.date).toISOString().split("T")[0];
          if (!daysMap.has(dateStr)) daysMap.set(dateStr, { total: 0, completed: 0 });
          const day = daysMap.get(dateStr)!;
          day.total += 1;
          if (l.status === "COMPLETED") day.completed += 1;
        });
      });
    });

    return Array.from(daysMap.entries())
      .map(([dateStr, stats]) => ({
        date: new Date(dateStr),
        weight: stats.total > 0 ? stats.completed / stats.total : 0,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [planners]);

  const COLORS = ["#6366f1", "#e2e8f0"];

  return (
    <div className="space-y-6">
      {/* Pie Charts */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          📊 Goal Progress
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {planners.map((p, i) => {
            let logsTotal = 0;
            let logsCompleted = 0;
            p.tasks.forEach((t: any) => {
              t.logs?.forEach((l: any) => {
                logsTotal += 1;
                if (l.status === "COMPLETED") logsCompleted += 1;
              });
            });

            if (logsTotal === 0) logsTotal = 1;

            const data = [
              { name: "Completed", value: logsCompleted },
              { name: "Remaining", value: logsTotal - logsCompleted },
            ];

            const pct = Math.round((logsCompleted / logsTotal) * 100);

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-5 flex flex-col items-center hover:border-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/5 transition-all"
              >
                <h4 className="font-semibold text-sm mb-1">{p.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {logsCompleted}/{logsTotal} tasks logged
                </p>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {data.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            className="drop-shadow-sm"
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid var(--border)",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  {pct}%
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>


      {/* Heatmap */}
      <div className="rounded-xl border border-border bg-card p-5">
        <Heatmap data={heatmapData} />
      </div>
    </div>
  );
}
