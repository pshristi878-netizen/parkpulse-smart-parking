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
  AreaChart,
  Area,
} from "recharts";

const COLORS = {
  primary: "oklch(0.72 0.19 148)",
  warning: "oklch(0.79 0.16 80)",
  destructive: "oklch(0.62 0.22 27)",
  muted: "oklch(0.82 0.008 240)",
};

function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

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
          supabase
            .from("reservations")
            .select("id,status,total_amount,created_at,start_time"),
          supabase.from("payments").select("id,amount,status,created_at,paid_at"),
          supabase.from("profiles").select("id", { count: "exact" }),
        ]);

      const slots = slotsRes.data || [];
      const reservations = reservationsRes.data || [];
      const payments = paymentsRes.data || [];

      const paidPayments = payments.filter((p) => p.status === "paid");
      const totalRevenue = paidPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );

      const activeReservations = reservations.filter((r) =>
        ["pending", "confirmed", "active"].includes(r.status)
      ).length;

      const slotStats = {
        available: slots.filter((s) => s.status === "available").length,
        occupied: slots.filter((s) => s.status === "occupied").length,
        reserved: slots.filter((s) => s.status === "reserved").length,
        disabled: slots.filter((s) => s.status === "disabled").length,
      };

      // Last 7 days revenue + bookings
      const days: {
        key: string;
        label: string;
        revenue: number;
        bookings: number;
      }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        days.push({
          key: d.toDateString(),
          label: fmtDay(d),
          revenue: 0,
          bookings: 0,
        });
      }
      const dayIndex = new Map(days.map((d, i) => [d.key, i]));
      paidPayments.forEach((p) => {
        const when = p.paid_at || p.created_at;
        if (!when) return;
        const k = new Date(when).toDateString();
        const idx = dayIndex.get(k);
        if (idx !== undefined) days[idx].revenue += Number(p.amount);
      });
      reservations.forEach((r) => {
        if (!r.created_at) return;
        const k = new Date(r.created_at).toDateString();
        const idx = dayIndex.get(k);
        if (idx !== undefined) days[idx].bookings += 1;
      });

      // Peak hours (grouped into 3-hour bands over the day)
      const bands = [
        { label: "12–3a", from: 0 },
        { label: "3–6a", from: 3 },
        { label: "6–9a", from: 6 },
        { label: "9–12p", from: 9 },
        { label: "12–3p", from: 12 },
        { label: "3–6p", from: 15 },
        { label: "6–9p", from: 18 },
        { label: "9–12a", from: 21 },
      ].map((b) => ({ ...b, count: 0 }));
      reservations.forEach((r) => {
        const t = r.start_time || r.created_at;
        if (!t) return;
        const h = new Date(t).getHours();
        const band = Math.floor(h / 3);
        if (bands[band]) bands[band].count += 1;
      });

      const occupancyRate =
        slotStats.available + slotStats.occupied + slotStats.reserved > 0
          ? Math.round(
              ((slotStats.occupied + slotStats.reserved) /
                (slotStats.available +
                  slotStats.occupied +
                  slotStats.reserved)) *
                100,
            )
          : 0;

      return {
        totalLots: lotsRes.count || 0,
        totalSlots: slotsRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalReservations: reservations.length,
        activeReservations,
        totalRevenue,
        slotStats,
        days,
        bands,
        occupancyRate,
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

      {/* Revenue + Bookings trend */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Revenue — last 7 days</h3>
            <span className="text-xs font-semibold text-primary">
              ${(stats?.days?.reduce((s, d) => s + d.revenue, 0) ?? 0).toFixed(2)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats?.days ?? []} margin={{ left: -18, right: 8 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} />
              <Tooltip
                formatter={(v: number) => [`$${Number(v).toFixed(2)}`, "Revenue"]}
                contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.005 240)" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.primary}
                strokeWidth={2.5}
                fill="url(#rev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h3 className="mb-4 text-base font-semibold">Bookings — last 7 days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.days ?? []} margin={{ left: -24, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={36} allowDecimals={false} />
              <Tooltip
                formatter={(v: number) => [v, "Bookings"]}
                contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.005 240)" }}
              />
              <Bar dataKey="bookings" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peak hours */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Peak booking hours</h3>
          <span className="text-xs text-muted-foreground">
            Occupancy {stats?.occupancyRate ?? 0}%
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats?.bands ?? []} margin={{ left: -24, right: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} width={36} allowDecimals={false} />
            <Tooltip
              formatter={(v: number) => [v, "Bookings"]}
              contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.005 240)" }}
            />
            <Bar dataKey="count" fill={COLORS.warning} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
