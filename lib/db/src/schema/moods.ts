import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const moodsTable = pgTable("moods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  coupleId: integer("couple_id").notNull(),
  mood: text("mood").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMoodSchema = createInsertSchema(moodsTable).omit({ id: true, updatedAt: true });
export type InsertMood = z.infer<typeof insertMoodSchema>;
export type Mood = typeof moodsTable.$inferSelect;
