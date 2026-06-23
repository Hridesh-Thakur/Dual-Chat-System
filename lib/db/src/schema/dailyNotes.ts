import { pgTable, text, serial, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod"; 
import { z } from "zod/v4";

export const dailyNotesTable = pgTable("daily_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  coupleId: integer("couple_id").notNull(),
  content: text("content").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDailyNoteSchema = createInsertSchema(dailyNotesTable).omit({ id: true, createdAt: true });
export type InsertDailyNote = z.infer<typeof insertDailyNoteSchema>;
export type DailyNote = typeof dailyNotesTable.$inferSelect;
