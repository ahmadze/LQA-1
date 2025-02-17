import nodemailer from 'nodemailer';
import { Meeting } from '@shared/schema';
import { getMeetingConfirmationTemplate, getUpcomingMeetingReminderTemplate } from './email-templates';
import { getNewMeetingNotificationTemplate } from './email-templates';
import { type User } from '@shared/schema';

if (!process.env.LIQA_EMAIL || !process.env.LIQA_EMAIL_PASSWORD) {
  throw new Error("Email credentials not found in environment variables");
}

// Create reusable transporter
async function createTransporter() {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.LIQA_EMAIL,
        pass: process.env.LIQA_EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return transporter;
  } catch (err) {
    const error = err as Error;
    console.error('Email configuration error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const transporter = await createTransporter();
    console.log('Attempting to send email to:', to);

    const mailOptions = {
      from: {
        name: 'Liqa Platform',
        address: process.env.LIQA_EMAIL!
      },
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      to: to,
      subject: subject
    });
    return true;
  } catch (err) {
    const error = err as Error;
    console.error('Failed to send email:', {
      name: error.name,
      message: error.message,
      to: to,
      subject: subject
    });
    return false;
  }
}

export async function sendMeetingConfirmation(
  userEmail: string,
  userName: string,
  meeting: Meeting
): Promise<boolean> {
  try {
    const transporter = await createTransporter();
    const template = getMeetingConfirmationTemplate({ userName, meeting });

    const mailOptions = {
      from: {
        name: 'Liqa Platform',
        address: process.env.LIQA_EMAIL!
      },
      to: userEmail,
      subject: template.subject,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Meeting confirmation email sent successfully:', {
      messageId: info.messageId,
      response: info.response
    });
    return true;
  } catch (err) {
    const error = err as Error;
    console.error('Failed to send meeting confirmation email:', {
      name: error.name,
      message: error.message
    });
    return false;
  }
}

export async function sendMeetingReminder(
  userEmail: string,
  userName: string,
  meeting: Meeting
): Promise<boolean> {
  try {
    const transporter = await createTransporter();
    const template = getUpcomingMeetingReminderTemplate({ userName, meeting });

    const mailOptions = {
      from: {
        name: 'Liqa Platform',
        address: process.env.LIQA_EMAIL!
      },
      to: userEmail,
      subject: template.subject,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Meeting reminder email sent successfully:', {
      messageId: info.messageId,
      response: info.response
    });
    return true;
  } catch (err) {
    const error = err as Error;
    console.error('Failed to send meeting reminder email:', {
      name: error.name,
      message: error.message
    });
    return false;
  }
}

export async function sendNewMeetingNotification(
  users: User[],
  meeting: Meeting
): Promise<void> {
  try {
    const transporter = await createTransporter();
    console.log('Sending new meeting notifications to users');

    for (const user of users) {
      if (!user.email) continue;

      const template = getNewMeetingNotificationTemplate({ 
        userName: user.name || user.username, 
        meeting 
      });

      const mailOptions = {
        from: {
          name: 'Liqa Platform',
          address: process.env.LIQA_EMAIL!
        },
        to: user.email,
        subject: template.subject,
        html: template.html
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Meeting notification email sent successfully:', {
          messageId: info.messageId,
          response: info.response,
          userEmail: user.email
        });
      } catch (err) {
        const error = err as Error;
        console.error('Failed to send meeting notification email to user:', {
          userEmail: user.email,
          name: error.name,
          message: error.message
        });
        // Continue with other users even if one fails
      }
    }
  } catch (err) {
    const error = err as Error;
    console.error('Failed to send meeting notifications:', {
      name: error.name,
      message: error.message
    });
  }
}