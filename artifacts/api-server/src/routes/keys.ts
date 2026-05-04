import { Router } from "express";
import { db } from "@workspace/db";
import { licenseKeysTable, devicesTable, activityLogsTable } from "@workspace/db";
import { eq, sql, count } from "drizzle-orm";
import { randomBytes } from "crypto";
import { format, addDays } from "date-fns";

const router = Router();

function generateKeyString(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    key += chars[bytes[i] % chars.length];
  }
  return key;
}

async function logActivity(action: string, keyString?: string, deviceId?: string, detail?: string) {
  await db.insert(activityLogsTable).values({ action, keyString: keyString ?? null, deviceId: deviceId ?? null, detail: detail ?? null });
}

router.get("/", async (req, res): Promise<void> => {
  try {
    const keys = await db.select().from(licenseKeysTable).orderBy(sql`created_at DESC`);
    const deviceCounts = await db.select({
      keyId: devicesTable.keyId,
      cnt: count(),
    }).from(devicesTable).groupBy(devicesTable.keyId);

    const countMap = new Map(deviceCounts.map(d => [d.keyId, Number(d.cnt)]));

    const result = keys.map(k => ({
      ...k,
      deviceCount: countMap.get(k.id) ?? 0,
    }));

    res.json({ keys: result });
  } catch (err) {
    req.log.error({ err }, "Get keys error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/generate", async (req, res): Promise<void> => {
  try {
    const { days, maxDevices } = req.body;
    const expiredDate = format(addDays(new Date(), days), "yyyy-MM-dd");
    const keyString = generateKeyString();

    const [key] = await db.insert(licenseKeysTable).values({
      keyString,
      status: "active",
      maxDevices,
      expiredDate,
    }).returning();

    await logActivity("key_generated", keyString, undefined, `Dibuat dengan masa ${days} hari, max ${maxDevices} device`);

    res.status(201).json({ ...key, deviceCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Generate key error");
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const { maxDevices, expiredDate } = req.body;

    const [key] = await db.update(licenseKeysTable)
      .set({ maxDevices, expiredDate })
      .where(eq(licenseKeysTable.id, id))
      .returning();

    if (!key) {
      res.status(404).json({ error: "Key not found" });
      return;
    }

    const [deviceCount] = await db.select({ count: count() }).from(devicesTable).where(eq(devicesTable.keyId, id));
    await logActivity("key_edited", key.keyString, undefined, `Diubah: max=${maxDevices}, expired=${expiredDate}`);

    res.json({ ...key, deviceCount: Number(deviceCount.count) });
  } catch (err) {
    req.log.error({ err }, "Edit key error");
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [key] = await db.select().from(licenseKeysTable).where(eq(licenseKeysTable.id, id));
    if (!key) {
      res.status(404).json({ success: false, message: "Key not found" });
      return;
    }

    await db.delete(licenseKeysTable).where(eq(licenseKeysTable.id, id));
    await logActivity("key_deleted", key.keyString, undefined, "Key dihapus permanen");

    res.json({ success: true, message: null });
  } catch (err) {
    req.log.error({ err }, "Delete key error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/ban", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [key] = await db.update(licenseKeysTable)
      .set({ status: "banned" })
      .where(eq(licenseKeysTable.id, id))
      .returning();

    if (!key) {
      res.status(404).json({ error: "Key not found" });
      return;
    }

    const [deviceCount] = await db.select({ count: count() }).from(devicesTable).where(eq(devicesTable.keyId, id));
    await logActivity("key_banned", key.keyString, undefined, "Key dibanned oleh admin");

    res.json({ ...key, deviceCount: Number(deviceCount.count) });
  } catch (err) {
    req.log.error({ err }, "Ban key error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/unban", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [key] = await db.update(licenseKeysTable)
      .set({ status: "active" })
      .where(eq(licenseKeysTable.id, id))
      .returning();

    if (!key) {
      res.status(404).json({ error: "Key not found" });
      return;
    }

    const [deviceCount] = await db.select({ count: count() }).from(devicesTable).where(eq(devicesTable.keyId, id));
    await logActivity("key_unbanned", key.keyString, undefined, "Key di-unban oleh admin");

    res.json({ ...key, deviceCount: Number(deviceCount.count) });
  } catch (err) {
    req.log.error({ err }, "Unban key error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id/devices", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const devices = await db.select().from(devicesTable)
      .where(eq(devicesTable.keyId, id))
      .orderBy(sql`first_activated DESC`);

    res.json({ devices });
  } catch (err) {
    req.log.error({ err }, "Get devices error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/devices/reset", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [key] = await db.select().from(licenseKeysTable).where(eq(licenseKeysTable.id, id));
    if (!key) {
      res.status(404).json({ success: false, message: "Key not found" });
      return;
    }

    await db.delete(devicesTable).where(eq(devicesTable.keyId, id));
    await logActivity("devices_reset", key.keyString, undefined, "Semua device direset oleh admin");

    res.json({ success: true, message: null });
  } catch (err) {
    req.log.error({ err }, "Reset devices error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
