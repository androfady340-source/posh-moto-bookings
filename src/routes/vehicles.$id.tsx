import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { vehicleQuery, formatEGP, depositFor } from "@/lib/vehicles";

export const Route = createFileRoute("/vehicles/$id")({
  head: () => ({
    meta: [
      { title: "Vehicle Details — Noir Auto Haus" },
      { name: "description", content: "Full specifications, gallery and price. Book with an InstaPay deposit." },
      { property: "og:title", content: "Vehicle Details — Noir Auto Haus" },
      { property: "og:description", content: "Full specifications, gallery and price." },
    ],
  }),
  component: VehiclePage,
});

function VehiclePage() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const { data: v, isLoading } = useQuery(vehicleQuery(id));
  const [active, setActive] = useState(0);

  if (isLoading) return <div className="pt-32 text-center text-muted-foreground">…</div>;
  if (!v) return <div className="pt-32 text-center">Not found</div>;
  const img = v.vehicle_images[active] ?? v.vehicle_images[0];
  const price = Number(v.price_egp);

  const specs = [
    [t("year"), v.year],
    [t("hp"), v.horsepower ? `${v.horsepower} hp` : null],
    [t("topSpeed"), v.top_speed ? `${v.top_speed} km/h` : null],
    [t("accel"), v.acceleration],
    [t("engine"), v.engine],
  ].filter(([, val]) => val);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-28 animate-fade-up">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("back")}
      </Link>
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="relative aspect-[16/10] overflow-hidden border border-border bg-card">
            {img && <img key={img.id} src={img.url} alt={`${v.name} ${img.angle}`} className="h-full w-full object-cover animate-fade-up" />}
            {img && <span className="absolute start-3 top-3 bg-background/80 px-3 py-1 text-[10px] uppercase tracking-widest text-primary">{img.angle}</span>}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
            {v.vehicle_images.map((im, i) => (
              <button key={im.id} onClick={() => setActive(i)} className={`aspect-square overflow-hidden border ${i === active ? "border-primary" : "border-border opacity-60 hover:opacity-100"}`}>
                <img src={im.url} alt={im.angle} loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">{v.brand}</p>
          <h1 className="mt-2 text-5xl">{v.name}</h1>
          <p className="mt-6 leading-relaxed text-muted-foreground">{lang === "ar" ? v.description_ar || v.description_en : v.description_en}</p>
          <dl className="mt-8 divide-y divide-border border-y border-border">
            {specs.map(([k, val]) => (
              <div key={String(k)} className="flex justify-between py-3 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("price")}</p>
            <p className="font-display text-4xl text-gold-gradient">{formatEGP(price)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("deposit")}: {formatEGP(depositFor(price))}</p>
          </div>
          {v.is_available ? (
            <Link to="/book/$id" params={{ id: v.id }} className="mt-8 block bg-gold-gradient py-4 text-center text-xs uppercase tracking-[0.3em] text-primary-foreground shadow-gold transition-transform hover:scale-[1.02]">
              {t("bookNow")}
            </Link>
          ) : (
            <p className="mt-8 border border-destructive py-4 text-center text-xs uppercase tracking-widest text-destructive">{t("unavailable")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
