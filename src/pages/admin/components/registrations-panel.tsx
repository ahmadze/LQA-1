import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Registration, User, Meeting } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Extended type to include user and meeting details
type RegistrationWithDetails = Registration & {
  user: User;
  meeting: Meeting;
};

type GroupedRegistrations = {
  [meetingId: number]: {
    meeting: Meeting;
    registrations: RegistrationWithDetails[];
  };
};

export default function RegistrationsPanel() {
  const { data: registrations, isLoading } = useQuery<RegistrationWithDetails[]>({
    queryKey: ["/api/admin/registrations"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Group registrations by meeting
  const groupedRegistrations = registrations?.reduce<GroupedRegistrations>((acc, registration) => {
    if (!acc[registration.meetingId]) {
      acc[registration.meetingId] = {
        meeting: registration.meeting,
        registrations: [],
      };
    }
    acc[registration.meetingId].registrations.push(registration);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meeting Registrations</h2>
      </div>

      <div className="space-y-6">
        {Object.values(groupedRegistrations || {})
          .sort((a, b) => new Date(b.meeting.date).getTime() - new Date(a.meeting.date).getTime())
          .map(({ meeting, registrations }) => (
            <Card key={meeting.id} className="overflow-hidden">
              <CardHeader className="bg-muted">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{meeting.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(meeting.date), "PPp")}
                    </p>
                  </div>
                  <Badge variant={meeting.isUpcoming ? "secondary" : "default"}>
                    {meeting.isUpcoming ? "Upcoming" : "Past"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead className="text-right">Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((registration) => (
                      <TableRow key={`${meeting.id}-${registration.user.id}`}>
                        <TableCell>{registration.user.name}</TableCell>
                        <TableCell>{registration.user.email}</TableCell>
                        <TableCell>{registration.user.username}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={registration.user.isAdmin ? "default" : "secondary"}>
                            {registration.user.isAdmin ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-sm text-muted-foreground">
                  Total Registrations: {registrations.length}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}