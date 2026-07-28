import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/lots")({
  head: () => ({
    meta: [
      { title: "Manage Lots — Admin — ParkPulse" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLots,
});

type Lot = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  hourly_price: number;
  total_slots: number;
  is_active: boolean;
  rating: number | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  amenities: string[] | null;
  opening_time: string | null;
  closing_time: string | null;
  description: string | null;
};

type LotForm = {
  name: string;
  address: string;
  city: string;
  hourly_price: string;
  total_slots: string;
  latitude: string;
  longitude: string;
  image_url: string;
  description: string;
  amenities: string;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
};

const emptyForm: LotForm = {
  name: "",
  address: "",
  city: "",
  hourly_price: "5.00",
  total_slots: "20",
  latitude: "37.7749",
  longitude: "-122.4194",
  image_url: "",
  description: "",
  amenities: "",
  opening_time: "00:00",
  closing_time: "23:59",
  is_active: true,
};

function AdminLots() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LotForm>(emptyForm);

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ["admin_lots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parking_lots")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lot[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: LotForm) => {
      const payload = {
        name: formData.name,
        address: formData.address,
        city: formData.city || null,
        hourly_price: parseFloat(formData.hourly_price),
        total_slots: parseInt(formData.total_slots),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        image_url: formData.image_url || null,
        description: formData.description || null,
        amenities: formData.amenities
          ? formData.amenities.split(",").map((a) => a.trim())
          : [],
        opening_time: formData.opening_time || "00:00",
        closing_time: formData.closing_time || "23:59",
        is_active: formData.is_active,
      };

      if (editingId) {
        const { error } = await supabase
          .from("parking_lots")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("parking_lots").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Lot updated" : "Lot created");
      queryClient.invalidateQueries({ queryKey: ["admin_lots"] });
      closeForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("parking_lots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lot deleted");
      queryClient.invalidateQueries({ queryKey: ["admin_lots"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (lot: Lot) => {
    setEditingId(lot.id);
    setForm({
      name: lot.name,
      address: lot.address,
      city: lot.city || "",
      hourly_price: String(lot.hourly_price),
      total_slots: String(lot.total_slots),
      latitude: String(lot.latitude),
      longitude: String(lot.longitude),
      image_url: lot.image_url || "",
      description: lot.description || "",
      amenities: (lot.amenities || []).join(", "),
      opening_time: lot.opening_time || "00:00",
      closing_time: lot.closing_time || "23:59",
      is_active: lot.is_active,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Parking Lots</h2>
          <p className="text-sm text-muted-foreground">
            Manage all parking locations
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95"
        >
          <Plus className="h-4 w-4" /> Add Lot
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {editingId ? "Edit Lot" : "Add New Lot"}
              </h3>
              <button
                onClick={closeForm}
                className="rounded-full p-2 hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <FormField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <FormField label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                <FormField label="Hourly Price ($)" value={form.hourly_price} onChange={(v) => setForm({ ...form, hourly_price: v })} type="number" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Total Slots" value={form.total_slots} onChange={(v) => setForm({ ...form, total_slots: v })} type="number" required />
                <FormField label="Latitude" value={form.latitude} onChange={(v) => setForm({ ...form, latitude: v })} type="number" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Longitude" value={form.longitude} onChange={(v) => setForm({ ...form, longitude: v })} type="number" required />
                <FormField label="Image URL" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
              </div>
              <FormField label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <FormField label="Amenities (comma-separated)" value={form.amenities} onChange={(v) => setForm({ ...form, amenities: v })} />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Opening Time" value={form.opening_time} onChange={(v) => setForm({ ...form, opening_time: v })} type="time" />
                <FormField label="Closing Time" value={form.closing_time} onChange={(v) => setForm({ ...form, closing_time: v })} type="time" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded"
                />
                Active
              </label>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full rounded-full bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-60"
              >
                {saveMutation.isPending ? "Saving..." : editingId ? "Update Lot" : "Create Lot"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">City</th>
                <th className="px-4 py-3 text-left font-semibold">Price/hr</th>
                <th className="px-4 py-3 text-left font-semibold">Slots</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <tr key={lot.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium">{lot.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lot.city || "—"}</td>
                  <td className="px-4 py-3">${Number(lot.hourly_price).toFixed(2)}</td>
                  <td className="px-4 py-3">{lot.total_slots}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${lot.is_active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {lot.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(lot)}
                      className="mr-2 rounded-lg p-1.5 hover:bg-secondary"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this lot?")) deleteMutation.mutate(lot.id);
                      }}
                      className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        step={type === "number" ? "any" : undefined}
        className="mt-1 w-full rounded-xl border border-border bg-input/40 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}