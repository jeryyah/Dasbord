import { Router } from "express";
import { db } from "@workspace/db";
import { activityLogsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const logs = await db.select().from(activityLogsTable)
      .orderBy(sql`timestamp DESC`)
      .limit(200);

    res.json({ logs });
  } catch (err) {
    req.log.error({ err }, "Get logs error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
