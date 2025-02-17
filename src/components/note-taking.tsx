import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Annotation } from "@shared/schema";
import { format } from "date-fns";
import { useLanguage } from "@/hooks/use-language";

interface NoteTakingProps {
  meetingId: number;
  currentTimestamp: number;
}

export default function NoteTaking({ meetingId, currentTimestamp }: NoteTakingProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [noteText, setNoteText] = useState("");
  const queryClient = useQueryClient();

  const { data: annotations } = useQuery<Annotation[]>({
    queryKey: ["/api/meetings", meetingId, "annotations"],
    refetchInterval: 5000, // Poll every 5 seconds for new annotations
  });

  const createAnnotation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/meetings/${meetingId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: noteText,
          timestamp: currentTimestamp,
        }),
      });
      if (!response.ok) throw new Error("Failed to create annotation");
      return response.json();
    },
    onSuccess: () => {
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId, "annotations"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim()) {
      createAnnotation.mutate();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {annotations?.map((annotation) => (
            <div
              key={annotation.id}
              className="mb-4 rounded-lg bg-muted p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {annotation.userId === user?.id ? "You" : "Anonymous"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(annotation.createdAt), "PP p")}
                </span>
              </div>
              <p className="text-sm">{annotation.text}</p>
              <div className="mt-1 text-xs text-muted-foreground">
                at {Math.floor(annotation.timestamp / 60)}:{(annotation.timestamp % 60).toString().padStart(2, "0")}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={t('meeting.takeNotes')}
          className="min-h-[100px]"
        />
        <Button
          type="submit"
          className="mt-2"
          disabled={createAnnotation.isPending || !noteText.trim()}
        >
          {t('meeting.addNote')}
        </Button>
      </form>
    </div>
  );
}