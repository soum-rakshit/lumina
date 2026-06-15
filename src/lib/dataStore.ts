"use client";

import { create } from "zustand";
import { getPlanners, getTodayTasks, initUser } from "@/lib/actions";

type DataStore = {
  planners: unknown[] | null;
  stats: unknown | null;
  dashboardData: { activeTasks: unknown[]; logs: unknown[] } | null;
  lastFetch: number;
  loading: boolean;

  fetchGlobalData: (force?: boolean) => Promise<void>;
  updateStats: (newStats: unknown) => void;
};

export const useDataStore = create<DataStore>((set, get) => ({
  planners: null,
  stats: null,
  dashboardData: null,
  lastFetch: 0,
  loading: false,

  fetchGlobalData: async (force = false) => {
    const { lastFetch, loading } = get();
    if (loading) return;

    // Cache for 5 minutes unless forced
    if (!force && Date.now() - lastFetch < 300000) {
      return;
    }

    set({ loading: true });
    try {
      const todayStr = new Date().toISOString();
      // initUser returns user stats
      const [planners, dashboardData, stats] = await Promise.all([
        getPlanners(),
        getTodayTasks(todayStr),
        initUser(),
      ]);
      set({ planners: planners as unknown, dashboardData, stats, lastFetch: Date.now() });
    } catch (e) {
      console.error(e);
    } finally {
      set({ loading: false });
    }
  },

  updateStats: (newStats) => set({ stats: newStats }),
}));
