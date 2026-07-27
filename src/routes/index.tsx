import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Zap, ShieldCheck, Clock } from "lucide-react";
import { Logo } from "@/components/park/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ParkPulse — Smart Parking, Smarter Cities" },
      {
        name: "description",
        content:
          "Find, reserve and pay for parking in seconds. Live availability, QR entry, and premium parking spots near you.",
      },
      {
        property: "og:title",
        content: "ParkPulse — Smart Parking, Smarter Cities",
      },
      {
        property: "og:description",
        content:
          "Find, reserve and pay for parking in seconds. Live availability, QR entry, and premium parking spots near you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const goApp = async (e: React.MouseEvent) => {
    e.preventDefault();
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      window.location.href = "/home";
    } else {
      window.location.href = "/auth";
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="flex items-center gap-3">
            <Link
              to="/auth"
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Sign in
            </Link>
            <a
              href="/home"
              onClick={goApp}
              className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
            >
              Get started
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            Live parking availability, updated every second
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight text-foreground md:text-7xl">
            Smart parking for
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              smarter cities
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Find nearby spots, reserve in seconds, and glide in with a QR code.
            No more circling the block.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/home"
              onClick={goApp}
              className="rounded-full bg-gradient-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
            >
              Find parking now
            </a>
            <Link
              to="/auth"
              className="rounded-full border border-border bg-card px-8 py-3.5 text-base font-semibold text-foreground shadow-soft transition hover:bg-secondary"
            >
              Create account
            </Link>
          </div>
        </motion.div>

        {/* Feature cards */}
        <div className="mt-24 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: MapPin,
              title: "Nearby in seconds",
              body: "See every parking lot around you on a live map with prices and availability.",
            },
            {
              icon: Zap,
              title: "Reserve instantly",
              body: "Pick your slot, hold it for 15 minutes, and receive a QR code for entry.",
            },
            {
              icon: ShieldCheck,
              title: "Pay securely",
              body: "UPI, card, or wallet. Digital receipts stored automatically in your history.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              className="rounded-3xl border border-border bg-card p-6 shadow-soft"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-accent p-3">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Available 24/7
          </div>
          <p>© {new Date().getFullYear()} ParkPulse</p>
        </div>
      </footer>
    </div>
  );
}
