import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginData, type RegisterData, insertUserSchema } from "@shared/schema";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

type ForgotPasswordData = {
  email: string;
};

type ResetPasswordData = {
  password: string;
  confirmPassword: string;
};

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();
  const [isResetting, setIsResetting] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(insertUserSchema.pick({ username: true, password: true })),
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(insertUserSchema.pick({ username: true, password: true, name: true, email: true })),
  });

  const forgotPasswordForm = useForm<ForgotPasswordData>({
    resolver: zodResolver(insertUserSchema.pick({ email: true })),
  });

  const resetPasswordForm = useForm<ResetPasswordData>();

  const handleForgotPassword = async (data: ForgotPasswordData) => {
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to send reset email');

      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions",
      });

      setIsResetting(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (data: ResetPasswordData) => {
    if (data.password !== data.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: data.password,
        }),
      });

      if (!response.ok) throw new Error('Failed to reset password');

      toast({
        title: "Success",
        description: "Your password has been reset successfully",
      });

      setIsResetting(false);
      setResetToken(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="lg:hidden bg-primary text-primary-foreground p-4 sm:p-6">
        <div className="max-w-md mx-auto">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 object-contain"
          />
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">{t('auth.welcome')}</h1>
          <h2 className="text-lg sm:text-xl mb-2 text-center">{t('auth.title')}</h2>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-[400px] p-4 sm:p-6">
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="font-medium hover:bg-primary/10 hover:text-primary"
            >
              {language === 'en' ? 'عربي' : 'English'}
            </Button>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t('auth.login')}
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t('auth.register')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">{t('auth.username')}</Label>
                    <Input {...loginForm.register("username")} className="bg-background" />
                  </div>
                  <div>
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <Input type="password" {...loginForm.register("password")} className="bg-background" />
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loginMutation.isPending}>
                    {t('auth.login')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm hover:bg-primary/10 hover:text-primary"
                    onClick={() => setIsResetting(true)}
                  >
                    {t('auth.forgotPassword')}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">{t('auth.fullName')}</Label>
                    <Input {...registerForm.register("name")} className="bg-background" />
                  </div>
                  <div>
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input type="email" {...registerForm.register("email")} className="bg-background" />
                  </div>
                  <div>
                    <Label htmlFor="username">{t('auth.username')}</Label>
                    <Input {...registerForm.register("username")} className="bg-background" />
                  </div>
                  <div>
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <Input type="password" {...registerForm.register("password")} className="bg-background" />
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={registerMutation.isPending}>
                    {t('auth.register')}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          {isResetting && (
            <div className="mt-6 animate-in slide-in-from-right">
              <h3 className="font-semibold mb-4">{t('auth.resetPassword')}</h3>
              <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                <div>
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input type="email" {...forgotPasswordForm.register("email")} className="bg-background" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    {t('auth.sendResetLink')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsResetting(false)} className="hover:bg-primary/10">
                    {t('auth.cancel')}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary text-primary-foreground overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto px-6 xl:px-8 py-6 xl:py-8 flex flex-col justify-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-24 xl:w-32 h-24 xl:h-32 mx-auto mb-4 object-contain transition-all duration-500 hover:scale-105 hover:rotate-[3deg] cursor-pointer"
          />
          <h1 className="text-2xl xl:text-3xl font-bold mb-3 text-center">{t('auth.welcome')}</h1>
          <h2 className="text-xl xl:text-2xl mb-4 text-center">{t('auth.title')}</h2>
          <div className="space-y-4 text-sm sm:text-base xl:text-lg">
            <p className="text-justify leading-relaxed">
              {t('auth.description')}
            </p>
            <p className="text-justify leading-relaxed">
              {t('auth.longDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}