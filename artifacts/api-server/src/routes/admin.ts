import { Router } from "express";
import { db } from "@workspace/db";
import { adminTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "headsetting_salt").digest("hex");
}

router.get("/me", (_req, res) => {
  const session = (_req as any).session;
  if (session?.adminLoggedIn) {
    res.json({ loggedIn: true, username: session.adminUsername });
  } else {
    res.json({ loggedIn: false, username: null });
  }
});

router.post("/login", async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.json({ success: false, message: "Username dan password wajib diisi" });
      return;
    }

    const [admin] = await db.select().from(adminTable).where(eq(adminTable.username, username));
    if (!admin) {
      res.json({ success: false, message: "Username atau password salah" });
      return;
    }

    const hash = hashPassword(password);
    if (hash !== admin.passwordHash) {
      res.json({ success: false, message: "Username atau password salah" });
      return;
    }

    (req as any).session.adminLoggedIn = true;
    (req as any).session.adminUsername = username;
    res.json({ success: true, message: null });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  (req as any).session.destroy(() => {
    res.json({ success: true, message: null });
  });
});

export default router;
