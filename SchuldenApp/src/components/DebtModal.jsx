import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function DebtModal({ isOpen, onClose, currentUser, contacts = [], editingDebt = null, preselectedFriend = null }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [friendName, setFriendName] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [type, setType] = useState("lent"); // 'lent' = I paid, 'borrowed' = friend paid
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingDebt) {
      setDescription(editingDebt.description || "");
      setAmount(editingDebt.amount?.toString() || "");
      
      let email = "";
      let name = "";
      if (editingDebt.creditorEmail === currentUser.email) {
        setType("lent");
        email = editingDebt.debtorEmail || "";
        name = editingDebt.debtorName || "";
      } else {
        setType("borrowed");
        email = editingDebt.creditorEmail || "";
        name = editingDebt.creditorName || "";
      }
      setFriendEmail(email);
      setFriendName(name);

      // Try to find if this friend matches any saved contact
      const matchingContact = contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
      setSelectedContactId(matchingContact ? matchingContact.id : "");
    } else {
      setDescription("");
      setAmount("");
      setType("lent");
      
      if (preselectedFriend) {
        setFriendEmail(preselectedFriend.email || "");
        setFriendName(preselectedFriend.name || "");
        
        const matchingContact = contacts.find(c => c.email.toLowerCase() === preselectedFriend.email.toLowerCase());
        setSelectedContactId(matchingContact ? matchingContact.id : "");
      } else {
        setFriendEmail("");
        setFriendName("");
        setSelectedContactId("");
      }
    }
    setError("");
  }, [editingDebt, preselectedFriend, isOpen, contacts]);

  if (!isOpen) return null;

  const handleContactChange = (contactId) => {
    setSelectedContactId(contactId);
    if (contactId) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setFriendName(contact.name);
        setFriendEmail(contact.email);
      }
    } else {
      setFriendName("");
      setFriendEmail("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Bitte gib einen gültigen Betrag ein (z. B. 12.50).");
      setLoading(false);
      return;
    }

    if (!friendEmail.trim() || !friendEmail.includes("@")) {
      setError("Bitte gib eine gültige E-Mail-Adresse des Freundes ein.");
      setLoading(false);
      return;
    }

    if (!friendName.trim()) {
      setError("Bitte gib den Namen des Freundes ein.");
      setLoading(false);
      return;
    }

    if (friendEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      setError("Du kannst keine Schulden mit dir selbst eintragen.");
      setLoading(false);
      return;
    }

    try {
      const creditorEmail = type === "lent" ? currentUser.email.toLowerCase() : friendEmail.toLowerCase();
      const creditorName = type === "lent" ? (currentUser.displayName || "Ich") : friendName;
      
      const debtorEmail = type === "lent" ? friendEmail.toLowerCase() : currentUser.email.toLowerCase();
      const debtorName = type === "lent" ? friendName : (currentUser.displayName || "Ich");

      const debtData = {
        description: description.trim(),
        amount: parsedAmount,
        creditorEmail,
        creditorName,
        debtorEmail,
        debtorName,
        status: "pending",
        updatedAt: new Date().toISOString()
      };

      if (editingDebt) {
        const docRef = doc(db, "debts", editingDebt.id);
        await updateDoc(docRef, debtData);
      } else {
        const newDebt = {
          ...debtData,
          createdBy: currentUser.uid,
          creatorEmail: currentUser.email.toLowerCase(),
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, "debts"), newDebt);
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError("Fehler beim Speichern. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: "2rem" }}>
        
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3>{editingDebt ? "Schuld anpassen" : "Neue Schuld eintragen"}</h3>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ borderRadius: "50%" }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.75rem 1rem", background: "var(--color-danger-bg)", borderColor: "rgba(239, 68, 68, 0.2)", border: "1px solid", borderRadius: "var(--radius-md)", marginBottom: "1.25rem", color: "#f87171", fontSize: "0.85rem" }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Lent or Borrowed Segment Control */}
          <div className="form-group">
            <label className="form-label">Wer hat bezahlt?</label>
            <div className="radio-group">
              <div 
                className={`radio-card ${type === "lent" ? "active" : ""}`}
                onClick={() => setType("lent")}
              >
                Ich habe bezahlt
              </div>
              <div 
                className={`radio-card ${type === "borrowed" ? "active" : ""}`}
                onClick={() => setType("borrowed")}
              >
                Freund hat bezahlt
              </div>
            </div>
          </div>

          {/* Contact Dropdown Selector */}
          {!editingDebt && !preselectedFriend && contacts.length > 0 && (
            <div className="form-group">
              <label className="form-label" htmlFor="contactSelect">Aus Kontakten wählen</label>
              <select
                id="contactSelect"
                className="input-field"
                value={selectedContactId}
                onChange={(e) => handleContactChange(e.target.value)}
                style={{ appearance: "none", backgroundPosition: "right 1rem center", backgroundRepeat: "no-repeat" }}
              >
                <option value="">-- Manueller Eintrag --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Friend Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="friendName">Name des Freundes</label>
              <input
                id="friendName"
                type="text"
                className="input-field"
                placeholder="Sarah"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                disabled={!!editingDebt || !!preselectedFriend || !!selectedContactId}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="friendEmail">E-Mail des Freundes</label>
              <input
                id="friendEmail"
                type="email"
                className="input-field"
                placeholder="sarah@mail.de"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                disabled={!!editingDebt || !!preselectedFriend || !!selectedContactId}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">Wofür? (Beschreibung)</label>
            <input
              id="description"
              type="text"
              className="input-field"
              placeholder="z. B. Pizza, Taxifahrt, Kino"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label" htmlFor="amount">Betrag (€)</label>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              className="input-field"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Wird gespeichert..." : editingDebt ? "Speichern" : "Eintragen"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
