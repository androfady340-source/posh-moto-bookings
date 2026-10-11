import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import heroCar from "@/assets/hero-car.png";
import { useI18n } from "@/lib/i18n";
import { vehiclesQuery, reviewsQuery, formatEGP } from "@/lib/vehicles";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Noir Auto Haus — Luxury Cars & Superbikes Showroom" },
      { name: "description", content: "Lamborghini, Rolls-Royce, Ferrari, Ducati and more. Book online with an InstaPay deposit." },
      { property: "og:title", content: "Noir Auto Haus — Luxury Showroom" },
      { property: "og:description", content: "Rare machines. Quiet luxury. Book your next supercar online." },
    ],
  }),
  component: Index,
});

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden bg-hero pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-[62%] h-px overflow-hidden">
        <div className="h-px w-1/3 bg-gold-gradient animate-streak" />
      </div>
      <div className="z-10 px-6 text-center animate-fade-up">
        <p className="mb-4 text-xs uppercase tracking-[0.5em] text-primary">{t("tagline")}</p>
        <h1 className="text-5xl font-semibold md:text-8xl">
          <span className="text-gold-gradient">{t("brand")}</span>
        </h1>
      </div>
      <div className="relative z-10 mt-6 w-full max-w-5xl px-6" dir="ltr">
        <div className="animate-drive-in">
          <img src={heroCar} alt="Luxury supercar" width={1536} height={768} className="w-full animate-float-car drop-shadow-2xl" />
        </div>
        <div className="mx-auto -mt-10 h-6 w-3/4 rounded-full bg-foreground/20 blur-2xl" />
      </div>
      <a href="#collection" className="z-10 mt-6 border border-primary px-8 py-3 text-xs uppercase tracking-[0.3em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
        {t("explore")}
      </a>
    </section>
  );
}

function Collection() {
  const { t } = useI18n();
  const { data = [], isLoading } = useQuery(vehiclesQuery);
  const [filter, setFilter] = useState<"all" | "car" | "motorcycle">("all");
  const list = data.filter((v) => filter === "all" || v.type === filter);

  return (
    <section id="collection" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12 flex flex-col items-center gap-6">
        <h2 className="text-4xl md:text-5xl">{t("collection")}</h2>
        <div className="flex gap-1 border border-border p-1">
          {(["all", "car", "motorcycle"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 text-xs uppercase tracking-widest transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t(f === "all" ? "all" : f === "car" ? "cars" : "motorcycles")}
            </button>
          ))}
        </div>
      </div>
      {isLoading && <p className="text-center text-muted-foreground">…</p>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => (
          <Link key={v.id} to="/vehicles/$id" params={{ id: v.id }} className="group relative block overflow-hidden border border-border bg-card">
            <div className="aspect-[4/3] overflow-hidden">
              {v.vehicle_images[0] && (
                <img src={v.vehicle_images[0].url} alt={`${v.brand} ${v.name}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">{v.brand}</p>
              <h3 className="text-2xl">{v.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{formatEGP(Number(v.price_egp))}</p>
            </div>
            {!v.is_available && (
              <span className="absolute end-3 top-3 bg-destructive px-2 py-1 text-[10px] uppercase tracking-widest text-destructive-foreground">{t("unavailable")}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

const reviewSchema = z.object({
  name: z.string().trim().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(500),
});

function Reviews() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data = [] } = useQuery(reviewsQuery);
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = reviewSchema.safeParse({ name: fd.get("name"), comment: fd.get("comment"), rating });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.from("reviews").insert(parsed.data);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("reviewThanks"));
    (e.target as HTMLFormElement).reset();
    qc.invalidateQueries({ queryKey: ["reviews"] });
  }

  return (
    <section className="border-t border-border bg-card/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-12 text-center text-4xl md:text-5xl">{t("reviews")}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {data.map((r) => (
            <div key={r.id} className="border border-border bg-card p-6">
              <div className="mb-3 flex gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-current" : "opacity-30"}`} />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">“{r.comment}”</p>
              <p className="mt-4 font-display text-lg">{r.name}</p>
            </div>
          ))}
        </div>
        <form onSubmit={onSubmit} className="mx-auto mt-16 max-w-xl space-y-4 border border-border p-6">
          <h3 className="text-2xl">{t("leaveReview")}</h3>
          <div className="flex gap-1 text-primary">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={`h-6 w-6 ${n <= rating ? "fill-current" : "opacity-30"}`} />
              </button>
            ))}
          </div>
          <input name="name" maxLength={60} required placeholder={t("name")} className="w-full border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
          <textarea name="comment" maxLength={500} required rows={3} placeholder={t("comment")} className="w-full border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
          <button disabled={busy} className="bg-gold-gradient px-8 py-3 text-xs uppercase tracking-[0.3em] text-primary-foreground disabled:opacity-50">
            {t("submit")}
          </button>
        </form>
      </div>
    </section>
  );
}

function Index() {
  return (
    <>
      <Hero />
      <Collection />
      <Reviews />
    </>
  );
}
