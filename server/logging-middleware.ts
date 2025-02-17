import { Request, Response, NextFunction } from "express";
import { LoggingService } from "./logging-service";
import type { LogActionType, EntityType } from "./logging-service";

export interface LoggingRequest extends Request {
  logActivity: (params: {
    action: LogActionType;
    entityType: EntityType;
    entityId?: number;
    metadata?: Record<string, any>;
  }) => Promise<void>;
}

export function loggingMiddleware(
  req: LoggingRequest,
  res: Response,
  next: NextFunction
) {
  // Attach logging function to request object
  req.logActivity = async ({
    action,
    entityType,
    entityId,
    metadata,
  }) => {
    await LoggingService.logActivity({
      userId: req.user?.id,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
  };

  next();
}
