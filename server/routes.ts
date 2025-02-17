import { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { insertMeetingSchema, insertAnnotationSchema } from "@shared/schema";
import { ZodError } from "zod";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { sendMeetingConfirmation, sendNewMeetingNotification } from "./email";
import { getPersonalizedRecommendations } from "./recommendations";
import { loggingMiddleware, type LoggingRequest } from "./logging-middleware";
import passport from 'passport';

// Keep track of connected clients
const clients = new Set<WebSocket>();

// Add delete account endpoint
function registerRoutes(app: Express): Server {
    setupAuth(app);

    // Add logging middleware
    app.use(loggingMiddleware);

    app.delete("/api/account", async (req: LoggingRequest, res: Response) => {
        if (!req.isAuthenticated()) {
            return res.status(401).send("Not authenticated");
        }

        try {
            const userId = req.user!.id;
            const success = await storage.deleteUser(userId);

            if (!success) {
                return res.status(404).json({ message: "User not found" });
            }

            // Log the account deletion
            await req.logActivity({
                action: "USER_DELETE" as const,
                entityType: "USER" as const,
                entityId: userId,
                metadata: { userId },
            });

            // Logout the user after successful deletion
            req.logout((err) => {
                if (err) {
                    console.error("Error logging out after account deletion:", err);
                }
                res.sendStatus(204);
            });
        } catch (error) {
            console.error("Error deleting account:", error);
            res.status(500).json({ message: "Failed to delete account" });
        }
    });

    // Add annotation endpoints
    app.get("/api/meetings/:id/annotations", async (req: Request, res: Response) => {
        if (!req.isAuthenticated()) {
            return res.status(401).send("Not authenticated");
        }

        try {
            const meetingId = parseInt(req.params.id);
            const annotations = await storage.getAnnotations(meetingId);
            res.json(annotations);
        } catch (error) {
            console.error("Error fetching annotations:", error);
            res.status(500).json({ message: "Failed to fetch annotations" });
        }
    });

    app.post("/api/meetings/:id/annotations", async (req: LoggingRequest, res: Response) => {
        if (!req.isAuthenticated()) {
            return res.status(401).send("Not authenticated");
        }

        try {
            const meetingId = parseInt(req.params.id);
            const validatedData = insertAnnotationSchema.parse({
                ...req.body,
                meetingId,
                userId: req.user!.id,
            });

            const annotation = await storage.createAnnotation(validatedData);

            await req.logActivity({
                action: "ANNOTATION_CREATE" as const,
                entityType: "ANNOTATION" as const,
                entityId: annotation.id,
                metadata: { annotation },
            });

            res.status(201).json(annotation);
        } catch (error) {
            console.error("Error creating annotation:", error);
            if (error instanceof ZodError) {
                return res.status(400).json({
                    message: "Invalid annotation data",
                    errors: error.errors,
                });
            }
            res.status(500).json({ message: "Failed to create annotation" });
        }
    });

    // Add activity logs endpoint for admins
    app.get("/api/admin/activity-logs", isAdmin, async (req: Request, res: Response) => {
        try {
            const logs = await LoggingService.getActivityLogs(req.query);
            res.json(logs);
        } catch (error) {
            console.error("Error fetching activity logs:", error);
            res.status(500).json({ message: "Failed to fetch activity logs" });
        }
    });

    // Admin routes
    app.get("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
        try {
            const users = await storage.getAllUsers();
            res.json(users);
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ message: "Failed to fetch users" });
        }
    });

    app.patch("/api/admin/users/:id/role", isAdmin, async (req: Request, res: Response) => {
        try {
            const userId = parseInt(req.params.id);
            const { isAdmin } = req.body;

            if (typeof isAdmin !== "boolean") {
                return res.status(400).json({ message: "Invalid input" });
            }

            const user = await storage.updateUserRole(userId, isAdmin);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.json(user);
        } catch (error) {
            console.error("Error updating user role:", error);
            res.status(500).json({ message: "Failed to update user role" });
        }
    });

    app.delete("/api/admin/users/:id", isAdmin, async (req: Request, res: Response) => {
        try {
            const userId = parseInt(req.params.id);
            const success = await storage.deleteUser(userId);
            if (!success) {
                return res.status(404).json({ message: "User not found" });
            }
            res.sendStatus(204);
        } catch (error) {
            console.error("Error deleting user:", error);
            res.status(500).json({ message: "Failed to delete user" });
        }
    });

    // Add this route before the existing routes
    app.get("/api/admin/registrations", isAdmin, async (req: Request, res: Response) => {
        try {
            const registrations = await storage.getAllRegistrations();
            const detailedRegistrations = await Promise.all(
                registrations.map(async (registration) => {
                    const user = await storage.getUser(registration.userId);
                    const meeting = await storage.getMeeting(registration.meetingId);
                    return {
                        ...registration,
                        user,
                        meeting,
                    };
                })
            );
            res.json(detailedRegistrations);
        } catch (error) {
            console.error("Error fetching registrations:", error);
            res.status(500).json({ message: "Failed to fetch registrations" });
        }
    });

    // Meetings routes
    app.post("/api/meetings", isAdmin, async (req: LoggingRequest, res: Response) => {
        try {
            // Validate request body against schema
            const validatedData = insertMeetingSchema.parse(req.body);
            const meeting = await storage.createMeeting(validatedData);

            // Get all users to notify them about the new meeting
            const users = await storage.getAllUsers();

            // Send notifications to all users
            try {
                await sendNewMeetingNotification(users, meeting);
            } catch (error) {
                console.error('Failed to send meeting notifications:', error);
                // Continue even if notifications fail
            }

            await req.logActivity({
                action: "MEETING_CREATE" as const,
                entityType: "MEETING" as const,
                entityId: meeting.id,
                metadata: { newState: meeting },
            });

            res.status(201).json(meeting);
        } catch (error) {
            console.error("Error creating meeting:", error);
            if (error instanceof ZodError) {
                return res.status(400).json({
                    message: "Invalid meeting data",
                    errors: error.errors,
                });
            }
            res.status(500).json({ message: "Failed to create meeting" });
        }
    });

    app.patch("/api/meetings/:id", isAdmin, async (req: LoggingRequest, res: Response) => {
        try {
            const meetingId = parseInt(req.params.id);
            const validatedData = insertMeetingSchema.partial().parse(req.body);
            const originalMeeting = await storage.getMeeting(meetingId);
            const meeting = await storage.updateMeeting(meetingId, validatedData);
            if (!meeting) {
                return res.status(404).json({ message: "Meeting not found" });
            }

            await req.logActivity({
                action: "MEETING_UPDATE" as const,
                entityType: "MEETING" as const,
                entityId: meetingId,
                metadata: { originalState: originalMeeting, newState: meeting },
            });

            res.json(meeting);
        } catch (error) {
            console.error("Error updating meeting:", error);
            if (error instanceof ZodError) {
                return res.status(400).json({
                    message: "Invalid meeting data",
                    errors: error.errors,
                });
            }
            res.status(500).json({ message: "Failed to update meeting" });
        }
    });

    app.delete("/api/meetings/:id", isAdmin, async (req: LoggingRequest, res: Response) => {
        try {
            const meetingId = parseInt(req.params.id);
            const meeting = await storage.getMeeting(meetingId);
            const success = await storage.deleteMeeting(meetingId);
            if (!success) {
                return res.status(404).json({ message: "Meeting not found" });
            }

            await req.logActivity({
                action: "MEETING_DELETE" as const,
                entityType: "MEETING" as const,
                entityId: meetingId,
                metadata: { originalState: meeting },
            });

            res.sendStatus(204);
        } catch (error) {
            console.error("Error deleting meeting:", error);
            res.status(500).json({ message: "Failed to delete meeting" });
        }
    });

    // Existing routes
    app.get("/api/meetings", async (req: Request, res: Response) => {
        const meetings = await storage.getMeetings();
        res.json(meetings);
    });

    app.get("/api/meetings/:id", async (req: Request, res: Response) => {
        const meeting = await storage.getMeeting(parseInt(req.params.id));
        if (!meeting) {
            return res.status(404).send("Meeting not found");
        }
        res.json(meeting);
    });

    app.post("/api/meetings/:id/register", async (req: LoggingRequest, res: Response) => {
        if (!req.isAuthenticated()) {
            return res.status(401).send("Not authenticated");
        }

        const meetingId = parseInt(req.params.id);
        const userId = req.user!.id;

        const existing = await storage.getRegistration(userId, meetingId);
        if (existing) {
            return res.status(400).send("Already registered");
        }

        const meeting = await storage.getMeeting(meetingId);
        if (!meeting) {
            return res.status(404).send("Meeting not found");
        }

        const registration = await storage.createRegistration(userId, meetingId);

        // Send confirmation email
        try {
            const emailSent = await sendMeetingConfirmation(
                req.user!.email,
                req.user!.name,
                meeting
            );

            if (!emailSent) {
                console.warn(
                    `Failed to send confirmation email to ${req.user!.email} for meeting ${meeting.id}`
                );
            }
        } catch (error) {
            console.error("Failed to send confirmation email:", error);
            // Continue with registration even if email fails
        }

        await req.logActivity({
            action: "REGISTRATION_CREATE" as const,
            entityType: "REGISTRATION" as const,
            entityId: registration.id,
            metadata: { registration },
        });

        res.status(201).json(registration);
    });

    // Add new recommendation endpoint
    app.get("/api/recommendations", async (req: Request, res: Response) => {
        if (!req.isAuthenticated()) {
            return res.status(401).send("Not authenticated");
        }

        try {
            const recommendations = await getPersonalizedRecommendations(req.user!.id);
            res.json(recommendations);
        } catch (error) {
            console.error("Error getting recommendations:", error);
            res.status(500).json({ message: "Failed to get recommendations" });
        }
    });

    app.post("/api/login", async (req: LoggingRequest, res: Response, next: NextFunction) => {
        passport.authenticate("local", async (err, user, info) => {
            if (err) return next(err);
            if (!user) {
                return res.status(401).json({ message: info?.message || "Authentication failed" });
            }
            req.login(user, async (err) => {
                if (err) return next(err);

                await req.logActivity({
                    action: "USER_LOGIN" as const,
                    entityType: "USER" as const,
                    entityId: user.id,
                    metadata: { details: { username: user.username } },
                });

                res.json({ id: user.id, username: user.username, name: user.name, email: user.email, isAdmin: user.isAdmin });
            });
        })(req, res, next);
    });


    const httpServer = createServer(app);

    // Set up WebSocket server
    const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

    wss.on("connection", (ws) => {
        clients.add(ws);

        ws.on("close", () => {
            clients.delete(ws);
        });
    });

    // Check for upcoming meetings every minute
    setInterval(async () => {
        const meetings = await storage.getMeetings();
        const now = new Date();

        meetings.forEach((meeting) => {
            if (meeting.isUpcoming) {
                const meetingDate = new Date(meeting.date);
                const timeDiff = meetingDate.getTime() - now.getTime();
                const minutesUntilMeeting = Math.floor(timeDiff / (1000 * 60));

                // Notify 24 hours and 1 hour before the meeting
                if (minutesUntilMeeting === 24 * 60 || minutesUntilMeeting === 60) {
                    broadcastNotification({
                        type: "upcoming-meeting",
                        message: `Meeting "${meeting.title}" starts in ${
                            minutesUntilMeeting === 60 ? "1 hour" : "24 hours"
                        }`,
                    });
                }
            }
        });
    }, 60000); // Check every minute

    return httpServer;
}

// Admin middleware to check if user is admin
function isAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
    }
    next();
}

export { registerRoutes, broadcastNotification };

// Function to broadcast notifications to all connected clients
function broadcastNotification(notification: { type: string; message: string }) {
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(notification));
        }
    });
}