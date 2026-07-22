import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

export default function ContactModal({ isOpen, onClose, currentUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("Bitte gib einen Namen ein.");
      setLoading(false);
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein.");
      setLoading(false);
      return;
    }

    if (email.toLowerCase() === currentUser.email.toLowerCase()) {
      setError("Du kannst dich nicht selbst als Kontakt hinzufügen.");
      setLoading(false);
      return;
    }

    try {
      // Add contact to the subcollection: users/{uid}/contacts
      const contactsRef = collection(db, "users", currentUser.uid, "contacts");
      await addDoc(contactsRef, {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        ownerUid: currentUser.uid,
        ownerEmail: currentUser.email.toLowerCase(),
        ownerName: currentUser.displayName || "Ich",
        createdAt: new Date().toISOString()
      });

      // Clear fields and close
      setName("");
      setEmail("");
      onClose();
    } catch (err) {
      console.error(err);
      setError("Fehler beim Speichern des Kontakts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: "2rem" }}>
        
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3>Kontakt hinzufügen</h3>
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
          
          {/* Contact Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="contactName">Name</label>
            <input
              id="contactName"
              type="text"
              className="input-field"
              placeholder="z. B. Sarah Meier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          {/* Contact Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="contactEmail">E-Mail-Adresse</label>
            <input
              id="contactEmail"
              type="email"
              className="input-field"
              placeholder="z. B. sarah@mail.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Wird gespeichert..." : "Speichern"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
