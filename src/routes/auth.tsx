import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/park/Logo";
import {
  loginSchema,
  signupSchema,
  forgotSchema,
  type LoginInput,
  type SignupInput,
  type ForgotInput,
} from "@/lib/auth-schemas";

const searchSchema = z.object({
  mode: z.enum(["login", "signup", "forgot"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — ParkPulse" },
      {
        name: "description",
        content: "Sign in or create your ParkPulse account.",
      },
      { property: "og:title", content: "Sign in — ParkPulse" },
      {
        property: "og:description",
        content: "Sign in or create your ParkPulse account.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(search.mode ?? "login");

  useEffect(() => {
    // If already signed in, bounce to /home
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-4xl border border-border bg-card p-8 shadow-elevated">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>
          <AnimatePresence mode="wait">
            {mode === "login" && (
              <LoginForm
                key="login"
                onSwitch={setMode}
                redirectTo={search.redirect}
              />
            )}
            {mode === "signup" && (
              <SignupForm
                key="signup"
                onSwitch={setMode}
                redirectTo={search.redirect}
              />
            )}
            {mode === "forgot" && (
              <ForgotForm key="forgot" onSwitch={setMode} />
            )}
          </AnimatePresence>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to ParkPulse's Terms and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}

/* --------------------- Sub-forms --------------------- */

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    window.location.href = "/home";
  };
  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-soft transition hover:bg-secondary disabled:opacity-50"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">or</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function Field({
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        {...props}
        className="w-full rounded-2xl border border-border bg-input/40 py-3 pr-4 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
      />
    </div>
  );
}

function PasswordField({
  register,
  name,
  placeholder = "Password",
}: {
  register: ReturnType<typeof useForm>["register"];
  name: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        {...register(name)}
        className="w-full rounded-2xl border border-border bg-input/40 py-3 pr-11 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 pl-1 text-xs text-destructive">{msg}</p>;
}

function PrimaryButton({
  children,
  loading,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className="w-full rounded-2xl bg-gradient-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-60"
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

function FormWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function LoginForm({
  onSwitch,
  redirectTo,
}: {
  onSwitch: (m: Mode) => void;
  redirectTo?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    window.location.href = redirectTo || "/home";
  };

  return (
    <FormWrap>
      <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to reserve your next parking spot.
      </p>

      <div className="mt-6">
        <GoogleButton />
        <Divider />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Field icon={Mail} placeholder="Email" {...register("email")} />
            <ErrorText msg={errors.email?.message} />
          </div>
          <div>
            <PasswordField
              register={register as never}
              name="password"
              placeholder="Password"
            />
            <ErrorText msg={errors.password?.message} />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onSwitch("forgot")}
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <PrimaryButton loading={isSubmitting}>Sign in</PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to ParkPulse?{" "}
          <button
            type="button"
            onClick={() => onSwitch("signup")}
            className="font-semibold text-primary hover:underline"
          >
            Create an account
          </button>
        </p>
      </div>
    </FormWrap>
  );
}

function SignupForm({
  onSwitch,
  redirectTo,
}: {
  onSwitch: (m: Mode) => void;
  redirectTo?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupInput) => {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: values.fullName },
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created");
    window.location.href = redirectTo || "/home";
  };

  return (
    <FormWrap>
      <h1 className="text-2xl font-bold text-foreground">Create account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start finding parking in seconds.
      </p>

      <div className="mt-6">
        <GoogleButton />
        <Divider />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Field icon={User} placeholder="Full name" {...register("fullName")} />
            <ErrorText msg={errors.fullName?.message} />
          </div>
          <div>
            <Field icon={Mail} placeholder="Email" {...register("email")} />
            <ErrorText msg={errors.email?.message} />
          </div>
          <div>
            <PasswordField
              register={register as never}
              name="password"
              placeholder="Password (min 6 chars)"
            />
            <ErrorText msg={errors.password?.message} />
          </div>
          <PrimaryButton loading={isSubmitting}>Create account</PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => onSwitch("login")}
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </FormWrap>
  );
}

function ForgotForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotInput>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async ({ email }: ForgotInput) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Check your email for the reset link");
  };

  return (
    <FormWrap>
      <button
        type="button"
        onClick={() => onSwitch("login")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We'll email you a link to set a new password.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3">
        <div>
          <Field icon={Mail} placeholder="Email" {...register("email")} />
          <ErrorText msg={errors.email?.message} />
        </div>
        <PrimaryButton loading={isSubmitting}>Send reset link</PrimaryButton>
      </form>
    </FormWrap>
  );
}
