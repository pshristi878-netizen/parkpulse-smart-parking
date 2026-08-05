import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Navigation,
  Smartphone,
  Wallet,
  XCircle,
} from "lucide-react";
import { AppHeader } from "@/components/park/AppHeader";
import { BottomNav } from "@/components/park/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/reservations/$id")({
  head: () => ({
    meta: [
      { title: "Booking — ParkPulse" },
      { name: "description", content: "Your booking QR ticket" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReservationDetail,
});

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    Math.max(
      Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
      0,
    ),
  );

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (secondsLeft <= 0) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
        <XCircle className="h-4 w-4 shrink-0" />
        Reservation expired — your slot has been released.
      </div>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const isWarning = secondsLeft > 120;

  return (
    <div
      className={`mt-3 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${
        isWarning
          ? "border-orange-400/30 bg-orange-500/10 text-orange-500"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }`}
    >
      <Clock className="h-4 w-4 shrink-0" />
      <span>
        Reservation expires in{" "}
        <span className="font-mono text-base">
          {mm}:{ss}
        </span>
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function ReservationDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [payMethod, setPayMethod] = useState<"upi" | "card" | "wallet">("upi");
  const [busy, setBusy] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reservation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          "*,parking_lots(name,address,image_url,latitude,longitude),parking_slots(slot_number,floor,slot_type)",
        )
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: payment } = useQuery({
    queryKey: ["payment", id],
    enabled: !!data,
    queryFn: async () => {
      const { data: p } = await supabase
        .from("payments")
        .select("*")
        .eq("reservation_id", id)
        .maybeSingle();
      return p;
    },
  });

  const pay = async () => {
    if (!data) return;
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const ref = `TXN-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("payments").insert({
        reservation_id: id,
        user_id: u.user.id,
        amount: data.total_amount,
        method: payMethod,
        status: "paid",
        transaction_ref: ref,
        paid_at: new Date().toISOString(),
      });
      if (error) throw error;
      await supabase
        .from("reservations")
        .update({ status: "active", checked_in_at: new Date().toISOString() })
        .eq("id", id);
      await supabase.from("notifications").insert({
        user_id: u.user.id,
        type: "payment",
        title: "Payment successful ✅",
        body: `$${Number(data.total_amount).toFixed(2)} paid via ${payMethod.toUpperCase()}.`,
        action_url: `/reservations/${id}`,
      });
      toast.success("Payment received. Your ticket is active!");
      qc.invalidateQueries();
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!data) return;
    if (!confirm("Cancel this booking? Your slot will be released.")) return;
    setBusy(true);
    try {
      await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", id);
      await supabase
        .from("parking_slots")
        .update({ status: "available" })
        .eq("id", data.slot_id);
      toast.success("Booking cancelled");
      navigate({ to: "/reservations" });
    } finally {
      setBusy(false);
    }
  };

  const checkOut = async () => {
    if (!data) return;
    setBusy(true);
    try {
      const now = new Date();
      await supabase
        .from("reservations")
        .update({ status: "completed", checked_out_at: now.toISOString() })
        .eq("id", id);
      await supabase
        .from("parking_slots")
        .update({ status: "available" })
        .eq("id", data.slot_id);
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase.from("parking_history").insert({
          user_id: u.user.id,
          reservation_id: id,
          lot_id: data.lot_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lot_name: (data.parking_lots as any)?.name || "Parking",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          slot_number: (data.parking_slots as any)?.slot_number,
          entry_time: data.checked_in_at || data.start_time,
          exit_time: now.toISOString(),
          duration_hours: data.duration_hours,
          total_paid: data.total_amount,
          status: "completed",
        });
      }
      toast.success("Checked out. Drive safe!");
      refetch();
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <AppHeader back />
        <div className="mx-auto max-w-3xl px-5 pt-6">
          <div className="h-72 animate-pulse rounded-3xl bg-card" />
        </div>
        <BottomNav />
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lot: any = data.parking_lots;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slot: any = data.parking_slots;
  const paid = payment?.status === "paid";
  const isActive = data.status === "active";
  const isDone = data.status === "completed";
  const isCancelled = data.status === "cancelled";

  // Show countdown for confirmed/pending reservations that have an expiry timestamp
  const showCountdown =
    (data.status === "confirmed" || data.status === "pending") &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(data as any).reservation_expires_at;

  // Show directions for active/confirmed reservations whose lot has coordinates
  const showDirections =
    (isActive || data.status === "confirmed") &&
    lot?.latitude != null &&
    lot?.longitude != null;

  const mapsUrl = showDirections
    ? `https://www.google.com/maps/dir/?api=1&destination=${lot.latitude},${lot.longitude}`
    : "";

  return (
    <div className="min-h-screen bg-background pb-40">
      <AppHeader back title="Booking" />
      <main className="mx-auto max-w-3xl px-5 pt-4">
        {/* ── Booking header card ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-80">
                {isDone
                  ? "Completed"
                  : isCancelled
                    ? "Cancelled"
                    : isActive
                      ? "Active ticket"
                      : paid
                        ? "Confirmed"
                        : "Awaiting payment"}
              </p>
              <h1 className="mt-1 text-2xl font-bold">{lot?.name}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm opacity-90">
                <MapPin className="h-4 w-4" />
                Slot {slot?.slot_number} · Floor {slot?.floor}
              </p>
            </div>
            <Smartphone className="h-10 w-10 opacity-80" />
          </div>

          {(paid || isActive || isDone) && (
            <div className="mt-5 flex justify-center rounded-3xl bg-white p-5">
              <QRCode
                value={data.qr_code || data.id}
                size={180}
                bgColor="#ffffff"
                fgColor="#0b0b0b"
              />
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <p className="text-[10px] uppercase opacity-80">Start</p>
              <p className="font-semibold">
                {new Date(data.start_time).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <p className="text-[10px] uppercase opacity-80">End</p>
              <p className="font-semibold">
                {new Date(data.end_time).toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Feature 1: Countdown timer ──────────────────────────────────── */}
        {showCountdown && (
          <CountdownTimer
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expiresAt={(data as any).reservation_expires_at}
          />
        )}

        {/* ── Feature 2: Get Directions button ────────────────────────────── */}
        {showDirections && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-semibold shadow-soft transition hover:bg-accent"
          >
            <Navigation className="h-4 w-4" />
            Get Directions
          </a>
        )}

        {/* ── Summary ─────────────────────────────────────────────────────── */}
        <section className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Summary
          </h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row
              label={`Parking (${data.duration_hours}h)`}
              value={`$${(Number(data.hourly_price) * Number(data.duration_hours)).toFixed(2)}`}
            />
            <Row label="Tax" value={`$${Number(data.tax).toFixed(2)}`} />
            <div className="my-1.5 h-px bg-border" />
            <Row
              label="Total"
              value={`$${Number(data.total_amount).toFixed(2)}`}
              bold
            />
          </dl>
        </section>

        {/* ── Payment section ─────────────────────────────────────────────── */}
        {!paid && !isCancelled && (
          <section className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-lg font-semibold">Payment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete payment within 15 minutes to keep your slot.
            </p>
            {/* Feature 3: UPI now uses Smartphone icon */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["upi", "card", "wallet"] as const).map((m) => {
                const Icon =
                  m === "card"
                    ? CreditCard
                    : m === "wallet"
                      ? Wallet
                      : Smartphone;
                return (
                  <button
                    key={m}
                    onClick={() => setPayMethod(m)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border py-3 text-xs font-semibold transition ${
                      payMethod === m
                        ? "border-primary bg-accent text-primary"
                        : "border-border bg-secondary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {m.toUpperCase()}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={pay}
                disabled={busy}
                className="flex-1 rounded-full bg-gradient-primary py-3.5 text-base font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-60"
              >
                {busy
                  ? "Processing…"
                  : `Pay $${Number(data.total_amount).toFixed(2)}`}
              </button>
              <button
                onClick={cancel}
                disabled={busy}
                className="rounded-full border border-border bg-card px-5 py-3.5 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        {/* ── Paid / check-out section ─────────────────────────────────────── */}
        {paid && !isDone && !isCancelled && (
          <section className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-accent p-2.5">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">
                  Paid · {payment?.method?.toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ref {payment?.transaction_ref}
                </p>
              </div>
            </div>
            <button
              onClick={checkOut}
              disabled={busy}
              className="mt-4 w-full rounded-full border border-border bg-secondary py-3 text-sm font-semibold hover:bg-accent disabled:opacity-60"
            >
              <Clock className="mr-1 inline h-4 w-4" /> Check out now
            </button>
          </section>
        )}

        {/* ── Cancelled banner ────────────────────────────────────────────── */}
        {isCancelled && (
          <div className="mt-5 flex items-center gap-3 rounded-3xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <XCircle className="h-5 w-5" />
            This booking was cancelled.
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Link
            to="/home"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
