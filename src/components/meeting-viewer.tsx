import { useState } from "react";
import ReactPlayer from "react-player";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import NoteTaking from "@/components/note-taking";
import { Meeting } from "@shared/schema";
import { Share2, Facebook, Twitter, Linkedin, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

interface MeetingViewerProps {
  meeting: Meeting;
}

export default function MeetingViewer({ meeting }: MeetingViewerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleProgress = (state: { playedSeconds: number }) => {
    setCurrentTime(Math.floor(state.playedSeconds));
  };

  const handleShare = async (platform: string) => {
    const shareUrl = window.location.href;
    const title = meeting.title;
    const text = `${t('meeting.shareText')}: ${title}`;

    let shareLink = '';
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: t('meeting.linkCopied'),
            description: t('meeting.linkCopiedDesc'),
          });
          return;
        } catch (err) {
          console.error('Failed to copy:', err);
          return;
        }
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="p-4">
          <ReactPlayer
            url={meeting.videoUrl || ""}
            width="100%"
            height="auto"
            controls
            onProgress={handleProgress}
          />
          <div className="flex items-center justify-between mt-4">
            <h1 className="text-2xl font-bold">{meeting.title}</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('facebook')}
                title={`${t('meeting.shareOn')} Facebook`}
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('twitter')}
                title={`${t('meeting.shareOn')} Twitter`}
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('linkedin')}
                title={`${t('meeting.shareOn')} LinkedIn`}
              >
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('copy')}
                title={t('meeting.copyLink')}
              >
                <Link className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">{meeting.description}</p>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="notes" className="flex-1">{t('meeting.notes')}</TabsTrigger>
            <TabsTrigger value="info" className="flex-1">{t('meeting.info')}</TabsTrigger>
          </TabsList>

          <TabsContent value="notes">
            <Card className="p-4">
              <NoteTaking 
                meetingId={meeting.id} 
                currentTimestamp={currentTime}
              />
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">{t('meeting.categories')}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {meeting.categories.map((category) => (
                  <span
                    key={category}
                    className="px-2 py-1 bg-muted rounded-full text-xs"
                  >
                    {category}
                  </span>
                ))}
              </div>

              <h3 className="font-semibold mb-2">{t('meeting.topics')}</h3>
              <div className="flex flex-wrap gap-2">
                {meeting.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-2 py-1 bg-muted rounded-full text-xs"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}