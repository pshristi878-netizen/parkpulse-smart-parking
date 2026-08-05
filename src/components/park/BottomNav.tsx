import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Ticket, Bell, User, Car } from "lucide-react";
import { useUnreadCount } from "@/hooks/use-unread-count";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/reservations", label: "Bookings", icon: Ticket },
  { to: "/vehicles", label: "Cars", icon: Car },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Me", icon: User },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const unreadCount = useUnreadCount();

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[min(560px,calc(100vw-1.5rem))] -translate-x-1/2">
      <div className="glass mx-auto flex items-center justify-around rounded-full px-2 py-2 shadow-elevated">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to || path.startsWith(to + "/");
          const isBell = to === "/notifications";

          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[10px] font-medium transition ${
                active
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isBell ? (
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
