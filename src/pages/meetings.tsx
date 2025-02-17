import { useQuery } from "@tanstack/react-query";
import { Meeting } from "@shared/schema";
import MeetingCard from "@/components/meeting-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import RegisterMeetingDialog from "@/components/register-meeting-dialog";
import RecommendedMeetings from "@/components/recommended-meetings";
import MeetingFilters from "@/components/meeting-filters";
import { DateRange } from "react-day-picker";
import { isWithinInterval } from "date-fns";

export default function Meetings() {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>();

  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  const uniqueCategories = Array.from(
    new Set(meetings?.flatMap(m => m.categories) || [])
  );

  const filteredMeetings = meetings?.filter(meeting => {
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
  }) || [];

  const upcomingMeetings = filteredMeetings.filter(m => m.isUpcoming);
  const recordedMeetings = filteredMeetings.filter(m => !m.isUpcoming);

  const handleRegister = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsRegistrationOpen(true);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setDateRange(undefined);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <MeetingFilters
          categories={uniqueCategories}
          onSearch={setSearchQuery}
          onFilterCategories={setSelectedCategories}
          onFilterDates={setDateRange}
          onReset={handleReset}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Upcoming Meetings
              {upcomingMeetings.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({upcomingMeetings.length})
                </span>
              )}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {upcomingMeetings.map(meeting => (
                <MeetingCard 
                  key={meeting.id} 
                  meeting={meeting} 
                  onRegister={() => handleRegister(meeting)}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">
              Recorded Meetings
              {recordedMeetings.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({recordedMeetings.length})
                </span>
              )}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {recordedMeetings.map(meeting => (
                <MeetingCard 
                  key={meeting.id} 
                  meeting={meeting} 
                  showRegistration={false}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-start-3">
          <div className="sticky top-6">
            <h2 className="text-2xl font-bold mb-6">Recommended for You</h2>
            <RecommendedMeetings onRegister={handleRegister} />
          </div>
        </div>
      </div>

      {selectedMeeting && (
        <RegisterMeetingDialog
          meeting={selectedMeeting}
          open={isRegistrationOpen}
          onOpenChange={setIsRegistrationOpen}
        />
      )}
    </div>
  );
}