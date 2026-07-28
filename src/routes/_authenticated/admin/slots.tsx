import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/slots")({
  head: () => ({
    meta: [
      { title: "Manage Slots — Admin — ParkPulse" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSlots,
});

type Slot = {
  id: string;
  lot_id: string;
  slot_number: string;
  floor: string | null;
  slot_type: string;
  status: string;
};

type Lot = { id: string; name: string };

function AdminSlots() {
  const queryClient = useQueryClient();
  const [selectedLot, setSelectedLot] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: lots = [] } = useQuery({
    queryKey: ["admin_lots_list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("parking_lots")
        .select("id,name")
        .order("name");
      return (data || []) as Lot[];
    },
  });

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["admin_slots", selectedLot],
    queryFn: async () => {
      let query = supabase
        .from("parking_slots")
        .select("id,lot_id,slot_number,floor,slot_type,status")
        .order("slot_number");
      if (selectedLot !== "all") {
        query = query.eq("lot_id", selectedLot);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Slot[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "available" | "occupied" | "reserved" | "disabled" }) => {
      const { error } = await supabase
        .from("parking_slots")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Slot status updated");
      queryClient.invalidateQueries({ queryKey: ["admin_slots"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = slots.filter(
    (s) => statusFilter === "all" || s.status === statusFilter
  );

  const lotName = (lotId: string) =>
    lots.find((l) => l.id === lotId)?.name || lotId.slice(0, 8);

  const statusColors: Record<string, string> = {
    available: "bg-slot-available/10 text-primary",
    occupied: "bg-destructive/10 text-destructive",
    reserved: "bg-warning/10 text-warning",
    disabled: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Parking Slots</h2>
        <p className="text-sm text-muted-foreground">
          View and manage slot statuses across all lots
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedLot}
          onChange={(e) => setSelectedLot(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="all">All Lots</option>
          {lots.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
          <option value="disabled">Disabled</option>
        </select>
        <span className="self-center text-xs text-muted-foreground">
          {filtered.length} slot{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Slots Grid */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-semibold">Slot #</th>
                <th className="px-4 py-3 text-left font-semibold">Lot</th>
                <th className="px-4 py-3 text-left font-semibold">Floor</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Change Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((slot) => (
                <tr key={slot.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium">{slot.slot_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lotName(slot.lot_id)}</td>
                  <td className="px-4 py-3">{slot.floor || "G"}</td>
                  <td className="px-4 py-3 capitalize">{slot.slot_type}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[slot.status] || ""}`}>
                      {slot.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={slot.status}
                      onChange={(e) =>
                        updateStatus.mutate({ id: slot.id, status: e.target.value as "available" | "occupied" | "reserved" | "disabled" })
                      }
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No slots found
            </p>
          )}
        </div>
      )}
    </div>
  );
}