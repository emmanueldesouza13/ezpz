"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
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
            <h1>Set a new password</h1>
            {!ready && !done && <p>Confirming your reset link…</p>}
            {ready && !done && (
              <>
                <p>Choose a password you&#39;ll use to sign in from now on.</p>
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <label htmlFor="password">New password</label>
                    <input
                      className="control"
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <button type="submit" className="btn btn-accent btn-block" disabled={busy}>
                    {busy ? "Saving…" : "Save password"}
                  </button>
                  {error && <p className="admin-error">{error}</p>}
                </form>
              </>
            )}
            {done && <p>Password saved — taking you to your account…</p>}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
