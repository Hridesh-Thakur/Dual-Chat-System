import { Router } from "express"; 
import { db } from "@workspace/db";
import { usersTable, couplesTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /couple
router.get("/couple", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.coupleId) {
    res.status(404).json({ error: "Not yet connected to a partner" });
    return;
  }
  const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, user.coupleId));
  if (!couple) {
    res.status(404).json({ error: "Couple not found" });
    return;
  }
  const partnerId = couple.user1Id === user.id ? couple.user2Id : couple.user1Id;
  const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, partnerId));
  if (!partner) {
    res.status(404).json({ error: "Partner not found" });
    return;
  }
  res.json({
    id: couple.id,
    startDate: couple.startDate,
    me: {
      id: user.id,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
    },
    partner: {
      id: partner.id,
      displayName: partner.displayName,
      avatarColor: partner.avatarColor,
    },
  });
});

// POST /couple/join
router.post("/couple/join", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.coupleId) {
    res.status(400).json({ error: "Already in a couple" });
    return;
  }
  const { partnerInviteCode, startDate } = req.body;
  if (!partnerInviteCode || !startDate) {
    res.status(400).json({ error: "Missing partnerInviteCode or startDate" });
    return;
  }
  if (partnerInviteCode === user.inviteCode) {
    res.status(400).json({ error: "Cannot pair with yourself" });
    return;
  }
  const [partner] = await db.select().from(usersTable).where(eq(usersTable.inviteCode, partnerInviteCode.toUpperCase()));
  if (!partner) {
    res.status(404).json({ error: "Invite code not found" });
    return;
  }
  if (partner.coupleId) {
    res.status(400).json({ error: "Partner is already paired with someone else" });
    return;
  }

  const [couple] = await db.insert(couplesTable).values({
    user1Id: user.id,
    user2Id: partner.id,
    startDate,
  }).returning();
  if (!couple) {
    res.status(500).json({ error: "Failed to create couple" });
    return;
  }

  await db.update(usersTable).set({ coupleId: couple.id }).where(eq(usersTable.id, user.id));
  await db.update(usersTable).set({ coupleId: couple.id }).where(eq(usersTable.id, partner.id));

  res.json({
    id: couple.id,
    startDate: couple.startDate,
    me: {
      id: user.id,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
    },
    partner: {
      id: partner.id,
      displayName: partner.displayName,
      avatarColor: partner.avatarColor,
    },
  });
});

export default router;
