import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const keyStatusEnum = pgEnum("key_status", ["active", "expired", "banned"]);

export const licenseKeysTable = pgTable("license_keys", {
  id: serial("id").primaryKey(),
  keyString: text("key_string").notNull().unique(),
  status: keyStatusEnum("status").notNull().default("active"),
  maxDevices: integer("max_devices").notNull().default(1),
  expiredDate: text("expired_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  keyId: integer("key_id").notNull().references(() => licenseKeysTable.id, { onDelete: "cascade" }),
  deviceId: text("device_id").notNull(),
  deviceName: text("device_name"),
  androidVersion: text("android_version"),
  firstActivated: timestamp("first_activated").defaultNow().notNull(),
  lastCheckin: timestamp("last_checkin").defaultNow().notNull(),
});

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  keyString: text("key_string"),
  deviceId: text("device_id"),
  detail: text("detail"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const adminTable = pgTable("admin", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export const insertLicenseKeySchema = createInsertSchema(licenseKeysTable).omit({ id: true, createdAt: true });
export const insertDeviceSchema = createInsertSchema(devicesTable).omit({ id: true });
export const insertLogSchema = createInsertSchema(activityLogsTable).omit({ id: true, timestamp: true });

export type LicenseKey = typeof licenseKeysTable.$inferSelect;
export type Device = typeof devicesTable.$inferSelect;
export type ActivityLog = typeof activityLogsTable.$inferSelect;
export type Admin = typeof adminTable.$inferSelect;
