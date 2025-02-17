import { db } from "./db";
import { activityLogs, type InsertActivityLog } from "@shared/schema";

export type LogActionType = 
  | "USER_LOGIN" 
  | "USER_LOGOUT" 
  | "MEETING_CREATE" 
  | "MEETING_UPDATE" 
  | "MEETING_DELETE" 
  | "MEETING_REGISTER" 
  | "USER_CREATE" 
  | "USER_UPDATE" 
  | "USER_DELETE"
  | "ADMIN_ACTION";

export type EntityType = "USER" | "MEETING" | "REGISTRATION";

export interface LogActivity {
  userId?: number;
  action: LogActionType;
  entityType: EntityType;
  entityId?: number;
  metadata?: {
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    details?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
}

export class LoggingService {
  static async logActivity(activity: LogActivity): Promise<void> {
    try {
      await db.insert(activityLogs).values({
        userId: activity.userId,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        metadata: activity.metadata,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
      // Don't throw the error to prevent disrupting the main application flow
    }
  }

  static async getActivityLogs(filters?: {
    userId?: number;
    entityType?: EntityType;
    action?: LogActionType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<InsertActivityLog[]> {
    try {
      let query = db.select().from(activityLogs);

      // Add filters if provided
      if (filters) {
        const conditions = [];
        if (filters.userId) conditions.push({ userId: filters.userId });
        if (filters.entityType) conditions.push({ entityType: filters.entityType });
        if (filters.action) conditions.push({ action: filters.action });
        if (filters.startDate) conditions.push({ timestamp: { gte: filters.startDate } });
        if (filters.endDate) conditions.push({ timestamp: { lte: filters.endDate } });
      }

      query = query.orderBy(activityLogs.timestamp);
      return await query;
    } catch (error) {
      console.error("Failed to retrieve activity logs:", error);
      return [];
    }
  }
}
