import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  ParkingCircle,
  Grid3X3,
  CalendarCheck,
  Users,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw redirect({ to: "/home" });
    }

    return { user: data.user };
  },
  component: AdminLayout,
});

const navItems: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/lots", label: "Parking Lots", icon: ParkingCircle },
  { to: "/admin/slots", label: "Slots", icon: Grid3X3 },
  { to: "/admin/reservations", label: "Reservations", icon: CalendarCheck },
  { to: "/admin/users", label: "Users", icon: Users },
];

function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="rounded-full border border-border bg-card p-2 shadow-soft hover:bg-secondary"
              aria-label="Back to app"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-lg font-bold">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                ParkPulse
              </span>{" "}
              Admin
            </h1>
          </div>
          <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
            Super Admin
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border bg-card/50 md:min-h-[calc(100vh-57px)]">
          <nav className="flex md:flex-col gap-1 p-2 md:p-3 overflow-x-auto md:overflow-visible">
            {navItems.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? path === to : path.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-gradient-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}