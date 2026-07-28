import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Ticket } from "lucide-react";
import { AppHeader } from "@/components/park/AppHeader";
import { BottomNav } from "@/components/park/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/reservations/")({
  head: () => ({
    meta: [
      { title: "My bookings — ParkPulse" },
      { name: "description", content: "Your parking reservations" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReservationsList,
});

const statusStyle: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  confirmed: "bg-primary/15 text-primary",
  active: "bg-primary text-primary-foreground",
  completed: "bg-secondary text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
  expired: "bg-secondary text-muted-foreground",
};

function ReservationsList() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id,status,start_time,end_time,total_amount,duration_hours,lot_id,slot_id,parking_lots(name,address,image_url),parking_slots(slot_number)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="My bookings" />
      <main className="mx-auto max-w-3xl px-5 pt-6">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-3xl bg-card shadow-soft"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-20 rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
            <div className="mx-auto mb-3 inline-flex rounded-2xl bg-accent p-3">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">No bookings yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Reserve your first spot and it will appear here.
            </p>
            <Link
              to="/home"
              className="mt-5 inline-block rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Find parking
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const lot: any = r.parking_lots;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const slot: any = r.parking_slots;
              return (
                <li key={r.id}>
                  <Link
                    to="/reservations/$id"
                    params={{ id: r.id }}
                    className="flex gap-4 rounded-3xl border border-border bg-card p-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-secondary">
                      {lot?.image_url && (
                        <img
                          src={lot.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-semibold">
                          {lot?.name ?? "Parking"}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${statusStyle[r.status] || "bg-secondary"}`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> Slot {slot?.slot_number}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(r.start_time).toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        ${Number(r.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
