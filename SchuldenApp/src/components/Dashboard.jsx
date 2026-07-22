import React from "react";
import { Plus, Users, Clock, ArrowRight, UserPlus, Sparkles, Check } from "lucide-react";

export default function Dashboard({ debts, currentUser, contacts = [], onSelectFriend, onAddDebt, onAddContact }) {
  
  // Aggregate friends and calculate balances
  const friendsMap = {};
  let totalOwed = 0; // What others owe me
  let totalOwes = 0; // What I owe others

  debts.forEach((debt) => {
    if (debt.status === "pending") {
      const isCreditor = debt.creditorEmail.toLowerCase() === currentUser.email.toLowerCase();
      const amount = debt.amount;

      if (isCreditor) {
        totalOwed += amount;
        
        const friendEmail = debt.debtorEmail.toLowerCase();
        if (!friendsMap[friendEmail]) {
          friendsMap[friendEmail] = {
            email: friendEmail,
            name: debt.debtorName,
            balance: 0,
            lastUpdated: debt.createdAt
          };
        }
        friendsMap[friendEmail].balance += amount;
        if (debt.createdAt > friendsMap[friendEmail].lastUpdated) {
          friendsMap[friendEmail].name = debt.debtorName;
          friendsMap[friendEmail].lastUpdated = debt.createdAt;
        }
      } else {
        totalOwes += amount;
        
        const friendEmail = debt.creditorEmail.toLowerCase();
        if (!friendsMap[friendEmail]) {
          friendsMap[friendEmail] = {
            email: friendEmail,
            name: debt.creditorName,
            balance: 0,
            lastUpdated: debt.createdAt
          };
        }
        friendsMap[friendEmail].balance -= amount;
        if (debt.createdAt > friendsMap[friendEmail].lastUpdated) {
          friendsMap[friendEmail].name = debt.creditorName;
          friendsMap[friendEmail].lastUpdated = debt.createdAt;
        }
      }
    }
  });

  const friendsList = Object.values(friendsMap).sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  const recentActivity = [...debts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // Map contacts to their current balance (if any)
  const contactsWithBalance = contacts.map((c) => {
    const activeFriend = friendsMap[c.email.toLowerCase()];
    return {
      ...c,
      balance: activeFriend ? activeFriend.balance : 0
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const getInitials = (name) => {
    return name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  };

  return (
    <div>
      {/* 3 Main Balance Cards */}
      <div className="balance-overview">
        <div className="glass-panel balance-card neutral">
          <span className="balance-title">Deine Gesamtbilanz</span>
          <div className={`balance-amount ${(totalOwed - totalOwes) > 0 ? "plus" : (totalOwed - totalOwes) < 0 ? "minus" : "neutral"}`}>
            {(totalOwed - totalOwes) >= 0 ? "+" : ""}{(totalOwed - totalOwes).toFixed(2)} €
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Netto-Differenz aller ausstehenden Posten
          </span>
        </div>

        <div className="glass-panel balance-card plus">
          <span className="balance-title">Dir wird geschuldet</span>
          <div className="balance-amount plus">
            +{totalOwed.toFixed(2)} €
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Geld, das du ausgelegt hast
          </span>
        </div>

        <div className="glass-panel balance-card minus">
          <span className="balance-title">Du schuldest</span>
          <div className="balance-amount minus">
            -{totalOwes.toFixed(2)} €
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Geld, das dir geliehen wurde
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        
        {/* Left Column: Active Friends & Balances */}
        <div>
          <div className="section-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={20} className="gradient-text" />
              <h3 className="section-title">Ausstehende Schulden</h3>
            </div>
            <button onClick={() => onAddDebt(null)} className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              <Plus size={16} /> Schuld eintragen
            </button>
          </div>

          {friendsList.length === 0 ? (
            <div className="empty-state" style={{ marginBottom: "2rem" }}>
              <div className="empty-state-icon">💸</div>
              <h3>Keine ausstehenden Schulden</h3>
              <p>Trage eine Schuld ein oder wähle einen Kontakt aus, um zu beginnen.</p>
            </div>
          ) : (
            <div className="friend-list" style={{ marginBottom: "2rem" }}>
              {friendsList.map((friend) => (
                <div 
                  key={friend.email} 
                  className="friend-item"
                  onClick={() => onSelectFriend(friend)}
                >
                  <div className="friend-info">
                    <div className="friend-avatar">
                      {getInitials(friend.name)}
                    </div>
                    <div>
                      <div className="friend-name">{friend.name}</div>
                      <div className="friend-email">{friend.email}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span 
                      className="friend-balance" 
                      style={{ color: friend.balance > 0 ? "var(--color-success)" : "var(--color-danger)" }}
                    >
                      {friend.balance > 0 ? "+" : ""}{friend.balance.toFixed(2)} €
                    </span>
                    <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Activity */}
          <div className="section-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={20} className="gradient-text" />
              <h3 className="section-title">Letzte Aktivitäten</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Noch keine Transaktionen vorhanden.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {recentActivity.map((debt) => {
                  const isCreditor = debt.creditorEmail.toLowerCase() === currentUser.email.toLowerCase();
                  const partnerName = isCreditor ? debt.debtorName : debt.creditorName;
                  
                  return (
                    <div key={debt.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", lastChild: { borderBottom: "none" } }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: "0.9rem", color: "white" }}>
                          {debt.description}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>
                          {isCreditor ? `Du hast für ${partnerName} bezahlt` : `${partnerName} hat für dich bezahlt`}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: isCreditor ? "var(--color-success)" : "var(--color-danger)" }}>
                          {isCreditor ? "+" : "-"}{debt.amount.toFixed(2)} €
                        </div>
                        <div style={{ marginTop: "0.2rem" }}>
                          {debt.status === "settled" ? (
                            <span className="badge badge-settled" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                              <Check size={10} style={{ marginRight: "2px" }} /> Beglichen
                            </span>
                          ) : (
                            <span className="badge badge-pending" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                              Ausstehend
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact List */}
        <div>
          <div className="section-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <UserPlus size={20} className="gradient-text" />
              <h3 className="section-title">Kontakte</h3>
            </div>
            <button onClick={onAddContact} className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              <Plus size={14} /> Neu
            </button>
          </div>

          {contactsWithBalance.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📇</div>
              <h3>Keine Kontakte</h3>
              <p>Füge Kontakte hinzu, um Schulden schneller einzutragen.</p>
              <button 
                onClick={onAddContact} 
                className="btn btn-secondary" 
                style={{ marginTop: "1rem" }}
              >
                Kontakt hinzufügen
              </button>
            </div>
          ) : (
            <div className="friend-list">
              {contactsWithBalance.map((contact) => (
                <div 
                  key={contact.id} 
                  className="friend-item"
                  onClick={() => onSelectFriend({ email: contact.email, name: contact.name })}
                  style={{ background: "rgba(255, 255, 255, 0.02)" }}
                >
                  <div className="friend-info">
                    <div className="friend-avatar" style={{ background: "linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)" }}>
                      {getInitials(contact.name)}
                    </div>
                    <div>
                      <div className="friend-name">{contact.name}</div>
                      <div className="friend-email">{contact.email}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {contact.balance !== 0 && (
                      <span 
                        className="friend-balance" 
                        style={{ color: contact.balance > 0 ? "var(--color-success)" : "var(--color-danger)", fontSize: "0.85rem", marginRight: "0.5rem" }}
                      >
                        {contact.balance > 0 ? "+" : ""}{contact.balance.toFixed(2)} €
                      </span>
                    )}
                    <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
