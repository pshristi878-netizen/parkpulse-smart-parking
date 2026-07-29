import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, List, Map as MapIcon, MapPin, Search as SearchIcon, SlidersHorizontal, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/park/BottomNav";
import { LotMap } from "@/components/park/LotMap";

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

type SearchParams = { q?: string };

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search parking — ParkPulse" },
      { name: "description", content: "Find parking spots near you with live availability and filters." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

type SortKey = "rating" | "price_asc" | "price_desc" | "name";

function SearchPage() {
  const navigate = useNavigate();
  const { q: initialQ } = Route.useSearch();
  const [query, setQuery] = useState(initialQ ?? "");
  const [maxPrice, setMaxPrice] = useState<number>(50);
  const [minRating, setMinRating] = useState<number>(0);
  const [sort, setSort] = useState<SortKey>("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");

  useEffect(() => {
    setQuery(initialQ ?? "");
  }, [initialQ]);

  // keep URL in sync (so refresh/share works)
  useEffect(() => {
    const id = setTimeout(() => {
      navigate({
        to: "/search",
        search: { q: query || undefined },
        replace: true,
      });
    }, 250);
    return () => clearTimeout(id);
  }, [query, navigate]);

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ["parking_lots_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parking_lots")
        .select(
          "id,name,address,city,hourly_price,image_url,rating,review_count,amenities,total_slots,latitude,longitude",
        )
        .eq("is_active", true);
      if (error) throw error;
      return data as Lot[];
    },
  });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = lots.filter((l) => {
      const matches =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        (l.city || "").toLowerCase().includes(q) ||
        (l.amenities || []).some((a) => a.toLowerCase().includes(q));
      const priceOk = Number(l.hourly_price) <= maxPrice;
      const ratingOk = (l.rating ?? 0) >= minRating;
      return matches && priceOk && ratingOk;
    });
    out = [...out].sort((a, b) => {
      if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === "price_asc") return Number(a.hourly_price) - Number(b.hourly_price);
      if (sort === "price_desc") return Number(b.hourly_price) - Number(a.hourly_price);
      return a.name.localeCompare(b.name);
    });
    return out;
  }, [lots, query, maxPrice, minRating, sort]);

  const suggestions = useMemo(() => {
    const set = new Set<string>();
    lots.forEach((l) => {
      if (l.city) set.add(l.city);
      (l.amenities || []).forEach((a) => set.add(a));
    });
    return Array.from(set).slice(0, 8);
  }, [lots]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
          <Link
            to="/home"
            className="rounded-full border border-border bg-card p-2 shadow-soft hover:bg-secondary"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-4 shadow-soft focus-within:border-primary"
          >
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search parking, city, amenity…"
              className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                showFilters
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "bg-secondary text-foreground hover:bg-accent"
              }`}
              aria-label="Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </form>
        </div>

        {showFilters && (
          <div className="mx-auto max-w-6xl px-5 pb-4">
            <div className="grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft md:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Max price: ${maxPrice}/hr
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="mt-2 w-full accent-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Min rating: {minRating.toFixed(1)}★
                </label>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="mt-2 w-full accent-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Sort</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="mt-2 w-full rounded-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="rating">Top rated</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-5 pt-5">
        {!query && suggestions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Try
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-soft hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-semibold">
              {query ? `Results for "${query}"` : "All parking"}
            </h1>
            <span className="text-xs text-muted-foreground">
              {results.length} lot{results.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-soft">
            <button
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                view === "list"
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button
              onClick={() => setView("map")}
              aria-pressed={view === "map"}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                view === "map"
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" /> Map
            </button>
          </div>
        </div>

        {view === "map" && !isLoading && results.length > 0 && (
          <div className="mb-4">
            <LotMap
              height={460}
              lots={results.map((l) => ({
                id: l.id,
                name: l.name,
                address: l.address,
                latitude: l.latitude,
                longitude: l.longitude,
                hourly_price: l.hourly_price,
              }))}
              onSelect={(id) => navigate({ to: "/lots/$id", params: { id } })}
            />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Tap a price marker to open the parking lot.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-3xl bg-card shadow-soft" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
            <p className="text-sm font-medium">No parking matches your search.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different keyword or relax your filters.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setMaxPrice(50);
                setMinRating(0);
              }}
              className="mt-4 rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Reset
            </button>
          </div>
        ) : view === "map" ? null : (
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((lot, i) => (
              <motion.div
                key={lot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.3 }}
              >
                <Link
                  to="/lots/$id"
                  params={{ id: lot.id }}
                  className="group flex overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated"
                >
                  <div className="relative h-32 w-32 shrink-0 overflow-hidden bg-secondary">
                    {lot.image_url && (
                      <img
                        src={lot.image_url}
                        alt={lot.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold leading-tight">{lot.name}</h3>
                        <div className="flex shrink-0 items-center gap-1 text-xs font-medium">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          {lot.rating?.toFixed(1) ?? "—"}
                        </div>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="line-clamp-1">{lot.address}</span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        ${Number(lot.hourly_price).toFixed(2)}
                        <span className="text-[10px] font-medium text-muted-foreground">/hr</span>
                      </span>
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                        {lot.total_slots} slots
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
