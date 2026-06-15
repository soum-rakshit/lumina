"use client";

import React, { useEffect, useState } from "react";
import DailyLog from "@/components/DailyLog";
import { useDataStore } from "@/lib/dataStore";
import { useStatusStore } from "@/lib/statusStore";
import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";

export default function DashboardPage() {
  const { dashboardData, stats, loading, fetchGlobalData, planners } = useDataStore();
  const { flush } = useStatusStore();

  // Trigger initial load if not yet cached
  useEffect(() => {
    fetchGlobalData();

    // Flush pending writes and refresh on tab focus
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await flush();
        // Only refetch if cache is stale (>5min)
        fetchGlobalData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const isLoading = loading || !dashboardData;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading today&apos;s planner...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
          <div className="absolute top-2 right-2 opacity-10">
            <Zap className="w-16 h-16 text-indigo-500" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total XP</span>
          <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mt-1">
            {stats?.xp || 0}
          </p>
        </div>
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="absolute top-2 right-2 opacity-10">
            <Flame className="w-16 h-16 text-amber-500" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Streak</span>
          <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mt-1">
            {stats?.streakDays || 0} 🔥
          </p>
        </div>
      </motion.div>

      {/* Today's Tasks */}
      <DailyLog
        activeTasks={dashboardData?.activeTasks || []}
        logs={dashboardData?.logs || []}
        onStatusChange={() => {}}
      />
    </div>
  );
}
