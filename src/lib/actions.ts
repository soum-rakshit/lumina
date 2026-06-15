"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { redirect } from "next/navigation";

export async function initUser() {
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user) {
    redirect("/sign-in");
  }
  
  const email = user.emailAddresses[0]?.emailAddress;
  
  const dbUser = await db.user.upsert({
    where: { id: userId },
    update: { email },
    create: { id: userId, email },
  });

  // Seed Gate Planner if email matches and it doesn't exist
  if (email === "soumyadeep280@gmail.com") {
    const existingGatePlanner = await db.planner.findFirst({
      where: { userId, name: "Gate Planner" }
    });

    if (!existingGatePlanner) {
      const startDate = new Date();
      const endDate = addDays(startDate, 180);
      
      const planner = await db.planner.create({
        data: {
          userId,
          name: "Gate Planner",
          startDate,
          endDate,
          tasks: {
            create: [
              {
                name: "1x GATE Video",
                isCompulsory: true,
                rules: {
                  create: [
                    { startDate, endDate, weekdays: [1, 2, 3, 4, 5, 6] }
                  ]
                }
              },
              {
                name: "1x TUF DSA Video",
                isCompulsory: true,
                rules: {
                  create: [
                    { startDate, endDate, weekdays: [0, 1, 2, 3, 4, 5, 6] }
                  ]
                }
              },
              {
                name: "1x Leetcode DSA",
                isCompulsory: false,
                rules: {
                  create: [
                    { startDate, endDate, weekdays: [0, 1, 2, 3, 4, 5, 6] }
                  ]
                }
              }
            ]
          }
        }
      });
    }
  }

  return dbUser;
}

export async function getUserStats() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId }, select: { xp: true, streakDays: true, lastCompletedDate: true } });
}

export async function getPlanners() {
  const { userId } = await auth();
  if (!userId) return [];
  return db.planner.findMany({
    where: { userId },
    include: {
      tasks: {
        include: { rules: true, logs: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
}

// For Timeline & Sidebar, we need tasks evaluated for the current month
export async function getTasksForMonth(monthStart: Date, monthEnd: Date) {
  const { userId } = await auth();
  if (!userId) return [];
  
  const planners = await db.planner.findMany({
    where: { userId },
    include: {
      tasks: {
        include: { rules: true, logs: { where: { date: { gte: monthStart, lte: monthEnd } } } }
      }
    }
  });

  return planners;
}

// Today's specific tasks
export async function getTodayTasks(targetDateStr: string) {
  const { userId } = await auth();
  if (!userId) return { activeTasks: [], logs: [] };

  const targetDate = new Date(targetDateStr);
  const targetDay = targetDate.getDay();

  const planners = await db.planner.findMany({
    where: { userId, startDate: { lte: targetDate }, endDate: { gte: targetDate } },
    include: {
      tasks: {
        include: {
          rules: true,
          logs: {
            where: { date: targetDate }
          }
        }
      }
    }
  });

  let activeTasks: any[] = [];
  let logs: any[] = [];
  for (const planner of planners) {
    for (const task of planner.tasks) {
      const hasValidRule = task.rules.some(rule => 
        rule.startDate <= targetDate && 
        rule.endDate >= targetDate && 
        rule.weekdays.includes(targetDay)
      );
      if (hasValidRule) {
        activeTasks.push({ ...task, plannerName: planner.name });
        if (task.logs.length > 0) {
          logs.push(...task.logs);
        }
      }
    }
  }

  return { activeTasks, logs };
}

export async function updateTaskStatus(taskId: string, dateStr: string, status: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const date = new Date(dateStr);

  // Check previous status before updating
  const existingLog = await db.dailyLog.findUnique({
    where: { taskId_date: { taskId, date } },
  });
  const previousStatus = existingLog?.status || "PENDING";

  const log = await db.dailyLog.upsert({
    where: { taskId_date: { taskId, date } },
    update: { status },
    create: { taskId, date, status },
  });

  // XP logic: +1 when becoming COMPLETED, -1 when leaving COMPLETED
  const becameCompleted = status === "COMPLETED" && previousStatus !== "COMPLETED";
  const lostCompleted = status !== "COMPLETED" && previousStatus === "COMPLETED";

  if (becameCompleted || lostCompleted) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user) {
      let xpDelta = becameCompleted ? 1 : -1;
      let newXp = Math.max(0, user.xp + xpDelta);
      let newStreak = user.streakDays;
      let newLastCompleted = user.lastCompletedDate;

      if (becameCompleted) {
        // Streak logic
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const todayStr = new Date().toISOString().split("T")[0];
        const yestStr = yesterday.toISOString().split("T")[0];

        if (user.lastCompletedDate) {
          const lastDateStr = user.lastCompletedDate.toISOString().split("T")[0];
          if (lastDateStr === yestStr) {
            newStreak += 1;
          } else if (lastDateStr !== todayStr) {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }

        if (newStreak % 7 === 0 && newStreak > 0) {
          newXp += 20; // 7-day streak bonus
        }

        newLastCompleted = new Date();
      }

      await db.user.update({
        where: { id: userId },
        data: { xp: newXp, streakDays: newStreak, lastCompletedDate: newLastCompleted },
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/full-schedule");
  return log;
}
