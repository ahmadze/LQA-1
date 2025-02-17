import { meetings, registrations, users, annotations, type User, type InsertUser, type Meeting, type Registration, type Annotation } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, isAdmin: boolean): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Password Reset
  setResetToken(userId: number, resetToken: string, expiry: Date): Promise<void>;
  getUserByResetToken(resetToken: string): Promise<User | undefined>;
  updateUserPassword(userId: number, newPassword: string): Promise<void>;
  clearResetToken(userId: number): Promise<void>;

  // Meeting Management
  getMeetings(): Promise<Meeting[]>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  createMeeting(meeting: Omit<Meeting, "id">): Promise<Meeting>;
  updateMeeting(id: number, meeting: Partial<Omit<Meeting, "id">>): Promise<Meeting | undefined>;
  deleteMeeting(id: number): Promise<boolean>;

  // Registration Management
  getRegistration(userId: number, meetingId: number): Promise<Registration | undefined>;
  createRegistration(userId: number, meetingId: number): Promise<Registration>;
  getAllRegistrations(): Promise<Registration[]>;
  deleteRegistration(userId: number, meetingId: number): Promise<boolean>;

  // Annotation Management
  getAnnotations(meetingId: number): Promise<Annotation[]>;
  createAnnotation(annotation: { meetingId: number; userId: number; timestamp: number; text: string }): Promise<Annotation>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User Management Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const isFirstUser = (await db.select().from(users)).length === 0;
    const [user] = await db.insert(users)
      .values({ ...insertUser, isAdmin: isFirstUser })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUserRole(id: number, isAdmin: boolean): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ isAdmin })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
    return !!deleted;
  }

  // Password Reset Methods
  async setResetToken(userId: number, resetToken: string, expiry: Date): Promise<void> {
    await db.update(users)
      .set({ 
        resetToken, 
        resetTokenExpiry: expiry 
      })
      .where(eq(users.id, userId));
  }

  async getUserByResetToken(resetToken: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(
        and(
          eq(users.resetToken, resetToken),
          gt(users.resetTokenExpiry, new Date())
        )
      );
    return user;
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId));
  }

  async clearResetToken(userId: number): Promise<void> {
    await db.update(users)
      .set({ 
        resetToken: null, 
        resetTokenExpiry: null 
      })
      .where(eq(users.id, userId));
  }


  // Meeting Management Methods
  async getMeetings(): Promise<Meeting[]> {
    return db.select().from(meetings);
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async createMeeting(meeting: Omit<Meeting, "id">): Promise<Meeting> {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    return newMeeting;
  }

  async updateMeeting(id: number, meeting: Partial<Omit<Meeting, "id">>): Promise<Meeting | undefined> {
    const [updated] = await db.update(meetings)
      .set(meeting)
      .where(eq(meetings.id, id))
      .returning();
    return updated;
  }

  async deleteMeeting(id: number): Promise<boolean> {
    const [deleted] = await db.delete(meetings).where(eq(meetings.id, id)).returning();
    return !!deleted;
  }

  // Registration Management Methods
  async getRegistration(userId: number, meetingId: number): Promise<Registration | undefined> {
    const [registration] = await db.select()
      .from(registrations)
      .where(
        and(
          eq(registrations.userId, userId),
          eq(registrations.meetingId, meetingId)
        )
      );
    return registration;
  }

  async createRegistration(userId: number, meetingId: number): Promise<Registration> {
    const [registration] = await db.insert(registrations)
      .values({ userId, meetingId })
      .returning();
    return registration;
  }

  async getAllRegistrations(): Promise<Registration[]> {
    return db.select().from(registrations);
  }

  async deleteRegistration(userId: number, meetingId: number): Promise<boolean> {
    const [deleted] = await db.delete(registrations)
      .where(
        and(
          eq(registrations.userId, userId),
          eq(registrations.meetingId, meetingId)
        )
      )
      .returning();
    return !!deleted;
  }

  // Annotation Management Methods
  async getAnnotations(meetingId: number): Promise<Annotation[]> {
    return db.select()
      .from(annotations)
      .where(eq(annotations.meetingId, meetingId))
      .orderBy(annotations.timestamp);
  }

  async createAnnotation(data: { meetingId: number; userId: number; timestamp: number; text: string }): Promise<Annotation> {
    const [annotation] = await db.insert(annotations)
      .values(data)
      .returning();
    return annotation;
  }
}

export const storage = new DatabaseStorage();