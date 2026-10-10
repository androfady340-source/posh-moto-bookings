import { Link } from "@tanstack/react-router";
import { Moon, Sun, Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function SiteHeader() {
  const { t, lang, setLang, theme, setTheme } = useI18n();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="font-display text-xl tracking-[0.3em] text-gold-gradient">
          {t("brand")}
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="flex items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label="Toggle language"
          >
            <Languages className="h-4 w-4" /> {lang === "en" ? "عربي" : "EN"}
          </button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-sm border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border py-10 text-center text-xs tracking-widest text-muted-foreground">
      <p className="font-display text-lg text-gold-gradient">{t("brand")}</p>
      <p className="mt-2">© {new Date().getFullYear()} — {t("rights")}</p>
    </footer>
  );
}
