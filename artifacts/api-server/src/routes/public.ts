import { Router } from "express";
import { db } from "@workspace/db";
import { licenseKeysTable, devicesTable, activityLogsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetIn: entry.resetAt - now };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now >= entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

function applyRateLimit(req: any, res: any): boolean {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const rate = checkRateLimit(ip);
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT);
  res.setHeader("X-RateLimit-Remaining", rate.remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(rate.resetIn / 1000));

  if (!rate.allowed) {
    res.status(429).json({
      valid: false,
      message: `Terlalu banyak request. Coba lagi dalam ${Math.ceil(rate.resetIn / 1000)} detik.`,
    });
    return false;
  }
  return true;
}

function daysRemaining(expiredDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiredDate);
  exp.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}

router.get("/check", async (req, res) => {
  try {
    if (!applyRateLimit(req, res)) return;

    const { key, device_id, device_name, android_version } = req.query as Record<string, string>;

    if (!key) {
      return res.status(400).json({ valid: false, message: "Parameter 'key' wajib diisi" });
    }

    const [licenseKey] = await db.select().from(licenseKeysTable).where(eq(licenseKeysTable.keyString, key.toUpperCase()));

    if (!licenseKey) return res.json({ valid: false, message: "Key tidak ditemukan" });
    if (licenseKey.status === "banned") return res.json({ valid: false, message: "Key telah dibanned" });

    const today = new Date().toISOString().split("T")[0];
    if (licenseKey.expiredDate < today) {
      if (licenseKey.status !== "expired") {
        await db.update(licenseKeysTable).set({ status: "expired" }).where(eq(licenseKeysTable.id, licenseKey.id));
      }
      return res.json({ valid: false, message: "Key sudah kadaluarsa" });
    }

    if (device_id) {
      const [existingDevice] = await db.select().from(devicesTable).where(eq(devicesTable.deviceId, device_id));
      if (existingDevice) {
        await db.update(devicesTable).set({ lastCheckin: new Date() }).where(eq(devicesTable.deviceId, device_id));
      } else {
        const [deviceCount] = await db.select({ count: count() }).from(devicesTable).where(eq(devicesTable.keyId, licenseKey.id));
        if (Number(deviceCount.count) >= licenseKey.maxDevices) {
          return res.json({ valid: false, message: `Batas device tercapai (max ${licenseKey.maxDevices})` });
        }
        await db.insert(devicesTable).values({ keyId: licenseKey.id, deviceId: device_id, deviceName: device_name ?? null, androidVersion: android_version ?? null });
        await db.insert(activityLogsTable).values({ action: "device_activated", keyString: licenseKey.keyString, deviceId: device_id, detail: `Device baru: ${device_name ?? device_id}` });
      }
    }

    return res.json({
      valid: true,
      message: "Key valid",
      key: licenseKey.keyString,
      status: licenseKey.status,
      expiredDate: licenseKey.expiredDate,
      maxDevices: licenseKey.maxDevices,
    });
  } catch (err) {
    req.log.error({ err }, "Public check error");
    res.status(500).json({ valid: false, message: "Server error" });
  }
});

router.post("/activate", async (req, res) => {
  try {
    if (!applyRateLimit(req, res)) return;

    const { key, device_id, device_name, android_version } = req.body as Record<string, string>;

    if (!key) return res.status(400).json({ success: false, message: "Field 'key' wajib diisi" });
    if (!device_id) return res.status(400).json({ success: false, message: "Field 'device_id' wajib diisi" });

    const [licenseKey] = await db.select().from(licenseKeysTable).where(eq(licenseKeysTable.keyString, key.toUpperCase()));

    if (!licenseKey) return res.json({ success: false, message: "Key tidak ditemukan" });
    if (licenseKey.status === "banned") return res.json({ success: false, message: "Key telah dibanned" });

    const today = new Date().toISOString().split("T")[0];
    if (licenseKey.expiredDate < today) {
      if (licenseKey.status !== "expired") {
        await db.update(licenseKeysTable).set({ status: "expired" }).where(eq(licenseKeysTable.id, licenseKey.id));
      }
      return res.json({ success: false, message: "Key sudah kadaluarsa" });
    }

    const [existingDevice] = await db.select().from(devicesTable).where(eq(devicesTable.deviceId, device_id));

    if (existingDevice) {
      if (existingDevice.keyId !== licenseKey.id) {
        return res.json({ success: false, message: "Device sudah terdaftar di key lain" });
      }
      await db.update(devicesTable).set({ lastCheckin: new Date() }).where(eq(devicesTable.deviceId, device_id));
      const [deviceCount] = await db.select({ count: count() }).from(devicesTable).where(eq(devicesTable.keyId, licenseKey.id));
      return res.json({
        success: true,
        message: "Device sudah terdaftar sebelumnya",
        alreadyRegistered: true,
        key: licenseKey.keyString,
        status: licenseKey.status,
        expiredDate: licenseKey.expiredDate,
        daysRemaining: daysRemaining(licenseKey.expiredDate),
        maxDevices: licenseKey.maxDevices,
        deviceCount: Number(deviceCount.count),
        deviceId: device_id,
        deviceName: device_name ?? null,
      });
    }

    const [deviceCount] = await db.select({ count: count() }).from(devicesTable).where(eq(devicesTable.keyId, licenseKey.id));
    if (Number(deviceCount.count) >= licenseKey.maxDevices) {
      return res.json({ success: false, message: `Batas device tercapai (${Number(deviceCount.count)}/${licenseKey.maxDevices})` });
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
      detail: `Aktivasi baru: ${device_name ?? device_id}${android_version ? ` (Android ${android_version})` : ""}`,
    });

    return res.status(201).json({
      success: true,
      message: "Aktivasi berhasil",
      alreadyRegistered: false,
      key: licenseKey.keyString,
      status: licenseKey.status,
      expiredDate: licenseKey.expiredDate,
      daysRemaining: daysRemaining(licenseKey.expiredDate),
      maxDevices: licenseKey.maxDevices,
      deviceCount: Number(deviceCount.count) + 1,
      deviceId: device_id,
      deviceName: device_name ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Public activate error");
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
