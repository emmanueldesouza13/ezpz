"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";
import PasswordInput from "@/components/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push("/account"), 1200);
  }

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <div className="admin-login-wrap">
            <BackButton />
            <div className="icon-circle">
              <Icon name="KeyRound" />
            </div>
            <h1>{t("resetPassword.title")}</h1>
            {!ready && !done && <p>{t("resetPassword.confirming")}</p>}
            {ready && !done && (
              <>
                <p>{t("resetPassword.choose")}</p>
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <label htmlFor="password">{t("resetPassword.newPasswordLabel")}</label>
                    <PasswordInput
                      id="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("auth.passwordPlaceholder")}
                    />
                  </div>
                  <button type="submit" className="btn btn-accent btn-block" disabled={busy}>
                    {busy ? t("resetPassword.saving") : t("resetPassword.savePassword")}
                  </button>
                  {error && <p className="admin-error">{error}</p>}
                </form>
              </>
            )}
            {done && <p>{t("resetPassword.done")}</p>}
          </div>
        </section>
      </main>
    </>
  );
}
