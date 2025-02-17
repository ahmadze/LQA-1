import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.meetings': 'Meetings',
    'nav.pastMeetings': 'Recorded Meetings',
    'nav.admin': 'Admin Dashboard',
    'nav.logout': 'Logout',
    'nav.welcome': 'Welcome',
    'nav.admin.prefix': 'Admin:',

    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.fullName': 'Full Name',
    'auth.email': 'Email',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.resetPassword': 'Reset Password',
    'auth.sendResetLink': 'Send Reset Link',
    'auth.cancel': 'Cancel',
    'auth.welcome': 'LIQA',
    'auth.title': 'Urban Reconstruction Platform',
    'auth.description': 'LIQA is a platform that connects expertise and discussions around the reconstruction of Syria.',
    'auth.longDescription': 'The platform\'s team facilitates regular meetings among architects, engineers, urban planners, researchers, and professionals from various fields related to urbanism, such as sociology, property and land rights, cultural heritage, and economics. LIQA aims to create intellectual spaces that allow us all to think and work towards a fair, informed, and sustainable urban reconstruction in Syria—one that ensures the rights of all Syrians to engage with public space and to imagine and shape the future of our cities and villages.',

    // Meetings
    'meeting.categories': 'Categories',
    'meeting.topics': 'Topics',
    'meeting.notes': 'Notes',
    'meeting.info': 'Info',
    'meeting.takeNotes': 'Take notes...',
    'meeting.addNote': 'Add Note',
    'meeting.share': 'Share',
    'meeting.copyLink': 'Copy Link',
    'meeting.linkCopied': 'Link copied!',
    'meeting.linkCopiedDesc': 'Meeting link has been copied to clipboard',
    'meeting.shareOn': 'Share on',
    'meeting.shareText': 'Check out this meeting',

    // Social Share
    'social.shareText': 'Join our Syrian Urban Reconstruction podcast platform!',
    'nav.deleteAccount': 'Delete Account',
    'nav.deleteAccount.confirm': 'Are you sure you want to delete your account? This action cannot be undone.',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.meetings': 'الاجتماعات',
    'nav.pastMeetings': 'الاجتماعات المسجلة',
    'nav.admin': 'لوحة الإدارة',
    'nav.logout': 'تسجيل الخروج',
    'nav.welcome': 'مرحباً',
    'nav.admin.prefix': 'مشرف:',

    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'إنشاء حساب',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.fullName': 'الاسم الكامل',
    'auth.email': 'البريد الإلكتروني',
    'auth.username': 'اسم المستخدم',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.resetPassword': 'إعادة تعيين كلمة المرور',
    'auth.sendResetLink': 'إرسال رابط إعادة التعيين',
    'auth.cancel': 'إلغاء',
    'auth.welcome': 'لقاء العمران',
    'auth.title': 'منصة ترابط وحوار حول إعادة الإعمار في سوريا',
    'auth.description': 'لقاء العمران منصة لربط الخبرات والنقاشات حول إعادة الإعمار في سوريا. يقوم فريق المنصة بتفعيل لقاءات دورية بين المعماريين/ات والمهندسين/ات ومخططي/ات المدن والباحثين/ات والعاملين/ات وذوي الخبرة في المجالات الأخرى المرتبطة بالعمران كعلم الاجتماع، وحقوق الملكيات والأراضي، والتراث الثقافي، والاقتصاد.',
    'auth.longDescription': 'يهدف لقاء العمران إلى خلق مساحات فكرية تسمح لنا جميعاً بالتفكير والعمل في إعادة إعمار حضرية وعادلة و مستنيرة في سوريا تكون منصفة ومستدامة وتضمن حق جميع السوريين/ات في التفاعل مع الفضاء العام وحقنا في كتابه وتخيل مستقبل مدننا وقرانا.',

    // Meetings
    'meeting.categories': 'التصنيفات',
    'meeting.topics': 'المواضيع',
    'meeting.notes': 'الملاحظات',
    'meeting.info': 'معلومات',
    'meeting.takeNotes': 'أضف ملاحظاتك...',
    'meeting.addNote': 'إضافة ملاحظة',
    'meeting.share': 'مشاركة',
    'meeting.copyLink': 'نسخ الرابط',
    'meeting.linkCopied': 'تم نسخ الرابط!',
    'meeting.linkCopiedDesc': 'تم نسخ رابط الاجتماع إلى الحافظة',
    'meeting.shareOn': 'مشاركة على',
    'meeting.shareText': 'شاهد هذا الاجتماع',

    // Social Share
    'social.shareText': 'انضموا إلى منصتنا للبودكاست حول إعادة إعمار سوريا!',
    'nav.deleteAccount': 'حذف الحساب',
    'nav.deleteAccount.confirm': 'هل أنت متأكد أنك تريد حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'ar' || saved === 'en' ? saved : 'en') as Language;
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;

    // Apply RTL-specific classes to body
    if (language === 'ar') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}