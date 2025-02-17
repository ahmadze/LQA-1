import { Meeting, Registration, User } from "@shared/schema";
import { db } from "./db";
import { and, eq, sql } from "drizzle-orm";
import { meetings, registrations, users } from "@shared/schema";

interface RecommendationScore {
  meeting: Meeting;
  score: number;
  reasons: string[];
}

export async function getPersonalizedRecommendations(userId: number): Promise<RecommendationScore[]> {
  // Get user data and preferences
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new Error("User not found");
  }

  // Get user's past registrations
  const userRegistrations = await db
    .select()
    .from(registrations)
    .where(eq(registrations.userId, userId));

  // Get all upcoming meetings
  const upcomingMeetings = await db
    .select()
    .from(meetings)
    .where(and(
      eq(meetings.isUpcoming, true),
      sql`${meetings.date} > NOW()`
    ));

  // Calculate recommendations
  const recommendations: RecommendationScore[] = [];

  for (const meeting of upcomingMeetings) {
    // Skip meetings user is already registered for
    if (userRegistrations.some(r => r.meetingId === meeting.id)) {
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    // Check category matches
    if (user.preferences?.interests) {
      const categoryMatches = meeting.categories.filter(c => 
        user.preferences?.interests.includes(c)
      ).length;
      if (categoryMatches > 0) {
        score += categoryMatches * 2;
        reasons.push(`Matches ${categoryMatches} of your interests`);
      }
    }

    // Check time preferences
    if (user.preferences?.preferredDays) {
      const meetingDay = new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long' });
      if (user.preferences.preferredDays.includes(meetingDay.toLowerCase())) {
        score += 1;
        reasons.push('Scheduled on your preferred day');
      }
    }

    // Check past attendance patterns
    const attendedSimilarMeetings = userRegistrations.filter(reg =>
      upcomingMeetings
        .find(m => m.id === reg.meetingId)
        ?.categories
        .some(c => meeting.categories.includes(c))
    ).length;

    if (attendedSimilarMeetings > 0) {
      score += attendedSimilarMeetings;
      reasons.push(`Similar to ${attendedSimilarMeetings} meetings you've attended`);
    }

    recommendations.push({
      meeting,
      score,
      reasons
    });
  }

  // Sort by score (highest first) and return top recommendations
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
