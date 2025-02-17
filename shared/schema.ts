import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing tables remain unchanged
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  preferences: jsonb("preferences").$type<{
    interests: string[];
    preferredDays: string[];
    preferredTimeOfDay: string[];
  }>(),
});

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(), 
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  videoUrl: text("video_url"),
  isUpcoming: boolean("is_upcoming").notNull().default(true),
  categories: text("categories").array().notNull().default([]),
  topics: text("topics").array().notNull().default([]),
  targetAudience: text("target_audience").array().notNull().default([]),
});

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  meetingId: integer("meeting_id").notNull(),
  registrationDate: timestamp("registration_date").notNull().defaultNow(),
  attended: boolean("attended").notNull().default(false),
  feedback: jsonb("feedback").$type<{
    rating: number;
    interests: string[];
    comments: string;
  }>(),
});

export const annotations = pgTable("annotations", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull(),
  userId: integer("user_id").notNull(),
  timestamp: integer("timestamp").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  metadata: jsonb("metadata").$type<{
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    details?: Record<string, any>;
  }>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

export const insertMeetingSchema = createInsertSchema(meetings)
  .extend({
    date: z.string().transform((str) => new Date(str)),
    videoUrl: z.string().nullable().refine((val) => {
      if (!val) return true; 
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, "Please enter a valid URL"),
    isUpcoming: z.boolean().default(true),
    categories: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    targetAudience: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      if (!data.isUpcoming && !data.videoUrl) {
        return false;
      }
      return true;
    },
    {
      message: "Video URL is required for past meetings",
      path: ["videoUrl"],
    }
  );

export const insertRegistrationSchema = createInsertSchema(registrations);

export const insertActivityLogSchema = createInsertSchema(activityLogs);

export const insertAnnotationSchema = createInsertSchema(annotations)
  .extend({
    timestamp: z.number(),
    text: z.string().min(1, "Annotation text is required"),
  });

// Add LoginData and RegisterData types
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema;

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;


export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type Registration = typeof registrations.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Annotation = typeof annotations.$inferSelect;