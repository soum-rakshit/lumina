"use client";

import React, { useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStatusStore } from "@/lib/statusStore";

export type ActiveTask = {
  id: string;
  name: string;
  isCompulsory: boolean;
  plannerName: string;
};

export type TaskLog = {
  id: string;
  taskId: string;
  date: string;
  status: string;
};

export default function DailyLog({
  activeTasks,
  logs,
  onStatusChange,
}: {
  activeTasks: ActiveTask[];
  logs: TaskLog[];
  onStatusChange: () => void;
}) {
  const { setStatus, getStatus, startAutoFlush } = useStatusStore();

  // Start auto-flush on mount
  useEffect(() => {
    startAutoFlush();
  }, [startAutoFlush]);

  const handleStatusChange = (taskId: string, newStatus: string) => {
    const todayStr = new Date().toISOString();
    setStatus(taskId, todayStr, newStatus);
  };

  const getServerStatus = (taskId: string) => {
    const log = logs.find((l) => l.taskId === taskId);
    return log?.status || "PENDING";
  };

  const completedCount = activeTasks.filter(
    (t) => getStatus(t.id, getServerStatus(t.id)) === "COMPLETED"
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">📋 Today&apos;s Checklist</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {completedCount}/{activeTasks.length} done
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {activeTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl border-2 border-dashed border-border bg-muted/30"
            >
              <span className="text-4xl mb-3">🎉</span>
              <p className="text-sm text-muted-foreground font-medium">No tasks scheduled for today!</p>
              <p className="text-xs text-muted-foreground mt-1">Create a planner to get started.</p>
            </motion.div>
          ) : (
            activeTasks.map((task, index) => {
              const serverStatus = getServerStatus(task.id);
              const status = getStatus(task.id, serverStatus);

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-xl border transition-all duration-200 ${
                    status === "COMPLETED"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : status === "SKIPPED"
                      ? "border-border bg-muted/20"
                      : status === "OVERDUE"
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Task Info */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          status === "COMPLETED"
                            ? "line-through text-muted-foreground"
                            : status === "SKIPPED"
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {task.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {task.plannerName}
                      {!task.isCompulsory && " • Optional"}
                    </span>
                  </div>

                  {/* Inline Action Buttons */}
                  <div className="flex border-t border-border/50">
                    <button
                      onClick={() => handleStatusChange(task.id, "COMPLETED")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all rounded-bl-xl ${
                        status === "COMPLETED"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Complete
                    </button>
                    <div className="w-px bg-border/50" />
                    <button
                      onClick={() => handleStatusChange(task.id, "SKIPPED")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${
                        status === "SKIPPED"
                          ? "bg-slate-500/15 text-slate-600 dark:text-slate-400"
                          : "text-muted-foreground hover:bg-slate-500/10 hover:text-slate-600"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Skip
                    </button>
                    <div className="w-px bg-border/50" />
                    <button
                      onClick={() => handleStatusChange(task.id, "OVERDUE")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all rounded-br-xl ${
                        status === "OVERDUE"
                          ? "bg-red-500/15 text-red-700 dark:text-red-400"
                          : "text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Overdue
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
