import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TaskItem, ExtraTaskItem } from "@/components/DailyLog";

export type PlannerStoreState = {
  // We mock the seed planner state here for the frontend prototype
  tasks: TaskItem[];
  extraTasks: ExtraTaskItem[];
  dailyWeights: Record<string, number>; // key: YYYY-MM-DD
  toggleTask: (id: string, completed: boolean) => void;
  addExtraTask: (name: string, type: "GATE" | "DSA") => void;
  getTodayWeight: () => number;
};

// Seed logic based on prompt
const generateSeedTasks = (): TaskItem[] => {
  const day = new Date().getDay(); // 0 is Sunday
  if (day === 0) {
    // Sunday
    return [
      { id: "g1", name: "1x GATE Video", isCompulsory: true, completed: false },
      { id: "d1", name: "1x TUF DSA Video", isCompulsory: true, completed: false },
      { id: "l1", name: "1x Leetcode DSA", isCompulsory: false, completed: false },
      { id: "dev1", name: "Development", isCompulsory: false, completed: false },
    ];
  } else {
    // Mon-Sat
    return [
      { id: "g1", name: "GATE Video 1", isCompulsory: true, completed: false },
      { id: "g2", name: "GATE Video 2", isCompulsory: true, completed: false },
      { id: "g3", name: "GATE Video 3", isCompulsory: true, completed: false },
      { id: "d1", name: "1x TUF DSA Video", isCompulsory: true, completed: false },
      { id: "l1", name: "1x Leetcode DSA", isCompulsory: false, completed: false },
      { id: "dev1", name: "30 mins Development", isCompulsory: false, completed: false },
    ];
  }
};

export const usePlannerStore = create<PlannerStoreState>()(
  persist(
    (set, get) => ({
      tasks: generateSeedTasks(),
      extraTasks: [],
      dailyWeights: {},

      toggleTask: (id, completed) => {
        set((state) => {
          const updatedTasks = state.tasks.map((t) =>
            t.id === id ? { ...t, completed } : t
          );
          return { tasks: updatedTasks };
        });
        // Recalculate weight immediately
        // Weight = Completed Compulsory / Total Compulsory + Extra Weights
      },

      addExtraTask: (name, type) => {
        const id = `extra-${Date.now()}`;
        set((state) => ({
          extraTasks: [...state.extraTasks, { id, name }],
        }));
      },

      getTodayWeight: () => {
        const { tasks, extraTasks } = get();
        const compulsory = tasks.filter((t) => t.isCompulsory);
        const completedCompulsory = compulsory.filter((t) => t.completed).length;
        
        let weight = compulsory.length > 0 ? completedCompulsory / compulsory.length : 0;
        
        // Add extra weight for optional/extra credit tasks
        const completedOptionals = tasks.filter((t) => !t.isCompulsory && t.completed).length;
        weight += completedOptionals * 0.1; // Baseline optional boost
        weight += extraTasks.length * 0.2;  // Ad-hoc extra task boost

        return weight;
      },
    }),
    {
      name: "lumina-planner-storage",
    }
  )
);
