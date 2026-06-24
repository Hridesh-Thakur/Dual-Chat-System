import { Router } from "express"; 
import { db } from "@workspace/db";
import { memoriesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /memories
router.get("/memories", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.coupleId) {
    res.status(400).json({ error: "Not in a couple" });
    return;
  }
  const memories = await db.select().from(memoriesTable)
    .where(eq(memoriesTable.coupleId, user.coupleId))
    .orderBy(desc(memoriesTable.memoryDate));

  const allUsers = await db.select({ id: usersTable.id, displayName: usersTable.displayName, avatarColor: usersTable.avatarColor })
    .from(usersTable).where(eq(usersTable.coupleId, user.coupleId));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  res.json(memories.map((m) => {
    const u = userMap.get(m.createdByUserId);
    return {
      id: m.id,
      coupleId: m.coupleId,
      createdByUserId: m.createdByUserId,
      displayName: u?.displayName ?? "Unknown",
      avatarColor: u?.avatarColor ?? "#E91E8C",
      title: m.title,
      description: m.description,
      memoryDate: m.memoryDate,
      createdAt: m.createdAt.toISOString(),
    };
  }));
});

// POST /memories
router.post("/memories", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.coupleId) {
    res.status(400).json({ error: "Not in a couple" });
    return;
  }
  const { title, description, memoryDate } = req.body;
  if (!title || !description || !memoryDate) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [memory] = await db.insert(memoriesTable).values({
    coupleId: user.coupleId,
    createdByUserId: user.id,
    title: title.trim(),
    description: description.trim(),
    memoryDate,
  }).returning();
  if (!memory) {
    res.status(500).json({ error: "Failed to create memory" });
    return;
  }
  res.status(201).json({
    id: memory.id,
    coupleId: memory.coupleId,
    createdByUserId: memory.createdByUserId,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    title: memory.title,
    description: memory.description,
    memoryDate: memory.memoryDate,
    createdAt: memory.createdAt.toISOString(),
  });
});

// DELETE /memories/:id
router.delete("/memories/:id", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(memoriesTable).where(and(eq(memoriesTable.id, id), eq(memoriesTable.coupleId, user.coupleId!)));
  res.sendStatus(204);
});

export default router;
