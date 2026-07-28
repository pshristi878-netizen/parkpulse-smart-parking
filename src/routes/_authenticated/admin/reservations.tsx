import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/reservations")({
  head: () => ({
    meta: [
      { title: "Reservations — Admin — ParkPulse" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminReservations,
});

function AdminReservations() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["admin_reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const { data: lots = [] } = useQuery({
    queryKey: ["admin_lots_map"],
    queryFn: async () => {
      const { data } = await supabase.from("parking_lots").select("id,name");
      return data || [];
    },
  });

  const lotName = (id: string) =>
    lots.find((l) => l.id === id)?.name || id.slice(0, 8);

  const filtered = reservations.filter(
    (r) => statusFilter === "all" || r.status === statusFilter
  );

  const statusColors: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    confirmed: "bg-primary/10 text-primary",
    active: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
    expired: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">All Reservations</h2>
        <p className="text-sm text-muted-foreground">
          View and monitor all parking reservations
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
        <span className="self-center text-xs text-muted-foreground">
          {filtered.length} reservation{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Lot</th>
                <th className="px-4 py-3 text-left font-semibold">Duration</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono text-xs">{r.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{lotName(r.lot_id)}</td>
                  <td className="px-4 py-3">{r.duration_hours}h</td>
                  <td className="px-4 py-3 font-medium">${Number(r.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[r.status] || ""}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No reservations found
            </p>
          )}
        </div>
      )}
    </div>
  );
}