import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Bell } from "lucide-react";
import { Logo } from "./Logo";

export function AppHeader({
  title,
  back,
}: {
  title?: string;
  back?: boolean;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        {back ? (
          <button
            onClick={() => {
              if (window.history.length > 1) router.history.back();
              else navigate({ to: "/home" });
            }}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium shadow-soft hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <Logo size="sm" />
        )}
        {title && (
          <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold">
            {title}
          </h1>
        )}
        <Link
          to="/notifications"
          className="rounded-full border border-border bg-card p-2.5 shadow-soft hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
