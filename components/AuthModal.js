"use client";
import { useState } from "react";
import { useAuthModal } from "@/lib/AuthModalContext";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/lib/i18n/I18nContext";

export default function AuthModal() {
  const { isOpen, mode, setMode, closeAuthModal } = useAuthModal();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setSuccess(t("auth_signup_success"));
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        closeAuthModal();
      }
    } catch (err) {
      setError(err.message || "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" type="button" onClick={closeAuthModal}>
          ✕
        </button>
        <h2 className="auth-modal-title">
          {mode === "signup" ? t("auth_signup_title") : t("auth_login_title")}
        </h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            {t("auth_email_label")}
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="auth-label">
            {t("auth_password_label")}
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading
              ? t("auth_submit_loading")
              : mode === "signup"
              ? t("auth_submit_signup")
              : t("auth_submit_login")}
          </button>
        </form>
        <div className="auth-switch">
          {mode === "signup" ? (
            <>
              {t("auth_has_account")}{" "}
              <button className="auth-switch-link" type="button" onClick={() => setMode("login")}>
                {t("auth_switch_to_login")}
              </button>
            </>
          ) : (
            <>
              {t("auth_no_account")}{" "}
              <button className="auth-switch-link" type="button" onClick={() => setMode("signup")}>
                {t("auth_switch_to_signup")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
