import { Router } from 'express';
import { db } from '../db';
import { meetings, registrations, users, annotations } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendMeetingRegistrationEmail } from '../utils/email';
import { insertAnnotationSchema } from '@shared/schema';

const router = Router();

// Register for a meeting
router.post('/meetings/:id/register', async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if meeting exists and is upcoming
    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.id, meetingId)
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (!meeting.isUpcoming) {
      return res.status(400).json({ message: 'Cannot register for past meetings' });
    }

    // Check if already registered
    const existingRegistration = await db.query.registrations.findFirst({
      where: (reg) => 
        eq(reg.meetingId, meetingId) && 
        eq(reg.userId, userId)
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this meeting' });
    }

    // Create registration
    await db.insert(registrations).values({
      meetingId,
      userId,
      registrationDate: new Date()
    });

    // Get user details for email
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (user?.email) {
      try {
        await sendMeetingRegistrationEmail(user.email, user.name, meeting);
      } catch (error) {
        console.error('Failed to send registration email:', error);
        // Don't fail the registration if email fails
      }
    }

    res.status(200).json({ message: 'Successfully registered for meeting' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register for meeting' });
  }
});

// Get annotations for a meeting
router.get('/meetings/:id/annotations', async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);

    const meetingAnnotations = await db.query.annotations.findMany({
      where: eq(annotations.meetingId, meetingId),
      orderBy: annotations.timestamp,
    });

    res.json(meetingAnnotations);
  } catch (error) {
    console.error('Error fetching annotations:', error);
    res.status(500).json({ message: 'Failed to fetch annotations' });
  }
});

// Create an annotation
router.post('/meetings/:id/annotations', async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const validatedData = insertAnnotationSchema.parse({
      ...req.body,
      meetingId,
      userId,
    });

    const annotation = await db.insert(annotations)
      .values(validatedData)
      .returning();

    res.status(201).json(annotation[0]);
  } catch (error) {
    console.error('Error creating annotation:', error);
    res.status(500).json({ message: 'Failed to create annotation' });
  }
});

export default router;