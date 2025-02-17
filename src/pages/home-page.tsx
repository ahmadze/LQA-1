import { useQuery } from "@tanstack/react-query";
import { Meeting } from "@shared/schema";
import VideoPlayer from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function HomePage() {
  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const latestMeeting = meetings?.find(m => !m.isUpcoming && m.videoUrl);
  const upcomingMeetings = meetings?.filter(m => m.isUpcoming) || [];
  const recordedMeetings = meetings?.filter(m => !m.isUpcoming && m.videoUrl) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-[300px] w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Meetings Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Upcoming Meetings</h2>
            <Button asChild variant="outline">
              <Link href="/meetings">View All</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {upcomingMeetings.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center">No upcoming meetings scheduled</p>
                </CardContent>
              </Card>
            ) : (
              upcomingMeetings.slice(0, 3).map(meeting => (
                <Card key={meeting.id}>
                  <CardHeader>
                    <h3 className="font-semibold">{meeting.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(meeting.date), "PPp")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{meeting.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {meeting.categories.map(category => (
                        <Badge key={category} variant="outline">{category}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Recorded Meetings Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Recorded Meetings</h2>
            <Button asChild variant="outline">
              <Link href="/past-meetings">View All</Link>
            </Button>
          </div>

          {latestMeeting ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="max-w-2xl mx-auto">
                    <VideoPlayer url={latestMeeting.videoUrl!} meetingId={latestMeeting.id} />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">{latestMeeting.title}</h3>
                    <p className="text-sm text-gray-600">{latestMeeting.description}</p>
                  </div>
                </CardContent>
              </Card>

              {recordedMeetings.slice(1, 3).map(meeting => (
                <Card key={meeting.id}>
                  <CardHeader>
                    <h3 className="font-semibold">{meeting.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(meeting.date), "PPp")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{meeting.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {meeting.categories.map(category => (
                        <Badge key={category} variant="outline">{category}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center">No recorded meetings available</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}