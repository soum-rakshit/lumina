"use client";

import { create } from "zustand";
import { updateTaskStatus } from "@/lib/actions";

type PendingChange = {
  taskId: string;
  dateStr: string;
  status: string;
  timestamp: number;
};

type StatusStore = {
  // Local overrides: taskId -> status (optimistic UI)
  localStatuses: Record<string, string>;
  // Queue of pending DB writes
  pendingChanges: PendingChange[];
  // Timer ID
  flushTimerId: ReturnType<typeof setInterval> | null;

  // Set a local status optimistically
  setStatus: (taskId: string, dateStr: string, status: string) => void;
  // Get the effective status for a task (local override or fallback)
  getStatus: (taskId: string, serverStatus?: string) => string;
  // Flush all pending changes to the server
  flush: () => Promise<void>;
  // Start the auto-flush interval
  startAutoFlush: () => void;
  // Stop the auto-flush interval
  stopAutoFlush: () => void;
  // Whether a flush is in progress
  isFlushing: boolean;
};

export const useStatusStore = create<StatusStore>((set, get) => ({
  localStatuses: {},
  pendingChanges: [],
  flushTimerId: null,
  isFlushing: false,

  setStatus: (taskId: string, dateStr: string, status: string) => {
    set((state) => {
      // Deduplicate: remove any existing pending change for this taskId+date
      const filtered = state.pendingChanges.filter(
        (c) => !(c.taskId === taskId && c.dateStr === dateStr)
      );
      return {
        localStatuses: { ...state.localStatuses, [taskId]: status },
        pendingChanges: [
          ...filtered,
          { taskId, dateStr, status, timestamp: Date.now() },
        ],
      };
    });
  },

  getStatus: (taskId: string, serverStatus?: string) => {
    const local = get().localStatuses[taskId];
    return local ?? serverStatus ?? "PENDING";
  },

  flush: async () => {
    const { pendingChanges, isFlushing } = get();
    if (isFlushing || pendingChanges.length === 0) return;

    set({ isFlushing: true });

    // Take a snapshot of current pending changes
    const toFlush = [...pendingChanges];
    // Clear the queue immediately so new changes during flush are queued fresh
    set({ pendingChanges: [] });

    try {
      // Send all changes in parallel
      await Promise.allSettled(
        toFlush.map((c) => updateTaskStatus(c.taskId, c.dateStr, c.status))
      );
      // Deliberately NOT clearing local overrides.
      // This prevents the UI from flickering back to stale server state
      // between the flush completing and the next data refetch.
      // The local status is the source of truth for the current session.
    } catch (e) {
      console.error("Flush failed, re-queueing:", e);
      // Re-queue failed changes
      set((state) => ({
        pendingChanges: [...toFlush, ...state.pendingChanges],
      }));
    } finally {
      set({ isFlushing: false });
    }
  },

  startAutoFlush: () => {
    const existing = get().flushTimerId;
    if (existing) return; // Already running

    const id = setInterval(() => {
      get().flush();
    }, 15_000); // Flush every 15 seconds

    set({ flushTimerId: id });

    // Also flush on page unload
    if (typeof window !== "undefined") {
      const handleBeforeUnload = () => {
        get().flush();
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      // Store cleanup ref (optional, not strictly needed for a singleton)
    }
  },

  stopAutoFlush: () => {
    const id = get().flushTimerId;
    if (id) {
      clearInterval(id);
      set({ flushTimerId: null });
    }
  },
}));
