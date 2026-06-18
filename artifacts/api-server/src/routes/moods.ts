import { Router } from "express";
import { db } from "@workspace/db";
import { moodsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /moods
router.get("/moods", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.coupleId) {
    res.status(400).json({ error: "Not in a couple" });
    return;
  }
  const moods = await db.select().from(moodsTable).where(eq(moodsTable.coupleId, user.coupleId));

  const allUsers = await db.select({ id: usersTable.id, displayName: usersTable.displayName, avatarColor: usersTable.avatarColor })
    .from(usersTable)
    .where(eq(usersTable.coupleId, user.coupleId));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const enriched = moods.map((m) => {
    const u = userMap.get(m.userId);
    return {
      id: m.id,
      userId: m.userId,
      coupleId: m.coupleId,
      displayName: u?.displayName ?? "Unknown",
      avatarColor: u?.avatarColor ?? "#E91E8C",
      mood: m.mood,
      updatedAt: m.updatedAt.toISOString(),
    };
  });
  res.json(enriched);
});

// POST /moods
router.post("/moods", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.coupleId) {
    res.status(400).json({ error: "Not in a couple" });
    return;
  }
  const { mood } = req.body;
  if (!mood || typeof mood !== "string") {
    res.status(400).json({ error: "Mood is required" });
    return;
  }

  const existing = await db.select().from(moodsTable).where(eq(moodsTable.userId, user.id));
  let result;
  if (existing.length > 0) {
    const [updated] = await db.update(moodsTable).set({ mood, updatedAt: new Date() }).where(eq(moodsTable.userId, user.id)).returning();
    result = updated;
  } else {
    const [inserted] = await db.insert(moodsTable).values({ userId: user.id, coupleId: user.coupleId!, mood }).returning();
    result = inserted;
  }

  if (!result) {
    res.status(500).json({ error: "Failed to update mood" });
    return;
  }
  res.json({
    id: result.id,
    userId: result.userId,
    coupleId: result.coupleId,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    mood: result.mood,
    updatedAt: result.updatedAt.toISOString(),
  });
});

export default router;
