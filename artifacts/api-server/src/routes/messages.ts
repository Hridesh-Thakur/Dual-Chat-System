import { Router } from "express"; 
import { db } from "@workspace/db";
import { messagesTable, usersTable } from "@workspace/db";
import { eq, lt, desc, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /messages
router.get("/messages", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.coupleId) {
    res.status(400).json({ error: "Not in a couple" });
    return;
  }
  const limit = Math.min(parseInt(String(req.query["limit"] ?? "50"), 10), 100);
  const before = req.query["before"] ? parseInt(String(req.query["before"]), 10) : null;

  const whereClause = before
    ? and(eq(messagesTable.coupleId, user.coupleId), lt(messagesTable.id, before))
    : eq(messagesTable.coupleId, user.coupleId);

  const messages = await db
    .select()
    .from(messagesTable)
    .where(whereClause)
    .orderBy(desc(messagesTable.createdAt))
    .limit(limit);

  const senderIds = [...new Set(messages.map((m) => m.senderId))];
  const senders = senderIds.length > 0
    ? await db.select().from(usersTable).where(
        senderIds.length === 1
          ? eq(usersTable.id, senderIds[0]!)
          : eq(usersTable.id, senderIds[0]!)
      )
    : [];

  const allSenders = await db.select({ id: usersTable.id, displayName: usersTable.displayName, avatarColor: usersTable.avatarColor })
    .from(usersTable)
    .where(eq(usersTable.coupleId, user.coupleId));

  const senderMap = new Map(allSenders.map((s) => [s.id, s]));

  const enriched = messages.map((m) => {
    const sender = senderMap.get(m.senderId);
    return {
      id: m.id,
      coupleId: m.coupleId,
      senderId: m.senderId,
      senderDisplayName: sender?.displayName ?? "Unknown",
      senderAvatarColor: sender?.avatarColor ?? "#E91E8C",
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    };
  });

  res.json(enriched);
});

// POST /messages
router.post("/messages", requireAuth, async (req, res): Promise<void> => {
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
  const [message] = await db.insert(messagesTable).values({
    coupleId: user.coupleId,
    senderId: user.id,
    content: content.trim(),
  }).returning();
  if (!message) {
    res.status(500).json({ error: "Failed to send message" });
    return;
  }
  res.status(201).json({
    id: message.id,
    coupleId: message.coupleId,
    senderId: message.senderId,
    senderDisplayName: user.displayName,
    senderAvatarColor: user.avatarColor,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  });
});

export default router;
