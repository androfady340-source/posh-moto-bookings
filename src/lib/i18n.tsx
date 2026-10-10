import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";
export type Theme = "dark" | "light";

const dict = {
  brand: { en: "NOIR AUTO HAUS", ar: "نوار أوتو هاوس" },
  tagline: { en: "Rare machines. Quiet luxury.", ar: "آلات نادرة. فخامة هادئة." },
  explore: { en: "Explore collection", ar: "استكشف المجموعة" },
  cars: { en: "Cars", ar: "سيارات" },
  motorcycles: { en: "Motorcycles", ar: "موتوسيكلات" },
  all: { en: "All", ar: "الكل" },
  collection: { en: "The Collection", ar: "المجموعة" },
  reviews: { en: "Client Reviews", ar: "آراء العملاء" },
  leaveReview: { en: "Leave a review", ar: "اكتب تقييمك" },
  name: { en: "Name", ar: "الاسم" },
  comment: { en: "Comment", ar: "التعليق" },
  submit: { en: "Submit", ar: "إرسال" },
  reviewThanks: { en: "Thank you! Your review will appear after approval.", ar: "شكراً! تقييمك هيظهر بعد المراجعة." },
  price: { en: "Price", ar: "السعر" },
  bookNow: { en: "Book now", ar: "احجز الآن" },
  back: { en: "Back", ar: "رجوع" },
  hp: { en: "Horsepower", ar: "القوة" },
  topSpeed: { en: "Top speed", ar: "السرعة القصوى" },
  accel: { en: "Acceleration", ar: "التسارع" },
  engine: { en: "Engine", ar: "المحرك" },
  year: { en: "Year", ar: "السنة" },
  booking: { en: "Booking", ar: "الحجز" },
  fullName: { en: "Full name", ar: "الاسم بالكامل" },
  phone: { en: "Phone (WhatsApp)", ar: "رقم الموبايل (واتساب)" },
  email: { en: "Email (optional)", ar: "الإيميل (اختياري)" },
  city: { en: "City", ar: "المدينة" },
  bookingType: { en: "Booking type", ar: "نوع الحجز" },
  reserve: { en: "Reserve the vehicle", ar: "حجز العربية" },
  viewing: { en: "Viewing appointment", ar: "ميعاد معاينة" },
  both: { en: "Reserve + viewing / pickup", ar: "حجز + معاينة / استلام" },
  date: { en: "Preferred date", ar: "التاريخ" },
  time: { en: "Preferred time", ar: "الوقت" },
  notes: { en: "Notes", ar: "ملاحظات" },
  deposit: { en: "Deposit (5%)", ar: "العربون (5%)" },
  payInsta: { en: "Pay the deposit via InstaPay to", ar: "ادفع العربون عن طريق إنستا باي على" },
  sender: { en: "InstaPay sender name / account", ar: "اسم أو حساب المحوّل على إنستا باي" },
  confirm: { en: "Confirm booking", ar: "تأكيد الحجز" },
  booked: { en: "Booking received", ar: "تم استلام الحجز" },
  bookedMsg: { en: "We'll verify your InstaPay deposit and contact you on WhatsApp shortly.", ar: "هنراجع العربون على إنستا باي ونكلمك على واتساب قريباً." },
  copy: { en: "Copy", ar: "نسخ" },
  copied: { en: "Copied", ar: "تم النسخ" },
  unavailable: { en: "Reserved", ar: "محجوزة" },
  views: { en: "Gallery", ar: "الصور" },
  rights: { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
} as const;

export type Key = keyof typeof dict;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; theme: Theme; setTheme: (t: Theme) => void; t: (k: Key) => string };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const l = localStorage.getItem("lang");
    const th = localStorage.getItem("theme");
    if (l === "ar" || l === "en") setLang(l);
    if (th === "light" || th === "dark") setTheme(th);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const t = (k: Key) => dict[k][lang];
  return <I18nCtx.Provider value={{ lang, setLang, theme, setTheme, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
