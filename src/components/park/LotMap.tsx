import { Suspense, lazy, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import type { MapLot } from "./LotMapClient";

const LotMapClient = lazy(() => import("./LotMapClient"));

type Props = {
  lots: MapLot[];
  activeId?: string | null;
  height?: number;
  zoom?: number;
  onSelect?: (id: string) => void;
  className?: string;
};

function MapSkeleton({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center bg-secondary text-muted-foreground"
      style={{ height }}
    >
      <div className="flex flex-col items-center gap-2">
        <MapPin className="h-6 w-6 animate-pulse text-primary" />
        <span className="text-xs">Loading map…</span>
      </div>
    </div>
  );
}

/**
 * SSR-safe map. Leaflet touches `window`, so we only mount the real map
 * on the client after hydration.
 */
export function LotMap({ height = 320, className, ...rest }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className={`relative isolate overflow-hidden rounded-3xl border border-border shadow-soft ${className ?? ""}`}
    >
      {mounted ? (
        <Suspense fallback={<MapSkeleton height={height} />}>
          <LotMapClient height={height} {...rest} />
        </Suspense>
      ) : (
        <MapSkeleton height={height} />
      )}
    </div>
  );
}
