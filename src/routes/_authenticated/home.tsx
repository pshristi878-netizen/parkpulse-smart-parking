import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Bell, LogOut, MapPin, Search } from "lucide-react";
import { Logo } from "@/components/park/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — ParkPulse" },
      { name: "description", content: "Find parking near you." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("there");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as
        | { full_name?: string; name?: string }
        | undefined;
      const n = meta?.full_name || meta?.name || data.user?.email?.split("@")[0];
      if (n) setName(n.split(" ")[0]);
    });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-2">
            <button className="rounded-full border border-border bg-card p-2.5 shadow-soft hover:bg-secondary">
              <Bell className="h-5 w-5" />
            </button>
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

      <main className="mx-auto max-w-6xl px-6 pt-8">
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

        <div className="mt-6 flex items-center gap-2 rounded-3xl border border-border bg-card px-4 py-3 shadow-soft">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            placeholder="Search parking by location, name…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <section className="mt-10 rounded-4xl border border-dashed border-border bg-card/60 p-10 text-center">
          <div className="mx-auto mb-3 inline-flex rounded-2xl bg-accent p-3">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Phase 2 coming next</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Live Google Maps, nearby parking cards, filters, parking details and
            slot reservation will arrive in the next phase.
          </p>
        </section>
      </main>
    </div>
  );
}
