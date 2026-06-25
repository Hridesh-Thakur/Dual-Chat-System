import { pgTable, text, serial, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4"; 

export const memoriesTable = pgTable("memories", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  createdByUserId: integer("created_by_user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  memoryDate: date("memory_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMemorySchema = createInsertSchema(memoriesTable).omit({ id: true, createdAt: true });
export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memoriesTable.$inferSelect;
