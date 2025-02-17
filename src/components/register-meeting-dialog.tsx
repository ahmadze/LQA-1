import { Meeting } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RegisterMeetingDialogProps {
  meeting: Meeting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RegisterMeetingDialog({ meeting, open, onOpenChange }: RegisterMeetingDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const registerMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/meetings/${meeting.id}/register`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Successfully registered",
        description: "You are now registered for this meeting",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register for Meeting</DialogTitle>
          <DialogDescription>
            Register for "{meeting.title}" on {new Date(meeting.date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Registered as: {user?.name}
          </p>

          <Button 
            className="w-full"
            onClick={() => registerMutation.mutate()}
            disabled={registerMutation.isPending}
          >
            Confirm Registration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
