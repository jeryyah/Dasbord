import { Router } from "express";
import { db } from "@workspace/db";
import { licenseKeysTable, devicesTable, activityLogsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

router.post("/", async (req, res): Promise<void> => {
  try {
    const { key, device_id, device_name, android_version } = req.body as Record<string, string>;

    if (!key) {
      res.json({ status: "invalid", message: "Key wajib diisi" });
      return;
    }

    const [licenseKey] = await db
      .select()
      .from(licenseKeysTable)
      .where(eq(licenseKeysTable.keyString, key.toUpperCase()));

    if (!licenseKey) {
      res.json({ status: "invalid" });
      return;
    }

    if (licenseKey.status === "banned") {
      res.json({ status: "banned", expired_date: licenseKey.expiredDate });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (licenseKey.expiredDate < today) {
      if (licenseKey.status !== "expired") {
        await db.update(licenseKeysTable).set({ status: "expired" }).where(eq(licenseKeysTable.id, licenseKey.id));
      }
      res.json({ status: "expired", expired_date: licenseKey.expiredDate });
      return;
    }

    if (!device_id) {
      res.json({ status: "valid", expired_date: licenseKey.expiredDate });
      return;
    }

    const [existingDevice] = await db.select().from(devicesTable).where(eq(devicesTable.deviceId, device_id));

    if (existingDevice) {
      await db.update(devicesTable).set({ lastCheckin: new Date() }).where(eq(devicesTable.deviceId, device_id));
      await db.insert(activityLogsTable).values({
        action: "key_checkin",
        keyString: licenseKey.keyString,
        deviceId: device_id,
        detail: `Checkin: ${device_name ?? device_id}${android_version ? ` (Android ${android_version})` : ""}`,
      });
      res.json({ status: "existing", expired_date: licenseKey.expiredDate });
      return;
    }

    const [deviceCount] = await db.select({ count: count() }).from(devicesTable).where(eq(devicesTable.keyId, licenseKey.id));

    if (Number(deviceCount.count) >= licenseKey.maxDevices) {
      res.json({ status: "device_limit", expired_date: licenseKey.expiredDate });
      return;
    }

    await db.insert(devicesTable).values({
      keyId: licenseKey.id,
      deviceId: device_id,
      deviceName: device_name ?? null,
      androidVersion: android_version ?? null,
    });

    await db.insert(activityLogsTable).values({
      action: "device_activated",
      keyString: licenseKey.keyString,
      deviceId: device_id,
      detail: `Device baru: ${device_name ?? device_id}${android_version ? ` (Android ${android_version})` : ""}`,
    });

    res.json({ status: "valid", expired_date: licenseKey.expiredDate });
  } catch (err) {
    req.log.error({ err }, "Verify error");
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

router.post("/heartbeat", async (req, res): Promise<void> => {
  try {
    const { key, device_id, device_name, android_version } = req.body as Record<string, string>;

    if (!key || !device_id) {
      res.json({ status: "invalid" });
      return;
    }

    const [licenseKey] = await db.select().from(licenseKeysTable).where(eq(licenseKeysTable.keyString, key.toUpperCase()));

    if (!licenseKey) {
      res.json({ status: "invalid" });
      return;
    }

    if (licenseKey.status === "banned") {
      res.json({ status: "banned", expired_date: licenseKey.expiredDate });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (licenseKey.expiredDate < today) {
      if (licenseKey.status !== "expired") {
        await db.update(licenseKeysTable).set({ status: "expired" }).where(eq(licenseKeysTable.id, licenseKey.id));
      }
      res.json({ status: "expired", expired_date: licenseKey.expiredDate });
      return;
    }

    await db.update(devicesTable).set({ lastCheckin: new Date() }).where(eq(devicesTable.deviceId, device_id));

    await db.insert(activityLogsTable).values({
      action: "heartbeat",
      keyString: licenseKey.keyString,
      deviceId: device_id,
      detail: `Online: ${device_name ?? device_id}${android_version ? ` (Android ${android_version})` : ""}`,
    });

    res.json({ status: "ok", expired_date: licenseKey.expiredDate });
  } catch (err) {
    req.log.error({ err }, "Heartbeat error");
    res.status(500).json({ status: "error" });
  }
});

export default router;
