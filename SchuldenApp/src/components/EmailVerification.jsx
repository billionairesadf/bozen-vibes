import React, { useState, useEffect } from "react";
import { signOut, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";
import { Mail, Check, LogOut, RefreshCw, AlertCircle } from "lucide-react";

export default function EmailVerification({ onVerified }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCheckVerification = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setMessage("E-Mail erfolgreich verifiziert! 🎉");
          if (onVerified) {
            onVerified();
          }
        } else {
          setError("Die E-Mail wurde noch nicht bestätigt. Bitte überprüfe dein Postfach.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Fehler beim Aktualisieren: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setError("");
    setMessage("");
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setMessage("Verifizierungs-E-Mail wurde erneut gesendet. ✉️");
        setResendCooldown(60);
      }
    } catch (err) {
      console.error(err);
      setError("Fehler beim Senden: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card animate-fade-in" style={{ padding: "2rem" }}>
        <div className="auth-header" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            color: "var(--accent-primary)",
            marginBottom: "1.25rem"
          }}>
            <Mail size={32} />
          </div>
          <h2 className="auth-title" style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            E-Mail bestätigen
          </h2>
          <p className="auth-subtitle" style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Wir haben eine Bestätigungs-E-Mail an <strong style={{ color: "var(--text-primary)" }}>{auth.currentUser?.email}</strong> gesendet. Bitte bestätige dein Konto, um fortzufahren.
          </p>
        </div>

        {error && (
          <div className="glass-panel" style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.75rem 1rem", background: "var(--color-danger-bg)", borderColor: "rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", color: "#f87171", fontSize: "0.9rem" }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="glass-panel" style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.75rem 1rem", background: "var(--color-success-bg)", borderColor: "rgba(16, 185, 129, 0.2)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", color: "#34d399", fontSize: "0.9rem" }}>
            <Check size={18} style={{ flexShrink: 0 }} />
            <span>{message}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", height: "48px" }}
            onClick={handleCheckVerification}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw size={18} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <>
                <Check size={18} />
                Ich habe meine E-Mail bestätigt
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: "100%", height: "48px", background: "rgba(255, 255, 255, 0.03)", borderColor: "var(--border-glass)", cursor: resendCooldown > 0 ? "not-allowed" : "pointer" }}
            onClick={handleResendEmail}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Erneut senden in ${resendCooldown}s` : "E-Mail erneut senden"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: "100%", height: "48px", marginTop: "0.5rem", background: "rgba(239, 68, 68, 0.08)", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.15)" }}
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Abmelden
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
