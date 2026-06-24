import { Router } from "express"; 
import { db } from "@workspace/db";
import { dailyNotesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

function todayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

// GET /daily-notes
router.get("/daily-notes", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.coupleId) {
    res.status(400).json({ error: "Not in a couple" });
    return;
  }
  const today = todayString();
  const notes = await db.select().from(dailyNotesTable)
    .where(and(eq(dailyNotesTable.coupleId, user.coupleId), eq(dailyNotesTable.date, today)))
    .orderBy(desc(dailyNotesTable.createdAt));

  const allUsers = await db.select({ id: usersTable.id, displayName: usersTable.displayName, avatarColor: usersTable.avatarColor })
    .from(usersTable).where(eq(usersTable.coupleId, user.coupleId));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  res.json(notes.map((n) => {
    const u = userMap.get(n.userId);
    return {
      id: n.id,
      userId: n.userId,
      coupleId: n.coupleId,
      displayName: u?.displayName ?? "Unknown",
      avatarColor: u?.avatarColor ?? "#E91E8C",
      content: n.content,
      date: n.date,
      createdAt: n.createdAt.toISOString(),
    };
  }));
});

// POST /daily-notes
router.post("/daily-notes", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.coupleId) {
    res.status(400).json({ error: "Not in a couple" });
    return;
  }
  const { content } = req.body;
  if (content == null || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Content is required" });
    return;
  }
  const today = todayString();
  const existing = await db.select().from(dailyNotesTable)
    .where(and(eq(dailyNotesTable.userId, user.id), eq(dailyNotesTable.date, today)));
  if (existing.length > 0) {
    res.status(409).json({ error: "Already sent a daily note today" });
    return;
  }
  const [note] = await db.insert(dailyNotesTable).values({
    userId: user.id,
    coupleId: user.coupleId,
    content: content.trim(),
    date: today,
  }).returning();
  if (!note) {
    res.status(500).json({ error: "Failed to create daily note" });
    return;
  }
  res.status(201).json({
    id: note.id,
    userId: note.userId,
    coupleId: note.coupleId,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    content: note.content,
    date: note.date,
    createdAt: note.createdAt.toISOString(),
  });
});

export default router;
