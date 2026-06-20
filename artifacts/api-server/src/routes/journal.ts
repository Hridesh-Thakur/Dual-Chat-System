import { Router } from "express";
import { db } from "@workspace/db";
import { journalEntriesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /journal
router.get("/journal", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.coupleId) {
    res.status(400).json({ error: "Not in a couple" });
    return;
  }
  const entries = await db.select().from(journalEntriesTable)
    .where(eq(journalEntriesTable.coupleId, user.coupleId))
    .orderBy(desc(journalEntriesTable.createdAt));

  const allUsers = await db.select({ id: usersTable.id, displayName: usersTable.displayName, avatarColor: usersTable.avatarColor })
    .from(usersTable).where(eq(usersTable.coupleId, user.coupleId));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  res.json(entries.map((e) => {
    const u = userMap.get(e.userId);
    return {
      id: e.id,
      userId: e.userId,
      coupleId: e.coupleId,
      displayName: u?.displayName ?? "Unknown",
      avatarColor: u?.avatarColor ?? "#E91E8C",
      content: e.content,
      createdAt: e.createdAt.toISOString(),
    };
  }));
});

// POST /journal
router.post("/journal", requireAuth, async (req, res): Promise<void> => {
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
  const [entry] = await db.insert(journalEntriesTable).values({
    userId: user.id,
    coupleId: user.coupleId,
    content: content.trim(),
  }).returning();
  if (!entry) {
    res.status(500).json({ error: "Failed to create entry" });
    return;
  }
  res.status(201).json({
    id: entry.id,
    userId: entry.userId,
    coupleId: entry.coupleId,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    content: entry.content,
    createdAt: entry.createdAt.toISOString(),
  });
});

// PUT /journal/:id
router.put("/journal/:id", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { content } = req.body;
  if (content == null || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Content is required" });
    return;
  }
  const [updated] = await db
    .update(journalEntriesTable)
    .set({ content: content.trim() })
    .where(and(eq(journalEntriesTable.id, id), eq(journalEntriesTable.userId, user.id)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Entry not found or not yours" });
    return;
  }
  res.json({
    id: updated.id,
    userId: updated.userId,
    coupleId: updated.coupleId,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    content: updated.content,
    createdAt: updated.createdAt.toISOString(),
  });
});

// DELETE /journal/:id
router.delete("/journal/:id", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(journalEntriesTable).where(and(eq(journalEntriesTable.id, id), eq(journalEntriesTable.userId, user.id)));
  res.sendStatus(204);
});

export default router;
