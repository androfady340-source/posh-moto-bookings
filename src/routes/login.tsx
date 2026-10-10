import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Noir Auto Haus" },
      { name: "description", content: "Staff sign-in." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Login — Noir Auto Haus" },
      { property: "og:description", content: "Staff sign-in." },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email")).trim();
    const password = String(fd.get("password"));
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      nav({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Check your email to confirm your account.");
      setMode("in");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border border-border bg-card p-8">
        <h1 className="text-3xl text-gold-gradient">{mode === "in" ? "Admin Sign in" : "Create admin account"}</h1>
        <input name="email" type="email" required placeholder="Email" className="w-full border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
        <input name="password" type="password" required minLength={8} placeholder="Password" className="w-full border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
        <button disabled={busy} className="w-full bg-gold-gradient py-3 text-xs uppercase tracking-[0.3em] text-primary-foreground disabled:opacity-50">
          {mode === "in" ? "Sign in" : "Sign up"}
        </button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-xs text-muted-foreground hover:text-primary">
          {mode === "in" ? "First time? Create the account" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
