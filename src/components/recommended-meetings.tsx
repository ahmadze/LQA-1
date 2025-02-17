import { useQuery } from "@tanstack/react-query";
import { Meeting } from "@shared/schema";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, ThumbsUp } from "lucide-react";
import { format } from "date-fns";

interface RecommendationScore {
  meeting: Meeting;
  score: number;
  reasons: string[];
}

export default function RecommendedMeetings({ onRegister }: { onRegister: (meeting: Meeting) => void }) {
  const { data: recommendations, isLoading } = useQuery<RecommendationScore[]>({
    queryKey: ["/api/recommendations"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!recommendations?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No recommendations available yet. Try registering for some meetings to get personalized suggestions!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-4">
        {recommendations.map(({ meeting, reasons }) => (
          <Card key={meeting.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{meeting.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(meeting.date), "PPp")}
                  </p>
                </div>
                <ThumbsUp className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{meeting.description}</p>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {meeting.categories.map((category) => (
                    <Badge key={category} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Why we recommend this:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <Button 
                  className="w-full mt-4"
                  onClick={() => onRegister(meeting)}
                >
                  Register Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
