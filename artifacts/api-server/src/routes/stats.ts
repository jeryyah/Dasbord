import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, projectsTable, tasksTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const [summary] = await db
    .select({
      totalProjects: sql<number>`(select count(*) from ${projectsTable})`,
      totalTasks: sql<number>`count(*)`,
      completedTasks: sql<number>`count(*) filter (where ${tasksTable.status} = 'done')`,
      inProgressTasks: sql<number>`count(*) filter (where ${tasksTable.status} = 'in_progress')`,
      todoTasks: sql<number>`count(*) filter (where ${tasksTable.status} = 'todo')`,
      highPriorityTasks: sql<number>`count(*) filter (where ${tasksTable.priority} = 'high')`,
    })
    .from(tasksTable);

  res.json({
    totalProjects: Number(summary.totalProjects),
    totalTasks: Number(summary.totalTasks),
    completedTasks: Number(summary.completedTasks),
    inProgressTasks: Number(summary.inProgressTasks),
    todoTasks: Number(summary.todoTasks),
    highPriorityTasks: Number(summary.highPriorityTasks),
  });
});

export default router;
