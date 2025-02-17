import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function Navbar() {
  const { user, logoutMutation, deleteAccountMutation } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  if (!user) return null;

  const handleShare = (platform: string) => {
    const shareUrl = window.location.origin;
    const text = "Join our Syrian Urban Reconstruction podcast platform!";

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
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleInstagramClick = () => {
    window.open('https://www.instagram.com/liqa_sy', '_blank', 'noopener,noreferrer');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleDeleteAccount = () => {
    if (window.confirm(t('nav.deleteAccount.confirm'))) {
      deleteAccountMutation.mutate();
    }
  };

  return (
    <nav className="border-b bg-primary">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between text-primary-foreground">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-8 w-auto object-contain transition-all duration-300 hover:scale-110 hover:rotate-[5deg]" 
            />
          </Link>
          <div className="hidden md:flex gap-6">
            <Link href="/" className="hover:text-white/80">{t('nav.home')}</Link>
            <Link href="/meetings" className="hover:text-white/80">{t('nav.meetings')}</Link>
            <Link href="/past-meetings" className="hover:text-white/80">{t('nav.pastMeetings')}</Link>
            {user.isAdmin && (
              <Link href="/admin" className="font-semibold hover:text-white/80">
                {t('nav.admin')}
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 border-r border-primary-foreground/20 pr-4 mr-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleShare('facebook')}
              title="Share on Facebook"
              className="hover:text-white/80"
            >
              <Facebook className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleShare('twitter')}
              title="Share on Twitter"
              className="hover:text-white/80"
            >
              <Twitter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleShare('linkedin')}
              title="Share on LinkedIn"
              className="hover:text-white/80"
            >
              <Linkedin className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleInstagramClick}
              title="Follow us on Instagram"
              className="hover:text-white/80"
            >
              <Instagram className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="font-medium hover:text-white/80"
          >
            {language === 'en' ? 'عربي' : 'English'}
          </Button>

          <span className="text-sm">
            {user.isAdmin ? (
              <span className="font-medium">
                {t('nav.admin.prefix')} {user.name}
              </span>
            ) : (
              <span>
                {t('nav.welcome')}, {user.name}
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="hover:text-white hover:bg-primary-foreground/10"
            >
              {t('nav.logout')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
            >
              {t('nav.deleteAccount')}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}