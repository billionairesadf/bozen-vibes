import React from "react";
import { LogOut, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { auth } from "../firebase";

export default function Navbar({ currentUser, totalOwed, totalOwes, onReset }) {
  const handleLogout = () => {
    auth.signOut();
  };

  const netBalance = totalOwed - totalOwes;

  return (
    <nav className="glass-panel" style={{ borderRadius: "0 0 16px 16px", borderTop: "none", padding: "1rem 1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1200px", margin: "0 auto", gap: "1rem", flexWrap: "wrap" }}>
        
        {/* App Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="friend-avatar" style={{ width: "32px", height: "32px", fontSize: "0.75rem" }}>SA</div>
          <span style={{ fontWeight: 700, fontSize: "1.25rem", fontFamily: "var(--font-heading)" }}>
            <span className="gradient-text">Schulden</span>App
          </span>
        </div>

        {/* Balance Overview in Navbar (if logged in) */}
        {currentUser && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            
            {/* Owed to me */}
            <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.8rem", borderRadius: "10px", fontSize: "0.85rem" }}>
              <TrendingUp size={14} style={{ color: "var(--color-success)" }} />
              <span style={{ color: "var(--text-secondary)" }}>Bekommst du:</span>
              <strong style={{ color: "var(--color-success)" }}>{totalOwed.toFixed(2)} €</strong>
            </div>

            {/* Owed by me */}
            <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.8rem", borderRadius: "10px", fontSize: "0.85rem" }}>
              <TrendingDown size={14} style={{ color: "var(--color-danger)" }} />
              <span style={{ color: "var(--text-secondary)" }}>Du schuldest:</span>
              <strong style={{ color: "var(--color-danger)" }}>{totalOwes.toFixed(2)} €</strong>
            </div>

            {/* Net balance badge */}
            <div className={`badge ${netBalance >= 0 ? 'badge-settled' : 'badge-pending'}`} style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
              Saldo: {netBalance >= 0 ? "+" : ""}{netBalance.toFixed(2)} €
            </div>

          </div>
        )}

        {/* User profile & logout */}
        {currentUser && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{currentUser.displayName || "Benutzer"}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{currentUser.email}</div>
            </div>
            <button 
              onClick={handleLogout} 
              className="btn btn-secondary btn-icon" 
              title="Abmelden"
              style={{ borderRadius: "50%" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
