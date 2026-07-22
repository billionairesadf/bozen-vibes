import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { Lock, Mail, User, AlertCircle, Loader } from "lucide-react";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        if (!displayName.trim()) {
          throw new Error("Bitte gib einen Namen ein.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set display name in auth profile
        await updateProfile(userCredential.user, { displayName });
        
        // Send email verification
        try {
          await sendEmailVerification(userCredential.user);
        } catch (emailErr) {
          console.error("Verifizierungs-E-Mail konnte nicht gesendet werden:", emailErr);
        }
        
        // Save user profile in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: email.toLowerCase(),
          displayName,
          createdAt: new Date().toISOString()
        });
      } else {
        // Log in
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      let GermanError = err.message;
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        GermanError = "E-Mail oder Passwort ist falsch.";
      } else if (err.code === "auth/email-already-in-use") {
        GermanError = "Diese E-Mail-Adresse wird bereits verwendet.";
      } else if (err.code === "auth/weak-password") {
        GermanError = "Das Passwort muss mindestens 6 Zeichen lang sein.";
      } else if (err.code === "auth/invalid-email") {
        GermanError = "Ungültige E-Mail-Adresse.";
      }
      setError(GermanError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="gradient-text">Schulden</span>App
          </div>
          <p className="auth-subtitle">
            {isSignUp ? "Erstelle dein Konto, um Schulden zu verwalten" : "Melde dich an, um deine Schulden zu verwalten"}
          </p>
        </div>

        {error && (
          <div className="glass-panel" style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.75rem 1rem", background: "var(--color-danger-bg)", borderColor: "rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", color: "#f87171", fontSize: "0.9rem" }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="displayName">Dein Name</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                  <User size={18} />
                </span>
                <input
                  id="displayName"
                  type="text"
                  className="input-field"
                  placeholder="Max Mustermann"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{ paddingLeft: "2.75rem" }}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">E-Mail-Adresse</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                <Mail size={18} />
              </span>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="name@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "2.75rem" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Passwort</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                <Lock size={18} />
              </span>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "2.75rem" }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem", height: "48px" }}
            disabled={loading}
          >
            {loading ? (
              <Loader size={20} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
            ) : isSignUp ? (
              "Registrieren"
            ) : (
              "Anmelden"
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isSignUp ? (
            <>
              Schon registriert?{" "}
              <span onClick={() => { setIsSignUp(false); setError(""); }} className="auth-link">
                Jetzt anmelden
              </span>
            </>
          ) : (
            <>
              Neu hier?{" "}
              <span onClick={() => { setIsSignUp(true); setError(""); }} className="auth-link">
                Konto erstellen
              </span>
            </>
          )}
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
