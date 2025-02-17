import { useQuery } from "@tanstack/react-query";
import { Meeting } from "@shared/schema";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Video, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState } from "react";
import MeetingFilters from "@/components/meeting-filters";
import { DateRange } from "react-day-picker";
import { isWithinInterval } from "date-fns";

export default function PastMeetings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>();

  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const recordedMeetings = meetings?.filter(m => !m.isUpcoming && m.videoUrl) || [];

  const uniqueCategories = Array.from(
    new Set(recordedMeetings.flatMap(m => m.categories))
  );

  const filteredMeetings = recordedMeetings.filter(meeting => {
    // Filter by search query
    if (searchQuery && !meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !meeting.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by categories
    if (selectedCategories.length > 0 &&
        !meeting.categories.some(cat => selectedCategories.includes(cat))) {
      return false;
    }

    // Filter by date range
    if (dateRange?.from && dateRange?.to) {
      const meetingDate = new Date(meeting.date);
      if (!isWithinInterval(meetingDate, {
        start: dateRange.from,
        end: dateRange.to
      })) {
        return false;
      }
    }

    return true;
  });

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setDateRange(undefined);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Recorded Meeting Recordings</h1>
      </div>

      <div className="mb-8">
        <MeetingFilters
          categories={uniqueCategories}
          onSearch={setSearchQuery}
          onFilterCategories={setSelectedCategories}
          onFilterDates={setDateRange}
          onReset={handleReset}
        />
      </div>

      {filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">
              {recordedMeetings.length === 0 
                ? "No recorded meetings available yet."
                : "No meetings match your search criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredMeetings.map(meeting => (
            <Card key={meeting.id} className="overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                <div className="shrink-0 w-40 h-24 rounded-md overflow-hidden bg-muted">
                  <AspectRatio ratio={16 / 9} className="bg-muted">
                    {meeting.videoUrl && (
                      <div className="relative w-full h-full">
                        <img
                          src={`https://img.youtube.com/vi/${getYouTubeVideoId(meeting.videoUrl)}/mqdefault.jpg`}
                          alt={meeting.title}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/320x180?text=No+Preview';
                          }}
                        />
                      </div>
                    )}
                  </AspectRatio>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold truncate">{meeting.title}</h3>
                    <Badge variant="outline" className="shrink-0">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(meeting.date), "MMM d, yyyy")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{meeting.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {meeting.categories.map((category) => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  className="shrink-0"
                  asChild
                >
                  <a 
                    href={meeting.videoUrl || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Video className="h-4 w-4" />
                    Watch Recording
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to extract YouTube video ID from URL
function getYouTubeVideoId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts#\w\/\w\/.*\/))([^\/&\?]{10,12})/);
  return match?.[1] || null;
}