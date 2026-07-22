import React, { useState } from "react";
import { ArrowLeft, Plus, Check, Edit2, Trash2, Calendar, Smile } from "lucide-react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import confetti from "canvas-confetti";

export default function FriendDetail({ friend, debts, currentUser, onBack, onAddDebt, onEditDebt }) {
  const [showSettled, setShowSettled] = useState(true);

  // Filter debts between current user and this friend
  const friendDebts = debts.filter((debt) => {
    const isCreditor = debt.creditorEmail.toLowerCase() === currentUser.email.toLowerCase();
    const isDebtor = debt.debtorEmail.toLowerCase() === currentUser.email.toLowerCase();
    const isFriendCreditor = debt.creditorEmail.toLowerCase() === friend.email.toLowerCase();
    const isFriendDebtor = debt.debtorEmail.toLowerCase() === friend.email.toLowerCase();

    return (isCreditor && isFriendDebtor) || (isDebtor && isFriendCreditor);
  });

  // Calculate net balance
  let netBalance = 0;
  friendDebts.forEach((debt) => {
    if (debt.status === "pending") {
      const isCreditor = debt.creditorEmail.toLowerCase() === currentUser.email.toLowerCase();
      if (isCreditor) {
        netBalance += debt.amount;
      } else {
        netBalance -= debt.amount;
      }
    }
  });

  const pendingDebts = friendDebts.filter((d) => d.status === "pending");
  const settledDebts = friendDebts.filter((d) => d.status === "settled");

  const handleSettle = async (debt) => {
    try {
      const docRef = doc(db, "debts", debt.id);
      await updateDoc(docRef, {
        status: "settled",
        settledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Show beautiful confetti burst!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#a855f7", "#14b8a6"]
      });
    } catch (err) {
      console.error(err);
      alert("Konnte Schuld nicht begleichen. Bitte erneut versuchen.");
    }
  };

  const handleDelete = async (debtId) => {
    if (window.confirm("Möchtest du diesen Eintrag wirklich dauerhaft löschen?")) {
      try {
        await deleteDoc(doc(db, "debts", debtId));
      } catch (err) {
        console.error(err);
        alert("Fehler beim Löschen.");
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div>
      {/* Header with back button */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button onClick={onBack} className="btn btn-secondary btn-icon" style={{ borderRadius: "50%" }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: "1.75rem" }}>{friend.name}</h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{friend.email}</span>
        </div>
      </div>

      {/* Net Balance Panel with Friend */}
      <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <span className="balance-title">Verhältnis mit {friend.name}</span>
            {netBalance > 0 ? (
              <h3 style={{ fontSize: "2rem", color: "var(--color-success)", marginTop: "0.25rem" }}>
                {friend.name} schuldet dir {netBalance.toFixed(2)} €
              </h3>
            ) : netBalance < 0 ? (
              <h3 style={{ fontSize: "2rem", color: "var(--color-danger)", marginTop: "0.25rem" }}>
                Du schuldest {friend.name} {Math.abs(netBalance).toFixed(2)} €
              </h3>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                <h3 style={{ fontSize: "2rem", color: "white" }}>Ihr seid quitt!</h3>
                <Smile size={28} style={{ color: "var(--accent-secondary)" }} />
              </div>
            )}
          </div>
          <button onClick={() => onAddDebt(friend)} className="btn btn-primary">
            <Plus size={18} /> Schuld eintragen
          </button>
        </div>
      </div>

      {/* Toggles and list header */}
      <div className="section-header">
        <h3 className="section-title">Transaktionen ({friendDebts.length})</h3>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>
          <input 
            type="checkbox" 
            checked={showSettled} 
            onChange={(e) => setShowSettled(e.target.checked)} 
            style={{ accentColor: "var(--accent-primary)" }}
          />
          Beglichene anzeigen
        </label>
      </div>

      {/* Debts listing */}
      <div className="debt-list">
        {pendingDebts.length === 0 && (!showSettled || settledDebts.length === 0) ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>Keine Einträge</h3>
            <p>Es sind noch keine gemeinsamen Einträge für diesen Filter vorhanden.</p>
          </div>
        ) : (
          <>
            {/* Pending Debts */}
            {pendingDebts.map((debt) => {
              const isCreditor = debt.creditorEmail.toLowerCase() === currentUser.email.toLowerCase();
              const isCreator = debt.creatorEmail && debt.creatorEmail.toLowerCase() === currentUser.email.toLowerCase();
              return (
                <div key={debt.id} className="debt-item">
                  <div className="debt-item-info">
                    <div className="debt-item-icon" style={{ color: isCreditor ? "var(--color-success)" : "var(--color-danger)", background: isCreditor ? "var(--color-success-bg)" : "var(--color-danger-bg)" }}>
                      {isCreditor ? "+" : "-"}
                    </div>
                    <div className="debt-item-details">
                      <h4>{debt.description}</h4>
                      <p style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Calendar size={12} /> {formatDate(debt.createdAt)}
                      </p>
                      <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                        {isCreditor ? "Ausgelegt von dir" : `Ausgelegt von ${friend.name}`}
                        {!isCreator && debt.creatorEmail && (
                          <span style={{ fontStyle: "italic", opacity: 0.8 }}>
                            {" "}(Eingetragen von {debt.creatorEmail.toLowerCase() === friend.email.toLowerCase() ? friend.name : debt.creatorName})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div className="debt-item-amount">
                      <div className="price" style={{ color: isCreditor ? "var(--color-success)" : "var(--color-danger)" }}>
                        {isCreditor ? "+" : "-"}{debt.amount.toFixed(2)} €
                      </div>
                      <span className="badge badge-pending">Ausstehend</span>
                    </div>
                    
                    {isCreator && (
                      <div className="debt-item-actions">
                        <button 
                          onClick={() => handleSettle(debt)} 
                          className="btn btn-success btn-icon" 
                          title="Als beglichen markieren"
                          style={{ padding: "0.3rem", borderRadius: "6px" }}
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => onEditDebt(debt)} 
                          className="btn btn-secondary btn-icon" 
                          title="Bearbeiten"
                          style={{ padding: "0.3rem", borderRadius: "6px" }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(debt.id)} 
                          className="btn btn-danger btn-icon" 
                          title="Löschen"
                          style={{ padding: "0.3rem", borderRadius: "6px" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Settled Debts */}
            {showSettled && settledDebts.map((debt) => {
              const isCreditor = debt.creditorEmail.toLowerCase() === currentUser.email.toLowerCase();
              const isCreator = debt.creatorEmail && debt.creatorEmail.toLowerCase() === currentUser.email.toLowerCase();
              return (
                <div key={debt.id} className="debt-item" style={{ opacity: 0.6, borderStyle: "dashed" }}>
                  <div className="debt-item-info">
                    <div className="debt-item-icon" style={{ background: "rgba(255, 255, 255, 0.02)", color: "var(--text-muted)" }}>
                      ✓
                    </div>
                    <div className="debt-item-details">
                      <h4 style={{ textDecoration: "line-through", color: "var(--text-secondary)" }}>{debt.description}</h4>
                      <p style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Calendar size={12} /> {formatDate(debt.createdAt)}
                      </p>
                      <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                        Beglichen am {formatDate(debt.settledAt)}
                        {!isCreator && debt.creatorEmail && (
                          <span style={{ fontStyle: "italic", opacity: 0.8 }}>
                            {" "}(Eingetragen von {debt.creatorEmail.toLowerCase() === friend.email.toLowerCase() ? friend.name : debt.creatorName})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div className="debt-item-amount">
                      <div className="price" style={{ textDecoration: "line-through", color: "var(--text-secondary)" }}>
                        {debt.amount.toFixed(2)} €
                      </div>
                      <span className="badge badge-settled">Beglichen</span>
                    </div>

                    {isCreator && (
                      <div className="debt-item-actions">
                        <button 
                          onClick={() => handleDelete(debt.id)} 
                          className="btn btn-danger btn-icon" 
                          title="Löschen"
                          style={{ padding: "0.3rem", borderRadius: "6px" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
