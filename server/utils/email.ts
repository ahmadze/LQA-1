import nodemailer from 'nodemailer';
import { Meeting } from '@shared/schema';
import { format } from 'date-fns';

// Configure nodemailer with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendMeetingRegistrationEmail(
  userEmail: string,
  userName: string,
  meeting: Meeting
) {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Meeting Registration Confirmation</h2>
      <p>Dear ${userName},</p>
      <p>You have successfully registered for the following meeting:</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${meeting.title}</h3>
        <p>${meeting.description}</p>
        <p><strong>Date:</strong> ${format(new Date(meeting.date), 'PPp')}</p>
      </div>

      <p>We will send you a reminder 24 hours before the meeting.</p>
      
      <p>Best regards,<br>Syrian Urban Reconstruction Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.GMAIL_EMAIL,
    to: userEmail,
    subject: `Registration Confirmed: ${meeting.title}`,
    html: emailContent,
  });
}

export async function sendMeetingReminderEmail(
  userEmail: string,
  userName: string,
  meeting: Meeting
) {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Meeting Reminder</h2>
      <p>Dear ${userName},</p>
      <p>This is a reminder about your upcoming meeting:</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${meeting.title}</h3>
        <p>${meeting.description}</p>
        <p><strong>Date:</strong> ${format(new Date(meeting.date), 'PPp')}</p>
      </div>

      <p>Looking forward to seeing you!</p>
      
      <p>Best regards,<br>Syrian Urban Reconstruction Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.GMAIL_EMAIL,
    to: userEmail,
    subject: `Reminder: ${meeting.title} - Tomorrow`,
    html: emailContent,
  });
}

export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
