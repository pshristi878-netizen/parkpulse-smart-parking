import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Mail, Phone, User as UserIcon } from "lucide-react";
import { AppHeader } from "@/components/park/AppHeader";
import { BottomNav } from "@/components/park/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — ParkPulse" },
      { name: "description", content: "Your account" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      return { ...data, email: u.user.email };
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          phone: form.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", u.user.id);
      if (error) throw error;
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="Profile" />
      <main className="mx-auto max-w-2xl px-5 pt-6">
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-primary text-primary-foreground shadow-glow">
            <UserIcon className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">
              {profile?.full_name || "Guest"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {profile?.email}
            </p>
          </div>
        </div>

        <form
          onSubmit={save}
          className="mt-5 space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft"
        >
          <h2 className="text-lg font-semibold">Account details</h2>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4 py-3">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Full name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4 py-3 opacity-70">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              disabled
              value={profile?.email || ""}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4 py-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <button
          onClick={signOut}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 py-3 text-sm font-semibold text-destructive hover:bg-destructive/15"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </main>
      <BottomNav />
    </div>
  );
}
