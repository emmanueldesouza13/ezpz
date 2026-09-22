"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "forgot";

function SignInForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordWarning, setShowPasswordWarning] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
      });
      setBusy(false);
      if (error) setError(error.message);
      else setSent(true);
      return;
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setBusy(false);
      if (error) { setError(error.message); return; }
      if (data.session) {
        router.push(next);
      } else {
        setSent(true);
      }
      return;
    }

    // signin
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
    else router.push(next);
  }

  if (sent) {
    return (
      <div className="admin-login-wrap">
        <BackButton />
        <div className="icon-circle">
          <Icon name="Mail" />
        </div>
        <h1>Check your email</h1>
        <p>
          We sent a link to <strong>{email}</strong>. Tap it to{" "}
          {mode === "forgot" ? "set a new password" : "finish creating your account"}.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-login-wrap">
      <BackButton />
      <div className="icon-circle">
        <Icon name={mode === "forgot" ? "KeyRound" : "Mail"} />
      </div>
      <h1>{mode === "signin" ? "Sign in" : mode === "signup" ? "Create your account" : "Reset password"}</h1>
      <p>
        {mode === "signin" && "Sign in with your email and password."}
        {mode === "signup" && "Pick a password — no email confirmation needed, you'll be signed in right away."}
        {mode === "forgot" && "We'll email you a link to set a new password."}
      </p>
      {mode === "signup" && showPasswordWarning && (
        <div className="password-warning">
          <Icon name="AlertTriangle" size={15} />
          <p>Save or write down your password somewhere safe — if you forget it, you&#39;ll need to reset it.</p>
          <button
            type="button"
            className="password-warning-close"
            aria-label="Dismiss"
            onClick={() => setShowPasswordWarning(false)}
          >
            <Icon name="X" size={14} />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            className="control"
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        {mode !== "forgot" && (
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              className="control"
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
        )}
        <button type="submit" className="btn btn-accent btn-block" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send reset link"}
        </button>
        {error && <p className="admin-error">{error}</p>}
      </form>
      <div className="signin-switch">
        {mode === "signin" && (
          <>
            <button type="button" onClick={() => { setMode("signup"); setError(null); }}>
              New here? Create an account
            </button>
            <button type="button" onClick={() => { setMode("forgot"); setError(null); }}>
              Forgot password?
            </button>
          </>
        )}
        {mode !== "signin" && (
          <button type="button" onClick={() => { setMode("signin"); setError(null); }}>
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <Suspense fallback={null}>
            <SignInForm />
          </Suspense>
        </section>
      </main>
    </>
  );
}
