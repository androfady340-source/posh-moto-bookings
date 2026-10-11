import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Copy, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { vehicleQuery, formatEGP, depositFor, INSTAPAY_NUMBER } from "@/lib/vehicles";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/book/$id")({
  head: () => ({
    meta: [
      { title: "Book Your Vehicle — Noir Auto Haus" },
      { name: "description", content: "Reserve a luxury car or motorcycle with a 5% InstaPay deposit." },
      { property: "og:title", content: "Book Your Vehicle — Noir Auto Haus" },
      { property: "og:description", content: "Reserve with a 5% InstaPay deposit." },
    ],
  }),
  component: BookPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Name too short").max(100),
  phone: z.string().trim().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
  email: z.union([z.literal(""), z.string().trim().email("Invalid email").max(255)]),
  city: z.string().trim().max(100),
  booking_type: z.enum(["reserve", "viewing", "both"]),
  preferred_date: z.string().min(1, "Pick a date"),
  preferred_time: z.string().min(1, "Pick a time").max(10),
  instapay_sender: z.string().trim().min(2, "Enter InstaPay sender").max(100),
  notes: z.string().trim().max(1000),
});

const field = "w-full border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary";

function BookPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { data: v } = useQuery(vehicleQuery(id));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!v) return <div className="pt-32 text-center text-muted-foreground">…</div>;
  const deposit = depositFor(Number(v.price_egp));
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const d = parsed.data;
    setBusy(true);
    const { error } = await supabase.from("bookings").insert({
      vehicle_id: id,
      ...d,
      email: d.email || null,
      city: d.city || null,
      notes: d.notes || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
  }

  if (done)
    return (
      <div className="mx-auto max-w-lg px-6 pb-24 pt-36 text-center animate-fade-up">
        <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-6 text-4xl">{t("booked")}</h1>
        <p className="mt-4 text-muted-foreground">{t("bookedMsg")}</p>
        <Link to="/" className="mt-8 inline-block border border-primary px-8 py-3 text-xs uppercase tracking-widest text-primary">
          {t("back")}
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-28 animate-fade-up">
      <p className="text-xs uppercase tracking-[0.4em] text-primary">{t("booking")}</p>
      <h1 className="mt-2 text-4xl">{v.brand} {v.name}</h1>

      <div className="mt-8 border border-primary/50 bg-card p-6 shadow-gold">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("deposit")}</p>
        <p className="font-display text-4xl text-gold-gradient">{formatEGP(deposit)}</p>
        <p className="mt-4 text-sm text-muted-foreground">{t("payInsta")}</p>
        <div className="mt-2 flex items-center gap-3">
          <span dir="ltr" className="font-mono text-2xl tracking-widest">{INSTAPAY_NUMBER}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(INSTAPAY_NUMBER);
              toast.success(t("copied"));
            }}
            className="flex items-center gap-1 border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary"
          >
            <Copy className="h-3 w-3" /> {t("copy")}
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
        <input name="full_name" required maxLength={100} placeholder={t("fullName")} className={field} />
        <input name="phone" required maxLength={15} inputMode="tel" placeholder={t("phone")} className={field} dir="ltr" />
        <input name="email" type="email" maxLength={255} placeholder={t("email")} className={field} />
        <input name="city" maxLength={100} placeholder={t("city")} className={field} />
        <label className="sm:col-span-2 text-xs uppercase tracking-widest text-muted-foreground">{t("bookingType")}</label>
        <select name="booking_type" defaultValue="both" className={`${field} sm:col-span-2`}>
          <option value="reserve">{t("reserve")}</option>
          <option value="viewing">{t("viewing")}</option>
          <option value="both">{t("both")}</option>
        </select>
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">{t("date")}</label>
          <input name="preferred_date" type="date" min={today} required className={field} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">{t("time")}</label>
          <input name="preferred_time" type="time" required className={field} />
        </div>
        <input name="instapay_sender" required maxLength={100} placeholder={t("sender")} className={`${field} sm:col-span-2`} />
        <textarea name="notes" maxLength={1000} rows={3} placeholder={t("notes")} className={`${field} sm:col-span-2`} />
        <button disabled={busy} className="sm:col-span-2 bg-gold-gradient py-4 text-xs uppercase tracking-[0.3em] text-primary-foreground disabled:opacity-50">
          {t("confirm")}
        </button>
      </form>
    </div>
  );
}
