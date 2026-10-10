import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DEPOSIT_RATE = 0.05;
export const INSTAPAY_NUMBER = "01208744830";

export function depositFor(price: number) {
  return Math.round(price * DEPOSIT_RATE);
}

export function formatEGP(n: number) {
  return new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 }).format(n) + " EGP";
}

/** Converts an Egyptian local number (01xxxxxxxxx) to wa.me format (201xxxxxxxxx). */
export function whatsappLink(phone: string) {
  let p = phone.replace(/[^0-9]/g, "");
  if (p.startsWith("0")) p = "2" + p;
  return `https://wa.me/${p}`;
}

export type VehicleImage = { id: string; url: string; angle: string; sort_order: number };

export const vehiclesQuery = queryOptions({
  queryKey: ["vehicles"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*, vehicle_images(id,url,angle,sort_order)")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data.map((v) => ({
      ...v,
      vehicle_images: [...(v.vehicle_images as VehicleImage[])].sort((a, b) => a.sort_order - b.sort_order),
    }));
  },
});

export const vehicleQuery = (id: string) =>
  queryOptions({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, vehicle_images(id,url,angle,sort_order)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        vehicle_images: [...(data.vehicle_images as VehicleImage[])].sort((a, b) => a.sort_order - b.sort_order),
      };
    },
  });

export const reviewsQuery = queryOptions({
  queryKey: ["reviews"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("id,name,rating,comment,created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) throw error;
    return data;
  },
});
