import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/park/Logo";

const schema = z
  .object({
    password: z.string().min(6, "At least 6 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

type Input = z.infer<typeof schema>;

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — ParkPulse" },
      { name: "description", content: "Set a new ParkPulse password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places a recovery session in the URL hash; the client picks it up.
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }: Input) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/home", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-4xl border border-border bg-card p-8 shadow-elevated">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a strong password for your account.
        </p>
        {!ready ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Waiting for reset link… If nothing happens, request a new link from
            the sign-in page.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3">
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="New password"
                {...register("password")}
                className="w-full rounded-2xl border border-border bg-input/40 py-3 pr-4 pl-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
              {errors.password && (
                <p className="mt-1 pl-1 text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Confirm password"
                {...register("confirm")}
                className="w-full rounded-2xl border border-border bg-input/40 py-3 pr-4 pl-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
              {errors.confirm && (
                <p className="mt-1 pl-1 text-xs text-destructive">
                  {errors.confirm.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gradient-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {isSubmitting ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
