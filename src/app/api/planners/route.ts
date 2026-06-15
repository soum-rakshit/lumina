import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, tasks } = body;

  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  // Compute start/end from all rules
  let minStart = new Date();
  let maxEnd = new Date();
  
  tasks?.forEach((t: any) => {
    t.rules?.forEach((r: any) => {
      if (r.startDate) {
        const s = new Date(r.startDate);
        if (s < minStart) minStart = s;
      }
      if (r.endDate) {
        const e = new Date(r.endDate);
        if (e > maxEnd) maxEnd = e;
      }
    });
  });

  const planner = await db.planner.create({
    data: {
      userId,
      name,
      startDate: minStart,
      endDate: maxEnd,
      tasks: {
        create: (tasks || []).map((t: any) => ({
          name: t.name || "Untitled Task",
          isCompulsory: t.isCompulsory ?? true,
          rules: {
            create: (t.rules || []).map((r: any) => ({
              startDate: r.startDate ? new Date(r.startDate) : new Date(),
              endDate: r.endDate ? new Date(r.endDate) : new Date(),
              weekdays: r.weekdays || [1, 2, 3, 4, 5],
            })),
          },
        })),
      },
    },
    include: { tasks: { include: { rules: true } } },
  });

  return NextResponse.json(planner);
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, tasks } = body;

  if (!id || !name) return NextResponse.json({ error: "ID and name required" }, { status: 400 });

  // Verify ownership
  const existing = await db.planner.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Compute start/end from all rules
  let minStart = new Date();
  let maxEnd = new Date();

  tasks?.forEach((t: any) => {
    t.rules?.forEach((r: any) => {
      if (r.startDate) {
        const s = new Date(r.startDate);
        if (s < minStart) minStart = s;
      }
      if (r.endDate) {
        const e = new Date(r.endDate);
        if (e > maxEnd) maxEnd = e;
      }
    });
  });

  // Delete old tasks/rules (cascade will handle dailyLogs via onDelete: Cascade)
  const oldTasks = await db.task.findMany({ where: { plannerId: id } });
  for (const task of oldTasks) {
    await db.dailyLog.deleteMany({ where: { taskId: task.id } });
    await db.taskRule.deleteMany({ where: { taskId: task.id } });
  }
  await db.task.deleteMany({ where: { plannerId: id } });

  // Update planner and recreate tasks
  const planner = await db.planner.update({
    where: { id },
    data: {
      name,
      startDate: minStart,
      endDate: maxEnd,
      tasks: {
        create: (tasks || []).map((t: any) => ({
          name: t.name || "Untitled Task",
          isCompulsory: t.isCompulsory ?? true,
          rules: {
            create: (t.rules || []).map((r: any) => ({
              startDate: r.startDate ? new Date(r.startDate) : new Date(),
              endDate: r.endDate ? new Date(r.endDate) : new Date(),
              weekdays: r.weekdays || [1, 2, 3, 4, 5],
            })),
          },
        })),
      },
    },
    include: { tasks: { include: { rules: true } } },
  });

  return NextResponse.json(planner);
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Only delete if it belongs to this user
  const planner = await db.planner.findFirst({ where: { id, userId } });
  if (!planner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete related records first
  const tasks = await db.task.findMany({ where: { plannerId: id } });
  for (const task of tasks) {
    await db.dailyLog.deleteMany({ where: { taskId: task.id } });
    await db.taskRule.deleteMany({ where: { taskId: task.id } });
  }
  await db.task.deleteMany({ where: { plannerId: id } });
  await db.planner.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
