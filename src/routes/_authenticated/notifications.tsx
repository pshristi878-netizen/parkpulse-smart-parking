import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { AppHeader } from "@/components/park/AppHeader";
import { BottomNav } from "@/components/park/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — ParkPulse" },
      { name: "description", content: "Your alerts and updates" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const markAll = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", u.user.id)
      .eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="Notifications" />
      <main className="mx-auto max-w-3xl px-5 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {rows.filter((r) => !r.is_read).length} unread
          </p>
          <button
            onClick={markAll}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
            <div className="mx-auto mb-3 inline-flex rounded-2xl bg-accent p-3">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              You're all caught up.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {rows.map((n) => {
              const inner = (
                <div
                  className={`rounded-2xl border border-border p-4 shadow-soft transition ${
                    n.is_read ? "bg-card" : "bg-accent/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{n.title}</p>
                      {n.body && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.action_url ? (
                    <Link to={n.action_url} className="block">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
