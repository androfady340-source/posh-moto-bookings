import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, MessageCircle, Trash2, LogOut, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { vehiclesQuery, formatEGP, whatsappLink } from "@/lib/vehicles";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — Noir Auto Haus" },
      { name: "description", content: "Showroom management dashboard." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Dashboard — Noir Auto Haus" },
      { property: "og:description", content: "Showroom management dashboard." },
    ],
  }),
  component: Admin,
});

const field = "w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const ANGLES = ["Front", "Rear", "Side", "Interior", "Dashboard", "Engine", "Wheels", "Detail"];

function Admin() {
  const nav = useNavigate();
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const [tab, setTab] = useState<"bookings" | "vehicles" | "reviews">("bookings");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { nav({ to: "/login" }); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      setState(isAdmin ? "ok" : "denied");
    })();
  }, [nav]);

  if (state === "loading") return <div className="pt-32 text-center text-muted-foreground">…</div>;
  if (state === "denied")
    return (
      <div className="pt-32 text-center">
        <p>Access denied.</p>
        <button onClick={() => supabase.auth.signOut().then(() => nav({ to: "/login" }))} className="mt-4 text-primary underline">Sign out</button>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-24">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl text-gold-gradient">Dashboard</h1>
        <div className="flex gap-1 border border-border p-1">
          {(["bookings", "vehicles", "reviews"] as const).map((x) => (
            <button key={x} onClick={() => setTab(x)} className={`px-4 py-2 text-xs uppercase tracking-widest ${tab === x ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{x}</button>
          ))}
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => nav({ to: "/login" }))} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
      {tab === "bookings" && <Bookings />}
      {tab === "vehicles" && <Vehicles />}
      {tab === "reviews" && <ReviewsAdmin />}
    </div>
  );
}

function Bookings() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*, vehicles(brand,name,price_egp)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-bookings"] });
  }
  async function del(id: string) {
    if (!confirm("Delete booking?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) { toast.error("Couldn't delete booking"); return; }
    qc.invalidateQueries({ queryKey: ["admin-bookings"] });
  }
  if (!data.length) return <p className="text-muted-foreground">No bookings yet.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.map((b) => (
        <div key={b.id} className="border border-border bg-card p-5 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary">{b.vehicles?.brand} {b.vehicles?.name}</p>
              <p className="font-display text-2xl">{b.full_name}</p>
            </div>
            <span className={`px-2 py-1 text-[10px] uppercase tracking-widest ${b.status === "paid" ? "bg-success text-background" : b.status === "cancelled" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>{b.status}</span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
            <dt>Phone</dt><dd dir="ltr" className="text-foreground">{b.phone}</dd>
            <dt>Email</dt><dd className="truncate text-foreground">{b.email || "—"}</dd>
            <dt>City</dt><dd className="text-foreground">{b.city || "—"}</dd>
            <dt>Type</dt><dd className="text-foreground">{b.booking_type}</dd>
            <dt>Date / time</dt><dd className="text-foreground">{b.preferred_date} · {b.preferred_time}</dd>
            <dt>Deposit</dt><dd className="text-foreground">{formatEGP(Number(b.deposit_egp))}</dd>
            <dt>InstaPay sender</dt><dd className="text-foreground">{b.instapay_sender}</dd>
            <dt>Created</dt><dd className="text-foreground">{new Date(b.created_at).toLocaleString()}</dd>
          </dl>
          {b.notes && <p className="mt-3 border-t border-border pt-3 text-muted-foreground">{b.notes}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={whatsappLink(b.phone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-success px-3 py-2 text-xs text-background">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            {b.status !== "paid" && <button onClick={() => setStatus(b.id, "paid")} className="flex items-center gap-1 border border-primary px-3 py-2 text-xs text-primary"><Check className="h-4 w-4" /> Deposit paid</button>}
            {b.status !== "pending" && <button onClick={() => setStatus(b.id, "pending")} className="border border-border px-3 py-2 text-xs">Pending</button>}
            {b.status !== "completed" && <button onClick={() => setStatus(b.id, "completed")} className="border border-border px-3 py-2 text-xs">Completed</button>}
            {b.status !== "cancelled" && <button onClick={() => setStatus(b.id, "cancelled")} className="flex items-center gap-1 border border-destructive px-3 py-2 text-xs text-destructive"><X className="h-4 w-4" /> Cancel</button>}
            <button onClick={() => del(b.id)} className="ms-auto text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

type V = Awaited<ReturnType<NonNullable<typeof vehiclesQuery.queryFn>>>[number];

function Vehicles() {
  const qc = useQueryClient();
  const { data = [] } = useQuery(vehiclesQuery);
  const [editing, setEditing] = useState<V | "new" | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["vehicles"] });

  async function del(id: string) {
    if (!confirm("Delete this vehicle and its images?")) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }

  return (
    <div>
      <button onClick={() => setEditing("new")} className="mb-6 bg-gold-gradient px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground">+ Add vehicle</button>
      {editing && <VehicleForm v={editing === "new" ? null : editing} onDone={() => { setEditing(null); refresh(); }} />}
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((v) => (
          <div key={v.id} className="border border-border bg-card p-4">
            <div className="flex gap-4">
              {v.vehicle_images[0] && <img src={v.vehicle_images[0].url} alt="" className="h-20 w-28 object-cover" />}
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-primary">{v.brand} · {v.type}</p>
                <p className="font-display text-xl">{v.name}</p>
                <p className="text-sm text-muted-foreground">{formatEGP(Number(v.price_egp))} {!v.is_available && "· Reserved"}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => setEditing(v)} className="border border-border px-3 py-1 text-xs hover:border-primary">Edit</button>
                <button onClick={() => del(v.id)} className="border border-destructive px-3 py-1 text-xs text-destructive">Delete</button>
              </div>
            </div>
            <ImageManager vehicle={v} onChange={refresh} />
          </div>
        ))}
      </div>
    </div>
  );
}

function VehicleForm({ v, onDone }: { v: V | null; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const g = (k: string) => String(fd.get(k) ?? "");
    const f = { name: g("name"), brand: g("brand"), type: g("type"), year: g("year"), price_egp: g("price_egp"), horsepower: g("horsepower"), top_speed: g("top_speed"), acceleration: g("acceleration"), engine: g("engine"), description_en: g("description_en"), description_ar: g("description_ar"), is_available: g("is_available") };
    const row = {
      name: f.name.trim().slice(0, 100),
      brand: f.brand.trim().slice(0, 100),
      type: f.type === "motorcycle" ? "motorcycle" : "car",
      year: Number(f.year) || 2025,
      price_egp: Number(f.price_egp),
      horsepower: f.horsepower ? Number(f.horsepower) : null,
      top_speed: f.top_speed ? Number(f.top_speed) : null,
      acceleration: f.acceleration?.slice(0, 100) || null,
      engine: f.engine?.slice(0, 100) || null,
      description_en: f.description_en.slice(0, 3000),
      description_ar: f.description_ar.slice(0, 3000),
      is_available: f.is_available === "on",
    };
    if (!row.name || !row.brand || !(row.price_egp > 0)) { toast.error("Name, brand and price are required"); return; }
    setBusy(true);
    const { error } = v ? await supabase.from("vehicles").update(row).eq("id", v.id) : await supabase.from("vehicles").insert(row);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    onDone();
  }
  return (
    <form onSubmit={onSubmit} className="mb-8 grid gap-3 border border-primary/50 bg-card p-6 sm:grid-cols-3">
      <input name="brand" defaultValue={v?.brand} placeholder="Brand" required className={field} />
      <input name="name" defaultValue={v?.name} placeholder="Model name" required className={field} />
      <select name="type" defaultValue={v?.type ?? "car"} className={field}><option value="car">Car</option><option value="motorcycle">Motorcycle</option></select>
      <input name="year" type="number" defaultValue={v?.year ?? 2025} placeholder="Year" className={field} />
      <input name="price_egp" type="number" defaultValue={v?.price_egp ? Number(v.price_egp) : undefined} placeholder="Price (EGP)" required className={field} />
      <input name="horsepower" type="number" defaultValue={v?.horsepower ?? undefined} placeholder="Horsepower" className={field} />
      <input name="top_speed" type="number" defaultValue={v?.top_speed ?? undefined} placeholder="Top speed km/h" className={field} />
      <input name="acceleration" defaultValue={v?.acceleration ?? ""} placeholder="0-100 km/h" className={field} />
      <input name="engine" defaultValue={v?.engine ?? ""} placeholder="Engine" className={field} />
      <textarea name="description_en" defaultValue={v?.description_en} rows={4} placeholder="Description (English)" className={`${field} sm:col-span-3`} />
      <textarea name="description_ar" defaultValue={v?.description_ar} rows={4} dir="rtl" placeholder="الوصف بالعربي" className={`${field} sm:col-span-3`} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_available" defaultChecked={v?.is_available ?? true} /> Available</label>
      <div className="flex gap-2 sm:col-span-2 sm:justify-end">
        <button type="button" onClick={onDone} className="border border-border px-5 py-2 text-xs">Cancel</button>
        <button disabled={busy} className="bg-gold-gradient px-5 py-2 text-xs uppercase tracking-widest text-primary-foreground">Save</button>
      </div>
    </form>
  );
}

function ImageManager({ vehicle, onChange }: { vehicle: V; onChange: () => void }) {
  const [angle, setAngle] = useState("Front");
  const [busy, setBusy] = useState(false);
  const imgs = vehicle.vehicle_images;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    let order = imgs.length ? Math.max(...imgs.map((i: { sort_order: number }) => i.sort_order)) + 1 : 0;
    for (const file of Array.from(files)) {
      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
      if (!allowedTypes.has(file.type)) { toast.error("Use a JPG, PNG, WebP, or AVIF image"); continue; }
      if (file.size > 10 * 1024 * 1024) { toast.error("Each image must be 10 MB or smaller"); continue; }
      const path = `${vehicle.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const storage = supabase.storage.from("vehicle-images");
      const up = await storage.upload(path, file, { contentType: file.type });
      if (up.error) { toast.error(up.error.message); continue; }
      const signed = await storage.createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed.error) {
        await storage.remove([path]);
        toast.error(signed.error.message);
        continue;
      }
      const { error: imageError } = await supabase.from("vehicle_images").insert({
        vehicle_id: vehicle.id, url: signed.data.signedUrl, storage_path: path, angle, sort_order: order++,
      });
      if (imageError) {
        await storage.remove([path]);
        toast.error("Image uploaded but couldn't be added to the gallery");
      }
    }
    setBusy(false);
    onChange();
  }

  async function move(i: number, dir: -1 | 1) {
    const a = imgs[i], b = imgs[i + dir];
    if (!a || !b) return;
    const first = await supabase.from("vehicle_images").update({ sort_order: -1 }).eq("id", a.id);
    if (first.error) { toast.error("Couldn't reorder images"); return; }
    const second = await supabase.from("vehicle_images").update({ sort_order: a.sort_order }).eq("id", b.id);
    if (second.error) {
      await supabase.from("vehicle_images").update({ sort_order: a.sort_order }).eq("id", a.id);
      toast.error("Couldn't reorder images");
      onChange();
      return;
    }
    const targetOrder = a.sort_order === b.sort_order ? a.sort_order + dir : b.sort_order;
    const third = await supabase.from("vehicle_images").update({ sort_order: targetOrder }).eq("id", a.id);
    if (third.error) toast.error("Image order may be incomplete");
    onChange();
  }

  async function setImgAngle(id: string, value: string) {
    const { error } = await supabase.from("vehicle_images").update({ angle: value }).eq("id", id);
    if (error) { toast.error("Couldn't update image angle"); return; }
    onChange();
  }

  async function remove(id: string, path?: string | null) {
    if (path) {
      const { error: storageError } = await supabase.storage.from("vehicle-images").remove([path]);
      if (storageError) { toast.error("Couldn't remove image file"); return; }
    }
    const { error } = await supabase.from("vehicle_images").delete().eq("id", id);
    if (error) { toast.error("Couldn't remove image record"); return; }
    onChange();
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Gallery (first = cover)</p>
      <div className="space-y-2">
        {imgs.map((im: V["vehicle_images"][number], i: number) => (
          <div key={im.id} className="flex items-center gap-2">
            <img src={im.url} alt="" className="h-12 w-16 object-cover" />
            <select value={im.angle} onChange={(e) => setImgAngle(im.id, e.target.value)} className={`${field} flex-1 py-1`}>
              {[...new Set([im.angle, ...ANGLES])].map((a) => <option key={a}>{a}</option>)}
            </select>
            <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
            <button onClick={() => move(i, 1)} disabled={i === imgs.length - 1} className="p-1 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
            <button onClick={() => remove(im.id, (im as { storage_path?: string | null }).storage_path)} className="p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <select value={angle} onChange={(e) => setAngle(e.target.value)} className={`${field} w-32 py-1`}>
          {ANGLES.map((a) => <option key={a}>{a}</option>)}
        </select>
        <label className="cursor-pointer border border-primary px-3 py-1.5 text-xs text-primary">
          {busy ? "Uploading…" : "+ Upload images"}
          <input type="file" accept="image/*" multiple hidden disabled={busy} onChange={(e) => upload(e.target.files)} />
        </label>
      </div>
    </div>
  );
}

function ReviewsAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-reviews"] }); qc.invalidateQueries({ queryKey: ["reviews"] }); };
  return (
    <div className="space-y-3">
      {data.map((r) => (
        <div key={r.id} className="flex items-start gap-4 border border-border bg-card p-4">
          <div className="flex-1">
            <p className="font-display text-lg">{r.name} · {"★".repeat(r.rating)}</p>
            <p className="text-sm text-muted-foreground">{r.comment}</p>
          </div>
          <button onClick={async () => {
            const { error } = await supabase.from("reviews").update({ approved: !r.approved }).eq("id", r.id);
            if (error) { toast.error("Couldn't update review"); return; }
            refresh();
          }} className={`border px-3 py-1 text-xs ${r.approved ? "border-border" : "border-primary text-primary"}`}>
            {r.approved ? "Hide" : "Approve"}
          </button>
          <button onClick={async () => {
            const { error } = await supabase.from("reviews").delete().eq("id", r.id);
            if (error) { toast.error("Couldn't delete review"); return; }
            refresh();
          }} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
