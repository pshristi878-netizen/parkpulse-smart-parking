import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  Car,
  Clock,
  History,
  LogOut,
  MapPin,
  Search,
  Star,
  Zap,
  ParkingCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/park/Logo";
import { BottomNav } from "@/components/park/BottomNav";
import { LotMap } from "@/components/park/LotMap";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Dashboard — ParkPulse" },
      { name: "description", content: "Find parking near you." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HomePage,
});

type Lot = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  hourly_price: number;
  image_url: string | null;
  rating: number | null;
  review_count: number;
  amenities: string[] | null;
  total_slots: number;
  latitude: number;
  longitude: number;
};

type SlotStat = {
  lot_id: string;
  status: string;
};

function HomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("there");
  const [query, setQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as
        | { full_name?: string; name?: string }
        | undefined;
      const n = meta?.full_name || meta?.name || data.user?.email?.split("@")[0];
      if (n) setName(n.split(" ")[0]);

      // Check admin role
      if (data.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle()
          .then(({ data: roleData }) => {
            if (roleData) setIsAdmin(true);
          });
      }
    });
  }, []);

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ["parking_lots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parking_lots")
        .select(
          "id,name,address,city,hourly_price,image_url,rating,review_count,amenities,total_slots,latitude,longitude",
        )
        .eq("is_active", true)
        .order("rating", { ascending: false });
      if (error) throw error;
      return data as Lot[];
    },
  });

  // Real-time slot availability
  const { data: slotStats = [] } = useQuery({
    queryKey: ["slot_availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parking_slots")
        .select("lot_id,status");
      if (error) throw error;
      return data as SlotStat[];
    },
    refetchInterval: 10000,
  });

  const availabilityMap = useMemo(() => {
    const map: Record<string, { available: number; total: number; occupied: number; reserved: number }> = {};
    slotStats.forEach((s) => {
      if (!map[s.lot_id]) map[s.lot_id] = { available: 0, total: 0, occupied: 0, reserved: 0 };
      map[s.lot_id].total++;
      if (s.status === "available") map[s.lot_id].available++;
      if (s.status === "occupied") map[s.lot_id].occupied++;
      if (s.status === "reserved") map[s.lot_id].reserved++;
    });
    return map;
  }, [slotStats]);

  const globalStats = useMemo(() => {
    const totals = { available: 0, total: 0, occupied: 0, reserved: 0, lots: lots.length };
    Object.values(availabilityMap).forEach((v) => {
      totals.available += v.available;
      totals.total += v.total;
      totals.occupied += v.occupied;
      totals.reserved += v.reserved;
    });
    return totals;
  }, [availabilityMap, lots]);

  const { data: activeRes } = useQuery({
    queryKey: ["active_reservation"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservations")
        .select("id,lot_id,status,end_time,total_amount")
        .in("status", ["pending", "confirmed", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    refetchInterval: 20000,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lots;
    return lots.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        (l.city || "").toLowerCase().includes(q),
    );
  }, [lots, query]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary shadow-soft hover:bg-primary/20"
              >
                <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
                Admin
              </Link>
            )}
            <Link
              to="/notifications"
              className="rounded-full border border-border bg-card p-2.5 shadow-soft hover:bg-secondary"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <button
              onClick={signOut}
              className="rounded-full border border-border bg-card p-2.5 shadow-soft hover:bg-secondary"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-sm text-muted-foreground">Good day,</p>
          <h1 className="text-3xl font-bold tracking-tight">Hi {name} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Where do you need to park today?
          </p>
        </motion.div>

        {/* Real-time Availability Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-5 rounded-3xl border border-border bg-card p-4 shadow-soft"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live Availability
            </h2>
            <span className="text-[10px] text-muted-foreground">Updates every 10s</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DashStat
              icon={ParkingCircle}
              label="Total Lots"
              value={globalStats.lots}
              color="text-primary"
            />
            <DashStat
              icon={CheckCircle2}
              label="Available"
              value={globalStats.available}
              color="text-primary"
            />
            <DashStat
              icon={XCircle}
              label="Occupied"
              value={globalStats.occupied}
              color="text-destructive"
            />
            <DashStat
              icon={Clock}
              label="Reserved"
              value={globalStats.reserved}
              color="text-warning"
            />
          </div>
          {/* Availability bar */}
          {globalStats.total > 0 && (
            <div className="mt-3">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="bg-slot-available transition-all"
                  style={{ width: `${(globalStats.available / globalStats.total) * 100}%` }}
                />
                <div
                  className="bg-slot-reserved transition-all"
                  style={{ width: `${(globalStats.reserved / globalStats.total) * 100}%` }}
                />
                <div
                  className="bg-slot-occupied transition-all"
                  style={{ width: `${(globalStats.occupied / globalStats.total) * 100}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                <span>{Math.round((globalStats.available / globalStats.total) * 100)}% free</span>
                <span>{globalStats.total} total slots</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/search", search: { q: query || undefined } });
          }}
          className="mt-5 flex items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-4 shadow-soft focus-within:border-primary"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => navigate({ to: "/search", search: { q: query || undefined } })}
            placeholder="Search by name, address, city…"
            className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
          >
            Search
          </button>
        </form>

        {activeRes && (
          <Link
            to="/reservations/$id"
            params={{ id: activeRes.id }}
            className="mt-5 block overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-elevated"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide opacity-80">
                  Active booking
                </p>
                <p className="mt-1 text-xl font-bold">Tap to view QR ticket</p>
                <p className="mt-1 text-sm opacity-90">
                  Ends {new Date(activeRes.end_time).toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl bg-white/20 p-3 backdrop-blur">
                <Zap className="h-7 w-7" />
              </div>
            </div>
          </Link>
        )}

        <div className="mt-6 grid grid-cols-3 gap-3">
          <QuickAction to="/reservations" icon={History} label="History" />
          <QuickAction to="/vehicles" icon={Car} label="Vehicles" />
          <QuickAction to="/profile" icon={Clock} label="Profile" />
        </div>

        {!isLoading && filtered.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Parking map</h2>
              <span className="text-xs text-muted-foreground">Live pricing</span>
            </div>
            <LotMap
              height={300}
              lots={filtered.map((l) => ({
                id: l.id,
                name: l.name,
                address: l.address,
                latitude: l.latitude,
                longitude: l.longitude,
                hourly_price: l.hourly_price,
                available: availabilityMap[l.id]?.available,
                total: availabilityMap[l.id]?.total,
              }))}
              onSelect={(id) => navigate({ to: "/lots/$id", params: { id } })}
            />
          </div>
        )}

        <div id="nearby-parking" className="mt-8 flex items-baseline justify-between scroll-mt-20">
          <h2 className="text-lg font-semibold">Nearby parking</h2>
          <span className="text-xs text-muted-foreground">
            {filtered.length} lot{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-3xl bg-card shadow-soft"
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {filtered.map((lot, i) => (
              <LotCard key={lot.id} lot={lot} index={i} availability={availabilityMap[lot.id]} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-muted-foreground">
                No parking lots match "{query}".
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function DashStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-secondary p-3">
      <Icon className={`h-5 w-5 ${color}`} />
      <div>
        <p className="text-lg font-bold leading-tight">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-3xl border border-border bg-card px-3 py-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="rounded-2xl bg-accent p-2.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

function LotCard({ lot, index, availability }: { lot: Lot; index: number; availability?: { available: number; total: number } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.35 }}
    >
      <Link
        to="/lots/$id"
        params={{ id: lot.id }}
        className="group block overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated"
      >
        <div className="relative h-40 w-full overflow-hidden bg-secondary">
          {lot.image_url && (
            <img
              src={lot.image_url}
              alt={lot.name}
              className="h-full w-full object-cover transition group-hover:scale-105"
              loading="lazy"
            />
          )}
          <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow-soft">
            ${Number(lot.hourly_price).toFixed(2)}/hr
          </div>
          {/* Availability badge */}
          {availability && (
            <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
              <CheckCircle2 className="inline h-3 w-3 mr-0.5 text-green-400" />
              {availability.available}/{availability.total} free
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold">{lot.name}</h3>
            <div className="flex shrink-0 items-center gap-1 text-xs font-medium">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              {lot.rating?.toFixed(1) ?? "—"}
              <span className="text-muted-foreground">
                ({lot.review_count})
              </span>
            </div>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {lot.address}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(lot.amenities || []).slice(0, 3).map((a) => (
              <span
                key={a}
                className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
