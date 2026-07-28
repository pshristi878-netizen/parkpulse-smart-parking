import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Car,
  DollarSign,
  ParkingCircle,
  Users,
  TrendingUp,
  CalendarCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — ParkPulse" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const [lotsRes, slotsRes, reservationsRes, paymentsRes, usersRes] =
        await Promise.all([
          supabase.from("parking_lots").select("id", { count: "exact" }),
          supabase.from("parking_slots").select("id,status", { count: "exact" }),
          supabase.from("reservations").select("id,status,total_amount,created_at"),
          supabase.from("payments").select("id,amount,status"),
          supabase.from("profiles").select("id", { count: "exact" }),
        ]);

      const slots = slotsRes.data || [];
      const reservations = reservationsRes.data || [];
      const payments = paymentsRes.data || [];

      const totalRevenue = payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const activeReservations = reservations.filter((r) =>
        ["pending", "confirmed", "active"].includes(r.status)
      ).length;

      const slotStats = {
        available: slots.filter((s) => s.status === "available").length,
        occupied: slots.filter((s) => s.status === "occupied").length,
        reserved: slots.filter((s) => s.status === "reserved").length,
        disabled: slots.filter((s) => s.status === "disabled").length,
      };

      return {
        totalLots: lotsRes.count || 0,
        totalSlots: slotsRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalReservations: reservations.length,
        activeReservations,
        totalRevenue,
        slotStats,
      };
    },
    refetchInterval: 30000,
  });

  const slotChartData = stats
    ? [
        { name: "Available", value: stats.slotStats.available, color: "oklch(0.72 0.19 148)" },
        { name: "Occupied", value: stats.slotStats.occupied, color: "oklch(0.62 0.22 27)" },
        { name: "Reserved", value: stats.slotStats.reserved, color: "oklch(0.79 0.16 80)" },
        { name: "Disabled", value: stats.slotStats.disabled, color: "oklch(0.82 0.008 240)" },
      ]
    : [];

  const { data: recentReservations = [] } = useQuery({
    queryKey: ["admin_recent_reservations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservations")
        .select("id,status,total_amount,created_at,lot_id")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground">
          Real-time statistics for your parking network
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={ParkingCircle}
          label="Total Lots"
          value={stats?.totalLots ?? 0}
        />
        <StatCard
          icon={Car}
          label="Total Slots"
          value={stats?.totalSlots ?? 0}
        />
        <StatCard
          icon={Users}
          label="Users"
          value={stats?.totalUsers ?? 0}
        />
        <StatCard
          icon={CalendarCheck}
          label="Reservations"
          value={stats?.totalReservations ?? 0}
        />
        <StatCard
          icon={TrendingUp}
          label="Active"
          value={stats?.activeReservations ?? 0}
        />
        <StatCard
          icon={DollarSign}
          label="Revenue"
          value={`$${(stats?.totalRevenue ?? 0).toFixed(0)}`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Slot Status Pie */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-base font-semibold mb-4">Slot Status Distribution</h3>
          {slotChartData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={slotChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {slotChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {slotChartData.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                {d.name}: {d.value}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Reservations */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-base font-semibold mb-4">Recent Reservations</h3>
          <div className="space-y-2">
            {recentReservations.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-secondary p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {r.id.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${Number(r.total_amount).toFixed(2)}</p>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
            {recentReservations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No reservations yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <Icon className="h-5 w-5 text-primary mb-2" />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    confirmed: "bg-primary/10 text-primary",
    active: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
    expired: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[status] || "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}