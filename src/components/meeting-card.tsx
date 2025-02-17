import { Meeting } from "@shared/schema";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Video } from "lucide-react";

interface MeetingCardProps {
  meeting: Meeting;
  onRegister?: () => void;
  showRegistration?: boolean;
}

export default function MeetingCard({ meeting, onRegister, showRegistration = true }: MeetingCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <h3 className="font-semibold">{meeting.title}</h3>
          {meeting.isUpcoming ? (
            <CalendarDays className="h-5 w-5 text-primary" />
          ) : (
            <Video className="h-5 w-5 text-primary" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{meeting.description}</p>
        <time className="text-sm text-gray-500">
          {new Date(meeting.date).toLocaleDateString()}
        </time>
      </CardContent>
      <CardFooter>
        {meeting.isUpcoming && showRegistration ? (
          <Button 
            className="w-full" 
            onClick={onRegister}
          >
            Register
          </Button>
        ) : meeting.videoUrl ? (
          <Button className="w-full" asChild>
            <a 
              href={meeting.videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Watch Recording
            </a>
          </Button>
        ) : (
          <Button className="w-full" disabled>
            Recording Not Available
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}