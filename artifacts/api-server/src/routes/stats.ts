import { Router } from "express";
import { db } from "@workspace/db";
import { licenseKeysTable, devicesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { format } from "date-fns";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const [totalKeys] = await db.select({ count: count() }).from(licenseKeysTable);
    const [activeKeys] = await db.select({ count: count() }).from(licenseKeysTable).where(eq(licenseKeysTable.status, "active"));
    const [expiredKeys] = await db.select({ count: count() }).from(licenseKeysTable).where(eq(licenseKeysTable.status, "expired"));
    const [bannedKeys] = await db.select({ count: count() }).from(licenseKeysTable).where(eq(licenseKeysTable.status, "banned"));
    const [totalDevices] = await db.select({ count: count() }).from(devicesTable);

    const today = format(new Date(), "yyyy-MM-dd");
    const [todayAct] = await db.select({ count: count() }).from(devicesTable)
      .where(eq(devicesTable.firstActivated, new Date(today)));

    res.json({
      totalKeys: Number(totalKeys.count),
      activeKeys: Number(activeKeys.count),
      expiredKeys: Number(expiredKeys.count),
      bannedKeys: Number(bannedKeys.count),
      totalDevices: Number(totalDevices.count),
      todayActivations: Number(todayAct.count),
    });
  } catch (err) {
    req.log.error({ err }, "Stats error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
