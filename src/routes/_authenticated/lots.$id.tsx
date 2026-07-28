import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Accessibility,
  Battery,
  Bike,
  Car,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { AppHeader } from "@/components/park/AppHeader";
import { BottomNav } from "@/components/park/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/lots/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Parking details — ParkPulse" },
      { name: "description", content: `Book a slot at ${params.id}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LotDetail,
});

type Slot = {
  id: string;
  slot_number: string;
  floor: string | null;
  slot_type: "standard" | "compact" | "ev" | "handicap" | "bike";
  status: "available" | "occupied" | "reserved" | "disabled";
};

const typeIcon: Record<Slot["slot_type"], typeof Car> = {
  standard: Car,
  compact: Car,
  ev: Battery,
  handicap: Accessibility,
  bike: Bike,
};

function LotDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Slot | null>(null);
  const [hours, setHours] = useState(2);
  const [booking, setBooking] = useState(false);

  const { data: lot, isLoading } = useQuery({
    queryKey: ["lot", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parking_lots")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: slots = [] } = useQuery({
    queryKey: ["slots", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parking_slots")
        .select("id,slot_number,floor,slot_type,status")
        .eq("lot_id", id)
        .order("slot_number");
      if (error) throw error;
      return data as Slot[];
    },
    refetchInterval: 10000,
  });

  const stats = useMemo(() => {
    const avail = slots.filter((s) => s.status === "available").length;
    return { avail, total: slots.length };
  }, [slots]);

  const price = lot ? Number(lot.hourly_price) * hours : 0;
  const tax = price * 0.08;
  const total = price + tax;

  const book = async () => {
    if (!selected || !lot) return;
    setBooking(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Not signed in");

      const start = new Date();
      const end = new Date(start.getTime() + hours * 3600 * 1000);

      const { data: reservation, error: rErr } = await supabase
        .from("reservations")
        .insert({
          user_id: user.id,
          lot_id: lot.id,
          slot_id: selected.id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          duration_hours: hours,
          hourly_price: lot.hourly_price,
          tax,
          discount: 0,
          total_amount: total,
          status: "confirmed",
          qr_code: crypto.randomUUID(),
          reservation_expires_at: new Date(
            start.getTime() + 15 * 60 * 1000,
          ).toISOString(),
        })
        .select()
        .single();
      if (rErr) throw rErr;

      await supabase
        .from("parking_slots")
        .update({ status: "reserved" })
        .eq("id", selected.id);

      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "reservation",
        title: "Booking confirmed 🎉",
        body: `Slot ${selected.slot_number} at ${lot.name} is reserved for ${hours}h.`,
        action_url: `/reservations/${reservation.id}`,
      });

      toast.success("Slot reserved! Complete payment to activate.");
      navigate({
        to: "/reservations/$id",
        params: { id: reservation.id },
      });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  if (isLoading || !lot) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <AppHeader back />
        <div className="mx-auto max-w-6xl px-5 pt-6">
          <div className="h-64 animate-pulse rounded-3xl bg-card" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      <AppHeader back />
      <main className="mx-auto max-w-6xl px-5 pt-4">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          {lot.image_url && (
            <img
              src={lot.image_url}
              alt={lot.name}
              className="h-56 w-full object-cover md:h-72"
            />
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">{lot.name}</h1>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {lot.address}
                </p>
              </div>
              <div className="rounded-2xl bg-accent px-3 py-2 text-center">
                <p className="text-lg font-bold text-primary">
                  ${Number(lot.hourly_price).toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">per hour</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat
                icon={Star}
                label="Rating"
                value={`${lot.rating?.toFixed(1) ?? "—"}`}
                sub={`${lot.review_count} reviews`}
              />
              <Stat
                icon={Car}
                label="Available"
                value={`${stats.avail}`}
                sub={`of ${stats.total}`}
              />
              <Stat
                icon={Clock}
                label="Open"
                value={`${(lot.opening_time || "00:00").slice(0, 5)}`}
                sub={`to ${(lot.closing_time || "23:59").slice(0, 5)}`}
              />
            </div>

            {(lot.amenities?.length ?? 0) > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {lot.amenities!.map((a: string) => (
                  <span
                    key={a}
                    className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                  >
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Choose your slot</h2>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <Legend color="bg-slot-available" label="Free" />
              <Legend color="bg-slot-reserved" label="Held" />
              <Legend color="bg-slot-occupied" label="Full" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8">
            {slots.map((s) => {
              const Icon = typeIcon[s.slot_type];
              const isSel = selected?.id === s.id;
              const disabled = s.status !== "available";
              return (
                <button
                  key={s.id}
                  disabled={disabled}
                  onClick={() => setSelected(s)}
                  className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl border text-xs font-semibold transition ${
                    isSel
                      ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow scale-105"
                      : disabled
                        ? s.status === "reserved"
                          ? "border-warning/40 bg-warning/10 text-warning cursor-not-allowed"
                          : "border-destructive/30 bg-destructive/10 text-destructive/70 cursor-not-allowed"
                        : "border-border bg-accent/60 hover:border-primary hover:bg-accent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.slot_number}
                </button>
              );
            })}
          </div>
        </section>

        {selected && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-elevated"
          >
            <h2 className="text-lg font-semibold">Confirm booking</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Slot {selected.slot_number} · {selected.slot_type}
            </p>

            <div className="mt-4">
              <p className="text-sm font-medium">Duration</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 6, 8].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHours(h)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      hours === h
                        ? "bg-gradient-primary text-primary-foreground shadow-glow"
                        : "border border-border bg-secondary hover:bg-accent"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            <dl className="mt-5 space-y-1.5 rounded-2xl bg-secondary p-4 text-sm">
              <Row
                label={`Parking (${hours}h × $${Number(lot.hourly_price).toFixed(2)})`}
                value={`$${price.toFixed(2)}`}
              />
              <Row label="Tax (8%)" value={`$${tax.toFixed(2)}`} />
              <div className="my-1.5 h-px bg-border" />
              <Row label="Total" value={`$${total.toFixed(2)}`} bold />
            </dl>

            <button
              onClick={book}
              disabled={booking}
              className="mt-5 w-full rounded-full bg-gradient-primary py-3.5 text-base font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-60"
            >
              {booking ? "Reserving…" : `Reserve slot · $${total.toFixed(2)}`}
            </button>
          </motion.section>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-secondary p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-1 text-base font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${bold ? "text-base font-bold" : ""}`}
    >
      <dt className={bold ? "" : "text-muted-foreground"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
