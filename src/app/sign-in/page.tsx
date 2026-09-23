"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";
import PasswordInput from "@/components/PasswordInput";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Mode = "signin" | "signup" | "forgot";

function SignInForm() {
  const supabase = createClient();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const initialMode = searchParams.get("mode");
  const [mode, setMode] = useState<Mode>(
    initialMode === "signup" || initialMode === "forgot" ? initialMode : "signin"
  );
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
        <LanguageSwitcher className="signin-lang" />
        <div className="icon-circle">
          <Icon name="Mail" />
        </div>
        <h1>{t("auth.checkEmail")}</h1>
        <p>
          {t("auth.emailSentTo", {
            email,
            action: mode === "forgot" ? t("auth.actionSetPassword") : t("auth.actionFinishAccount"),
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-login-wrap">
      <BackButton />
      <LanguageSwitcher className="signin-lang" />
      <div className="icon-circle">
        <Icon name={mode === "forgot" ? "KeyRound" : "Mail"} />
      </div>
      <h1>{mode === "signin" ? t("auth.titleSignIn") : mode === "signup" ? t("auth.titleSignUp") : t("auth.titleForgot")}</h1>
      <p>
        {mode === "signin" && t("auth.subSignIn")}
        {mode === "signup" && t("auth.subSignUp")}
        {mode === "forgot" && t("auth.subForgot")}
      </p>
      {mode === "signup" && showPasswordWarning && (
        <div className="password-warning">
          <Icon name="AlertTriangle" size={15} />
          <p>{t("auth.passwordWarning")}</p>
          <button
            type="button"
            className="password-warning-close"
            aria-label={t("auth.dismiss")}
            onClick={() => setShowPasswordWarning(false)}
          >
            <Icon name="X" size={14} />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">{t("auth.emailLabel")}</label>
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
            <label htmlFor="password">{t("auth.passwordLabel")}</label>
            <PasswordInput
              id="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
            />
          </div>
        )}
        <button type="submit" className="btn btn-accent btn-block" disabled={busy}>
          {busy
            ? t("auth.pleaseWait")
            : mode === "signin"
              ? t("auth.signInBtn")
              : mode === "signup"
                ? t("auth.createAccountBtn")
                : t("auth.sendResetBtn")}
        </button>
        {error && <p className="admin-error">{error}</p>}
      </form>
      <div className="signin-switch">
        {mode === "signin" && (
          <>
            <button type="button" onClick={() => { setMode("signup"); setError(null); }}>
              {t("auth.newHere")}
            </button>
            <button type="button" onClick={() => { setMode("forgot"); setError(null); }}>
              {t("auth.forgotPassword")}
            </button>
          </>
        )}
        {mode !== "signin" && (
          <button type="button" onClick={() => { setMode("signin"); setError(null); }}>
            {t("auth.backToSignIn")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <main>
      <section className="wrap">
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </section>
    </main>
  );
}
