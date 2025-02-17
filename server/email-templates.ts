import { Meeting } from "@shared/schema";

interface TemplateData {
  userName: string;
  meeting: Meeting;
}

interface PasswordResetTemplateData {
  userName: string;
  resetLink: string;
}

export function getMeetingConfirmationTemplate({ userName, meeting }: TemplateData): { subject: string; html: string } {
  const meetingDate = new Date(meeting.date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return {
    subject: `Registration Confirmed: ${meeting.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #1a202c; margin: 0;">Meeting Registration Confirmed</h1>
        </div>

        <div style="padding: 20px;">
          <p>Dear ${userName},</p>

          <p>Your registration for the following meeting has been confirmed:</p>

          <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h2 style="color: #2563eb; margin-top: 0;">${meeting.title}</h2>
            <p style="color: #4b5563; margin: 10px 0;">${meeting.description}</p>
            <p style="color: #1a202c; font-weight: bold; margin: 10px 0;">Date and Time: ${meetingDate}</p>
          </div>

          ${meeting.videoUrl ? `
          <p>
            You can join the meeting using this link:
            <a href="${meeting.videoUrl}" style="color: #2563eb; text-decoration: none;">${meeting.videoUrl}</a>
          </p>
          ` : ''}

          <p style="margin-top: 20px;">
            Please add this event to your calendar. If you need to make any changes to your registration,
            please contact us.
          </p>

          <p style="margin-top: 20px;">
            Best regards,<br>
            Syrian Urban Reconstruction Team
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 0.875rem;">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    `
  };
}

export function getPasswordResetTemplate({ userName, resetLink }: PasswordResetTemplateData): { subject: string; html: string } {
  return {
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #1a202c; margin: 0;">Password Reset Request</h1>
        </div>

        <div style="padding: 20px;">
          <p>Dear ${userName},</p>

          <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetLink}"
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Your Password
            </a>
          </div>

          <p>
            This link will expire in 1 hour for security reasons. If you need a new reset link, you can request one from the login page.
          </p>

          <p style="margin-top: 20px;">
            Best regards,<br>
            Syrian Urban Reconstruction Team
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 0.875rem;">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    `
  };
}

export function getUpcomingMeetingReminderTemplate({ userName, meeting }: TemplateData): { subject: string; html: string } {
  const meetingDate = new Date(meeting.date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return {
    subject: `Reminder: ${meeting.title} is Coming Up`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #1a202c; margin: 0;">Meeting Reminder</h1>
        </div>

        <div style="padding: 20px;">
          <p>Dear ${userName},</p>

          <p>This is a reminder about your upcoming meeting:</p>

          <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h2 style="color: #2563eb; margin-top: 0;">${meeting.title}</h2>
            <p style="color: #4b5563; margin: 10px 0;">${meeting.description}</p>
            <p style="color: #1a202c; font-weight: bold; margin: 10px 0;">Date and Time: ${meetingDate}</p>
          </div>

          ${meeting.videoUrl ? `
          <p>
            You can join the meeting using this link:
            <a href="${meeting.videoUrl}" style="color: #2563eb; text-decoration: none;">${meeting.videoUrl}</a>
          </p>
          ` : ''}

          <p style="margin-top: 20px;">
            We look forward to seeing you at the meeting. If you can no longer attend,
            please let us know as soon as possible.
          </p>

          <p style="margin-top: 20px;">
            Best regards,<br>
            Syrian Urban Reconstruction Team
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 0.875rem;">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    `
  };
}

export function getNewMeetingNotificationTemplate({ userName, meeting }: TemplateData): { subject: string; html: string } {
  const meetingDate = new Date(meeting.date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const isPastMeeting = new Date(meeting.date) < new Date();

  return {
    subject: `New ${isPastMeeting ? 'Past ' : ''}Meeting Added: ${meeting.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #1a202c; margin: 0;">New ${isPastMeeting ? 'Past ' : ''}Meeting Added</h1>
        </div>

        <div style="padding: 20px;">
          <p>Dear ${userName},</p>

          <p>A new ${isPastMeeting ? 'past ' : ''}meeting has been added to the platform:</p>

          <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h2 style="color: #2563eb; margin-top: 0;">${meeting.title}</h2>
            <p style="color: #4b5563; margin: 10px 0;">${meeting.description}</p>
            <p style="color: #1a202c; font-weight: bold; margin: 10px 0;">Date and Time: ${meetingDate}</p>

            <div style="margin-top: 15px;">
              <p style="margin: 5px 0;"><strong>Categories:</strong> ${meeting.categories.join(', ')}</p>
              <p style="margin: 5px 0;"><strong>Topics:</strong> ${meeting.topics.join(', ')}</p>
            </div>
          </div>

          ${meeting.videoUrl ? `
          <p>
            You can access the meeting recording here:
            <a href="${meeting.videoUrl}" style="color: #2563eb; text-decoration: none;">${meeting.videoUrl}</a>
          </p>
          ` : ''}

          <p style="margin-top: 20px;">
            Best regards,<br>
            Syrian Urban Reconstruction Team
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 0.875rem;">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    `
  };
}