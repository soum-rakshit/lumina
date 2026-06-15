"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Pencil, X, ChevronDown, ChevronUp } from "lucide-react";
import { format, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useDataStore } from "@/lib/dataStore";

type Rule = {
  id: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  weekdays: number[];
};

type Task = {
  id: string;
  name: string;
  isCompulsory: boolean;
  rules: Rule[];
};

type SavedPlanner = {
  id: string;
  name: string;
  tasks: unknown[];
  startDate: string;
  endDate: string;
};

const WEEKDAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

// ─── Reusable Task Editor ────────────────────────────────────────
function TaskEditor({
  tasks,
  setTasks,
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const addTask = () => {
    setTasks([
      ...tasks,
      { id: Date.now().toString(), name: "", isCompulsory: true, rules: [] },
    ]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const addRule = (taskId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              rules: [
                ...t.rules,
                {
                  id: Date.now().toString(),
                  startDate: new Date(),
                  endDate: addDays(new Date(), 30),
                  weekdays: [1, 2, 3, 4, 5, 6],
                },
              ],
            }
          : t
      )
    );
  };

  const updateRule = (taskId: string, ruleId: string, updates: Partial<Rule>) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? { ...t, rules: t.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)) }
          : t
      )
    );
  };

  const removeRule = (taskId: string, ruleId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId ? { ...t, rules: t.rules.filter((r) => r.id !== ruleId) } : t
      )
    );
  };

  const toggleWeekday = (taskId: string, ruleId: string, dayValue: number, currentDays: number[]) => {
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter((d) => d !== dayValue)
      : [...currentDays, dayValue];
    updateRule(taskId, ruleId, { weekdays: newDays });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">📌 Tasks</h4>
        <button
          onClick={addTask}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Task
        </button>
      </div>

      {tasks.length === 0 && (
        <div className="p-5 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm">
          No tasks yet. Click &ldquo;Add Task&rdquo; to begin.
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-background overflow-hidden"
          >
            {/* Task Header */}
            <div className="flex items-center gap-3 p-3 border-b border-border/50">
              <span className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">
                {index + 1}
              </span>
              <input
                placeholder="Task Name (e.g. 1x GATE Video)"
                value={task.name}
                onChange={(e) => updateTask(task.id, { name: e.target.value })}
                className="flex-1 text-sm bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50"
              />
              <button
                onClick={() => removeTask(task.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Body */}
            <div className="p-3 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={task.isCompulsory}
                  onChange={(e) => updateTask(task.id, { isCompulsory: e.target.checked })}
                  className="w-3.5 h-3.5 rounded accent-indigo-600"
                />
                <span className="text-xs text-muted-foreground">Compulsory</span>
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Schedule Rules
                  </h5>
                  <button
                    onClick={() => addRule(task.id)}
                    className="text-[10px] text-indigo-600 hover:underline font-medium flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Rule
                  </button>
                </div>

                {task.rules.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/60 italic">
                    No rules — task won&apos;t appear in daily logs.
                  </p>
                )}

                {task.rules.map((rule, rIdx) => (
                  <div
                    key={rule.id}
                    className="bg-muted/30 p-2.5 rounded-lg border border-border/50 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Rule {rIdx + 1}
                      </span>
                      <button
                        onClick={() => removeRule(task.id, rule.id)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-0.5 block">Start</label>
                        <input
                          type="date"
                          value={rule.startDate ? format(rule.startDate, "yyyy-MM-dd") : ""}
                          onChange={(e) =>
                            updateRule(task.id, rule.id, {
                              startDate: e.target.value ? new Date(e.target.value) : undefined,
                            })
                          }
                          className="w-full px-2 py-1 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-0.5 block">End</label>
                        <input
                          type="date"
                          value={rule.endDate ? format(rule.endDate, "yyyy-MM-dd") : ""}
                          onChange={(e) =>
                            updateRule(task.id, rule.id, {
                              endDate: e.target.value ? new Date(e.target.value) : undefined,
                            })
                          }
                          className="w-full px-2 py-1 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-muted-foreground font-medium">Days</label>
                        <button
                          onClick={() =>
                            updateRule(task.id, rule.id, {
                              weekdays: rule.weekdays.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6],
                            })
                          }
                          className="text-[10px] text-indigo-600 hover:underline"
                        >
                          {rule.weekdays.length === 7 ? "Clear" : "All"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {WEEKDAYS.map((day) => {
                          const isSelected = rule.weekdays.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              onClick={() =>
                                toggleWeekday(task.id, rule.id, day.value, rule.weekdays)
                              }
                              className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-all ${
                                isSelected
                                  ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
                                  : "bg-transparent border-border text-muted-foreground hover:border-indigo-500/20"
                              }`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}

// ─── Helper: convert server planner data to editable tasks ───────
function plannerToEditableTasks(planner: SavedPlanner): Task[] {
  return planner.tasks.map((t: unknown) => ({
    id: t.id || Date.now().toString(),
    name: t.name,
    isCompulsory: t.isCompulsory,
    rules: (t.rules || []).map((r: unknown) => ({
      id: r.id || Date.now().toString(),
      startDate: r.startDate ? new Date(r.startDate) : undefined,
      endDate: r.endDate ? new Date(r.endDate) : undefined,
      weekdays: r.weekdays || [],
    })),
  }));
}

// ─── Main Component ──────────────────────────────────────────────
export default function PlannerForm() {
  // Create-new state
  const [plannerName, setPlannerName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [saving, setSaving] = useState(false);

  // Existing planners
  const { planners: savedPlanners, fetchGlobalData } = useDataStore();
  const loadingPlanners = !savedPlanners;

  // Preview state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTasks, setEditTasks] = useState<Task[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  // Toast
  const [successMessage, setSuccessMessage] = useState("");

  // Show/hide create form
  const [showCreate, setShowCreate] = useState(false);

  // Removed local fetchPlanners, using fetchGlobalData instead

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // ── Create ──
  const handleSave = async () => {
    if (!plannerName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/planners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: plannerName,
          tasks: tasks.map((t) => ({
            name: t.name,
            isCompulsory: t.isCompulsory,
            rules: t.rules.map((r) => ({
              startDate: r.startDate?.toISOString(),
              endDate: r.endDate?.toISOString(),
              weekdays: r.weekdays,
            })),
          })),
        }),
      });
      if (res.ok) {
        showToast("Planner created! 🎉");
        setPlannerName("");
        setTasks([]);
        setShowCreate(false);
        fetchGlobalData(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (plannerId: string) => {
    if (editingId === plannerId) {
      setEditingId(null);
    }
    try {
      const res = await fetch(`/api/planners?id=${plannerId}`, { method: "DELETE" });
      if (res.ok) {
        fetchGlobalData(true);
        showToast("Planner deleted! 🗑️");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── Edit: start ──
  const startEditing = (planner: unknown, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(null);
    setEditingId(planner.id);
    setEditName(planner.name);
    setEditTasks(plannerToEditableTasks(planner));
  };

  // ── Edit: cancel ──
  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditTasks([]);
  };

  // ── Edit: save ──
  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/planners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editName,
          tasks: editTasks.map((t) => ({
            name: t.name,
            isCompulsory: t.isCompulsory,
            rules: t.rules.map((r) => ({
              startDate: r.startDate?.toISOString(),
              endDate: r.endDate?.toISOString(),
              weekdays: r.weekdays,
            })),
          })),
        }),
      });
      if (res.ok) {
        showToast("Planner updated! ✅");
        setEditingId(null);
        fetchGlobalData(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-xl shadow-emerald-500/20"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Existing Planners ── */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">🎯 Your Goals</h2>

        {loadingPlanners ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : savedPlanners.length === 0 ? (
          <div className="flex flex-col items-center py-8 rounded-2xl border-2 border-dashed border-border bg-muted/20">
            <span className="text-4xl mb-2">📝</span>
            <p className="text-sm text-muted-foreground">No planners yet. Create one below!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedPlanners.map((planner, i) => {
              const isEditing = editingId === planner.id;

              return (
                <motion.div
                  key={planner.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                  className={`rounded-xl border overflow-hidden transition-all ${
                    isEditing
                      ? "border-indigo-500/40 bg-card shadow-lg shadow-indigo-500/10"
                      : "border-border bg-card hover:border-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/5"
                  }`}
                >
                  {/* Planner Row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => {
                      if (!isEditing) {
                        setExpandedId(expandedId === planner.id ? null : planner.id);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="font-semibold text-foreground truncate">{planner.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {planner.tasks.length} task{planner.tasks.length !== 1 ? "s" : ""} •{" "}
                        {format(new Date(planner.startDate), "MMM d")} →{" "}
                        {format(new Date(planner.endDate), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <button
                          onClick={cancelEditing}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={(e) => startEditing(planner, e)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(planner.id);
                            }}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Edit Panel (expanded) */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/50 p-4 space-y-4 bg-muted/10">
                          {/* Planner Name */}
                          <div>
                            <label className="text-xs text-muted-foreground font-medium mb-1 block">
                              Planner Name
                            </label>
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full text-sm py-2 px-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
                            />
                          </div>

                          {/* Tasks Editor */}
                          <TaskEditor tasks={editTasks} setTasks={setEditTasks} />

                          {/* Save / Cancel Buttons */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={handleUpdate}
                              disabled={editSaving || !editName.trim()}
                              className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                              {editSaving ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5" /> Save Changes
                                </>
                              )}
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Preview Panel */}
                  <AnimatePresence>
                    {expandedId === planner.id && !isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/50 p-4 bg-muted/5">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Tasks Overview
                          </h4>
                          {planner.tasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No tasks in this planner.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {planner.tasks.map((t: unknown, idx: number) => (
                                <div key={t.id} className="flex flex-col gap-1 text-sm p-3 rounded-lg bg-background border border-border/50">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                      {idx + 1}
                                    </span>
                                    <span className="font-medium truncate">{t.name}</span>
                                  </div>
                                  <div className="pl-7 text-xs text-muted-foreground">
                                    {t.isCompulsory ? "Compulsory" : "Optional"}
                                    {t.rules?.length > 0 && ` • ${t.rules.length} rule(s)`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create New ── */}
      <div>
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-3 rounded-xl border-2 border-dashed border-indigo-500/30 text-indigo-600 font-medium text-sm hover:bg-indigo-500/5 hover:border-indigo-500/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create New Planner
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-indigo-500/30 bg-card p-5 space-y-4 shadow-md shadow-indigo-500/5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">✨ New Planner</h3>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setPlannerName("");
                  setTasks([]);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              placeholder="Planner Name (e.g., Summer Gate Prep)"
              value={plannerName}
              onChange={(e) => setPlannerName(e.target.value)}
              className="w-full text-sm py-2.5 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder:text-muted-foreground/50"
            />

            <TaskEditor tasks={tasks} setTasks={setTasks} />

            <button
              onClick={handleSave}
              disabled={saving || !plannerName.trim()}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Planner
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
