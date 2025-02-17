import { db } from '../db';
import { meetings, registrations, users, type Registration, type User } from '@shared/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { sendMeetingReminderEmail } from './email';
import { addHours } from 'date-fns';

export async function sendUpcomingMeetingReminders() {
  try {
    // Get meetings happening in the next 24 hours that haven't sent reminders
    const upcomingMeetings = await db.query.meetings.findMany({
      where: and(
        eq(meetings.isUpcoming, true),
        gt(meetings.date, new Date()),
        lt(meetings.date, addHours(new Date(), 24))
      )
    });

    for (const meeting of upcomingMeetings) {
      // Get all registrations for this meeting
      const registeredUsers = await db.query.registrations.findMany({
        where: eq(registrations.meetingId, meeting.id),
        with: {
          user: true
        }
      }) as (Registration & { user: User })[];

      // Send reminder emails to all registered users
      for (const registration of registeredUsers) {
        if (registration.user?.email) {
          try {
            await sendMeetingReminderEmail(
              registration.user.email,
              registration.user.name,
              meeting
            );
          } catch (error) {
            console.error(`Failed to send reminder email to ${registration.user.email}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error sending meeting reminders:', error);
  }
}