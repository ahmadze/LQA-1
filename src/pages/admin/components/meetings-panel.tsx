import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Meeting, insertMeetingSchema } from "@shared/schema";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

type MeetingFormData = {
  title: string;
  description: string;
  date: string;
  videoUrl: string | null;
  isUpcoming: boolean;
};

export default function MeetingsPanel() {
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(insertMeetingSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date().toISOString().slice(0, 16),
      videoUrl: null,
      isUpcoming: true,
    },
  });

  // Watch isUpcoming to update form validation
  const isUpcoming = form.watch("isUpcoming");

  const createMutation = useMutation({
    mutationFn: async (data: MeetingFormData) => {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          date: new Date(data.date).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create meeting');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Meeting created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: MeetingFormData & { id: number }) => {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          date: new Date(data.date).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update meeting');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setIsDialogOpen(false);
      setEditingMeeting(null);
      form.reset();
      toast({
        title: "Success",
        description: "Meeting updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete meeting');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: MeetingFormData) {
    if (!data.isUpcoming && !data.videoUrl) {
      form.setError("videoUrl", {
        type: "manual",
        message: "Video URL is required for past meetings",
      });
      return;
    }

    if (editingMeeting) {
      updateMutation.mutate({ ...data, id: editingMeeting.id });
    } else {
      createMutation.mutate(data);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meetings Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingMeeting(null);
                form.reset({
                  title: "",
                  description: "",
                  date: new Date().toISOString().slice(0, 16),
                  videoUrl: null,
                  isUpcoming: true,
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMeeting ? "Edit Meeting" : "Create Meeting"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value?.slice(0, 16) || new Date().toISOString().slice(0, 16)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isUpcoming"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Meeting Status</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          {field.value ? "This is an upcoming meeting" : "This is a past meeting"}
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            // Reset video URL when switching to upcoming
                            if (checked) {
                              form.setValue("videoUrl", null);
                              form.clearErrors("videoUrl");
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Video URL {!isUpcoming && <span className="text-destructive">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder={!isUpcoming ? "Enter video URL for the recorded meeting" : "Optional for upcoming meetings"}
                          disabled={isUpcoming}
                        />
                      </FormControl>
                      <div className="text-sm text-muted-foreground">
                        {!isUpcoming ? "Required for past meetings" : "Optional for upcoming meetings"}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!isUpcoming && !form.getValues("videoUrl")}
                >
                  {editingMeeting ? "Update" : "Create"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Video URL</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings?.map((meeting) => (
              <TableRow key={meeting.id}>
                <TableCell>{meeting.title}</TableCell>
                <TableCell>
                  {format(new Date(meeting.date), "PPp")}
                </TableCell>
                <TableCell>
                  {meeting.isUpcoming ? (
                    <Badge variant="secondary">Upcoming</Badge>
                  ) : (
                    <Badge>Past</Badge>
                  )}
                </TableCell>
                <TableCell>{meeting.videoUrl || "Not available"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingMeeting(meeting);
                      form.reset({
                        ...meeting,
                        date: new Date(meeting.date).toISOString().slice(0, 16),
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this meeting?")) {
                        deleteMutation.mutate(meeting.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}