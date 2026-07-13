import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/components/AuthProvider";
import sourceProLogo from "@/assets/source-pro-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign in — Win Talent" }],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);

  // form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // ensure dark theme on auth page for consistency
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // already authed -> redirect
  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/" });
    }
  }, [loading, session, navigate]);

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const redirect_uri = `${window.location.origin}/`;
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri });
      if (result?.error) throw result.error;
      // If not redirected, session is set; navigate.
      if (!("redirected" in result) || !result.redirected) {
        toast.success("Signed in with Google");
        navigate({ to: "/" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      if (data.session) {
        toast.success("Account created — you're signed in");
        navigate({ to: "/" });
      } else {
        toast.success("Check your email to confirm your account");
        setMode("signin");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to sign up");
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent");
      setMode("signin");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to send reset email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-border">
            <img src={sourceProLogo.url} alt="Win Talent" className="h-full w-full object-cover" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Win Talent</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          {mode !== "forgot" ? (
            <>
              <div className="mb-6 flex rounded-lg border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign up
                </button>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-accent disabled:opacity-60"
              >
                <GoogleGIcon className="h-4 w-4" />
                Continue with Google
              </button>

              <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              {mode === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-3">
                  <Field icon={<Mail className="h-4 w-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} required />
                  <Field icon={<Lock className="h-4 w-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} required />
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground">
                      Forgot password?
                    </button>
                  </div>
                  <SubmitButton busy={busy} label="Sign in" />
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <Field icon={<UserIcon className="h-4 w-4" />} type="text" placeholder="Full name" value={fullName} onChange={setFullName} required />
                  <Field icon={<Mail className="h-4 w-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} required />
                  <Field icon={<Lock className="h-4 w-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} required />
                  <Field icon={<Lock className="h-4 w-4" />} type="password" placeholder="Confirm password" value={confirm} onChange={setConfirm} required />
                  <SubmitButton busy={busy} label="Create account" />
                </form>
              )}
            </>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
              <div>
                <h2 className="text-lg font-semibold">Reset your password</h2>
                <p className="mt-1 text-sm text-muted-foreground">We'll email you a link to reset your password.</p>
              </div>
              <Field icon={<Mail className="h-4 w-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} required />
              <SubmitButton busy={busy} label="Send reset link" />
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to use Win Talent responsibly.
        </p>
        <div className="mt-2 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:ring-2 focus-within:ring-primary/40">
      <span className="text-muted-foreground">{icon}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
      />
    </div>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
  );
}

function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.9 35.2 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
