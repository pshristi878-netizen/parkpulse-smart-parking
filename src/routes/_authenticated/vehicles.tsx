import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Car, Plus, Star, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/park/AppHeader";
import { BottomNav } from "@/components/park/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/vehicles")({
  head: () => ({
    meta: [
      { title: "My vehicles — ParkPulse" },
      { name: "description", content: "Manage your vehicles" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VehiclesPage,
});

function VehiclesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    make: "",
    model: "",
    license_plate: "",
    color: "",
  });
  const [busy, setBusy] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.license_plate.trim()) return toast.error("License plate is required");
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase.from("vehicles").insert({
        user_id: u.user.id,
        make: form.make || null,
        model: form.model || null,
        color: form.color || null,
        license_plate: form.license_plate.toUpperCase(),
        is_default: vehicles.length === 0,
      });
      if (error) throw error;
      setForm({ make: "", model: "", license_plate: "", color: "" });
      toast.success("Vehicle added");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this vehicle?")) return;
    await supabase.from("vehicles").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    toast.success("Removed");
  };

  const makeDefault = async (id: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase
      .from("vehicles")
      .update({ is_default: false })
      .eq("user_id", u.user.id);
    await supabase.from("vehicles").update({ is_default: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["vehicles"] });
    toast.success("Default updated");
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="My vehicles" />
      <main className="mx-auto max-w-3xl px-5 pt-6">
        <form
          onSubmit={add}
          className="rounded-3xl border border-border bg-card p-5 shadow-soft"
        >
          <h2 className="text-lg font-semibold">Add a vehicle</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input
              placeholder="Make (Toyota)"
              value={form.make}
              onChange={(v) => setForm({ ...form, make: v })}
            />
            <Input
              placeholder="Model (Camry)"
              value={form.model}
              onChange={(v) => setForm({ ...form, model: v })}
            />
            <Input
              placeholder="Color"
              value={form.color}
              onChange={(v) => setForm({ ...form, color: v })}
            />
            <Input
              placeholder="Plate (ABC-1234)"
              value={form.license_plate}
              onChange={(v) => setForm({ ...form, license_plate: v })}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Add vehicle
          </button>
        </form>

        <ul className="mt-6 space-y-3">
          {vehicles.length === 0 && (
            <li className="rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
              No vehicles yet — add one above.
            </li>
          )}
          {vehicles.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="rounded-2xl bg-accent p-3">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {[v.make, v.model].filter(Boolean).join(" ") || "Vehicle"}
                  {v.is_default && (
                    <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Default
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {v.license_plate} {v.color && `· ${v.color}`}
                </p>
              </div>
              {!v.is_default && (
                <button
                  onClick={() => makeDefault(v.id)}
                  className="rounded-full border border-border bg-secondary p-2 hover:bg-accent"
                  aria-label="Make default"
                >
                  <Star className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => remove(v.id)}
                className="rounded-full border border-border bg-secondary p-2 hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </main>
      <BottomNav />
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-2xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-primary"
    />
  );
}
