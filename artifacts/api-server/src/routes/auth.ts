import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signToken, requireAuth, generateInviteCode } from "../lib/auth";

const router = Router();

// POST /auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, displayName, password } = req.body;
  if (!username || !displayName || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  if (username.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase()));
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const avatarColors = ["#E91E8C", "#9C27B0", "#F06292", "#AB47BC", "#EC407A", "#7E57C2", "#EF5350", "#FF7043"];
  const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)] ?? "#E91E8C";
  const passwordHash = await hashPassword(password);
  const myInviteCode = generateInviteCode();

  const [user] = await db.insert(usersTable).values({
    username: username.toLowerCase(),
    displayName,
    passwordHash,
    inviteCode: myInviteCode,
    avatarColor,
    coupleId: null,
  }).returning();

  if (!user) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }

  const token = signToken(user.id);
  res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      inviteCode: user.inviteCode,
      coupleId: user.coupleId,
    },
  });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Missing credentials" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase()));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken(user.id);
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      inviteCode: user.inviteCode,
      coupleId: user.coupleId,
    },
  });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  res.json(user);
});

export default router;
