import { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player/youtube";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Play, Pause, SkipForward, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Annotation {
  id: number;
  timestamp: number;
  text: string;
  userId: number;
  createdAt: string;
}

interface VideoPlayerProps {
  url: string;
  meetingId: number;
}

export default function VideoPlayer({ url, meetingId }: VideoPlayerProps) {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationText, setAnnotationText] = useState("");
  const { toast } = useToast();

  const { data: annotations = [] } = useQuery<Annotation[]>({
    queryKey: ["/api/meetings", meetingId, "annotations"],
  });

  const addAnnotationMutation = useMutation({
    mutationFn: async (annotation: { text: string; timestamp: number }) => {
      const response = await fetch(`/api/meetings/${meetingId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(annotation),
      });
      if (!response.ok) throw new Error("Failed to add annotation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meetingId, "annotations"] });
      toast({
        title: "Annotation added",
        description: "Your annotation has been saved successfully.",
      });
      setIsAnnotating(false);
      setAnnotationText("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add annotation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatTimestamp = (seconds: number): string => {
    try {
      const date = new Date(0);
      date.setSeconds(seconds);
      return date.toISOString().substr(11, 8);
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "00:00:00";
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleProgress = (state: { played: number }) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setPlayed(value);
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(parseFloat((e.target as HTMLInputElement).value));
    }
  };

  const handleAddAnnotation = () => {
    if (!annotationText.trim()) return;

    if (!playerRef.current) {
      toast({
        title: "Error",
        description: "Video player is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const timestamp = Math.floor(playerRef.current.getCurrentTime() || 0);
      addAnnotationMutation.mutate({ text: annotationText, timestamp });
    } catch (error) {
      console.error("Error getting current time:", error);
      toast({
        title: "Error",
        description: "Failed to get current video time. Please try again.",
        variant: "destructive",
      });
    }
  };

  const jumpToAnnotation = (timestamp: number) => {
    if (!playerRef.current || !isReady) {
      toast({
        title: "Error",
        description: "Video player is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      playerRef.current.seekTo(timestamp, 'seconds');
    } catch (error) {
      console.error("Error seeking to timestamp:", error);
      toast({
        title: "Error",
        description: "Failed to jump to the timestamp.",
        variant: "destructive",
      });
    }
  };

  if (!url) {
    return (
      <div className="aspect-video w-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">No video available</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="aspect-video w-full relative group">
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          <ReactPlayer
            ref={playerRef}
            url={url}
            width="100%"
            height="100%"
            playing={isPlaying}
            volume={volume}
            onReady={() => setIsReady(true)}
            onProgress={handleProgress}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{ opacity: isReady ? 1 : 0 }}
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  origin: window.location.origin
                }
              }
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 transition-colors"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6 animate-in zoom-in duration-200" />
                    ) : (
                      <Play className="h-6 w-6 animate-in zoom-in duration-200" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{isPlaying ? "Pause" : "Play"}</p>
                </TooltipContent>
              </Tooltip>

              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step="any"
                  value={played}
                  onMouseDown={handleSeekMouseDown}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekMouseUp}
                  className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-125 transition-transform"
                />
                <span className="text-white text-sm font-medium">
                  {formatTimestamp(played * (playerRef.current?.getDuration() || 0))}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 transition-colors"
                      onClick={() => setVolume(volume === 0 ? 1 : 0)}
                    >
                      {volume === 0 ? (
                        <VolumeX className="h-6 w-6 animate-in zoom-in duration-200" />
                      ) : (
                        <Volume2 className="h-6 w-6 animate-in zoom-in duration-200" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{volume === 0 ? "Unmute" : "Mute"}</p>
                  </TooltipContent>
                </Tooltip>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step="any"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-125 transition-transform"
                />
              </div>
            </div>
          </div>
        </div>

        {user?.isAdmin && (
          <>
            <div className="flex gap-2">
              <Button
                variant={isAnnotating ? "secondary" : "outline"}
                onClick={() => setIsAnnotating(!isAnnotating)}
                disabled={!isReady}
                className={cn(
                  "transition-all duration-200 hover:scale-105",
                  isAnnotating && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {isAnnotating ? "Cancel" : "Add Annotation"}
              </Button>
            </div>

            {isAnnotating && (
              <div className="flex gap-2 animate-in slide-in-from-left duration-200">
                <Input
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  placeholder="Enter your annotation..."
                  className="flex-1"
                />
                <Button
                  onClick={handleAddAnnotation}
                  disabled={!annotationText.trim() || addAnnotationMutation.isPending || !isReady}
                  className="transition-all duration-200 hover:scale-105"
                >
                  Save
                </Button>
              </div>
            )}
          </>
        )}

        {annotations.length > 0 && (
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="font-semibold">Annotations</h3>
            <div className="space-y-2">
              {annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="flex items-start gap-2 p-2 hover:bg-accent rounded-md group transition-colors duration-200"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => jumpToAnnotation(annotation.timestamp)}
                    className="text-xs transition-transform hover:scale-105"
                    disabled={!isReady}
                  >
                    {formatTimestamp(annotation.timestamp)}
                  </Button>
                  <p className="text-sm flex-1">{annotation.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}