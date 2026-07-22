import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, or, onSnapshot, collectionGroup, addDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import Auth from "./components/Auth";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import FriendDetail from "./components/FriendDetail";
import DebtModal from "./components/DebtModal";
import ContactModal from "./components/ContactModal";
import EmailVerification from "./components/EmailVerification";

export default function App() {
  const [user, setUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [debts, setDebts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [preselectedFriend, setPreselectedFriend] = useState(null);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setEmailVerified(currentUser ? currentUser.emailVerified : false);
      setAuthLoading(false);
      if (!currentUser) {
        setDebts([]);
        setContacts([]);
        setSelectedFriend(null);
      }
    });
    return unsubscribe;
  }, []);

  // Firestore Realtime listener for debts
  useEffect(() => {
    if (!user) return;

    const email = user.email.toLowerCase();

    const q = query(
      collection(db, "debts"),
      or(
        where("creditorEmail", "==", email),
        where("debtorEmail", "==", email)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const debtsData = [];
      snapshot.forEach((doc) => {
        debtsData.push({ id: doc.id, ...doc.data() });
      });
      setDebts(debtsData);

      if (selectedFriend) {
        const updatedFriendDebts = debtsData.filter((d) => {
          const isCreditor = d.creditorEmail.toLowerCase() === email;
          const isDebtor = d.debtorEmail.toLowerCase() === email;
          const isFriendCreditor = d.creditorEmail.toLowerCase() === selectedFriend.email.toLowerCase();
          const isFriendDebtor = d.debtorEmail.toLowerCase() === selectedFriend.email.toLowerCase();
          return (isCreditor && isFriendDebtor) || (isDebtor && isFriendCreditor);
        });

        if (updatedFriendDebts.length > 0) {
          const latestDebt = updatedFriendDebts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
          const latestName = latestDebt.creditorEmail.toLowerCase() === selectedFriend.email.toLowerCase()
            ? latestDebt.creditorName
            : latestDebt.debtorName;
          
          setSelectedFriend(prev => ({
            ...prev,
            name: latestName
          }));
        }
      }
    }, (error) => {
      console.error("Firestore sync error:", error);
    });

    return unsubscribe;
  }, [user, selectedFriend?.email]);

  // Firestore Realtime listener for contacts
  useEffect(() => {
    if (!user) return;

    const contactsRef = collection(db, "users", user.uid, "contacts");
    
    const unsubscribe = onSnapshot(contactsRef, (snapshot) => {
      const contactsData = [];
      snapshot.forEach((doc) => {
        contactsData.push({ id: doc.id, ...doc.data() });
      });
      setContacts(contactsData);
      setContactsLoading(false);
    }, (error) => {
      console.error("Contacts sync error:", error);
      setContactsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Auto-add missing contacts from other users and transaction history
  useEffect(() => {
    if (!user || contactsLoading) return;

    const myEmail = user.email.toLowerCase();
    const myName = user.displayName || "Ich";

    // Helper to check if contact exists
    const contactExists = (email) => contacts.some(c => c.email.toLowerCase() === email.toLowerCase());

    // 1. Auto-add from debts history
    debts.forEach(async (debt) => {
      const isCreditor = debt.creditorEmail.toLowerCase() === myEmail;
      const partnerEmail = isCreditor ? debt.debtorEmail : debt.creditorEmail;
      const partnerName = isCreditor ? debt.debtorName : debt.creditorName;

      if (partnerEmail && partnerName && !contactExists(partnerEmail)) {
        try {
          const contactsRef = collection(db, "users", user.uid, "contacts");
          await addDoc(contactsRef, {
            name: partnerName,
            email: partnerEmail.toLowerCase(),
            ownerUid: user.uid,
            ownerEmail: myEmail,
            ownerName: myName,
            createdAt: new Date().toISOString()
          });
        } catch (e) {
          console.error("Auto-adding contact from debt failed:", e);
        }
      }
    });

    // 2. Auto-add from collection group (if another user added us as a contact)
    const q = query(
      collectionGroup(db, "contacts"),
      where("email", "==", myEmail)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach(async (docSnap) => {
        const data = docSnap.data();
        const ownerEmail = data.ownerEmail?.toLowerCase();
        const ownerName = data.ownerName;

        if (ownerEmail && ownerName && !contactExists(ownerEmail)) {
          try {
            const contactsRef = collection(db, "users", user.uid, "contacts");
            await addDoc(contactsRef, {
              name: ownerName,
              email: ownerEmail,
              ownerUid: user.uid,
              ownerEmail: myEmail,
              ownerName: myName,
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.error("Auto-adding contact from incoming contact failed:", e);
          }
        }
      });
    }, (error) => {
      console.error("Collection group contacts listener error:", error);
    });

    return unsubscribe;
  }, [user, contacts, contactsLoading, debts]);

  if (authLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
        <div className="gradient-text" style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
          Lade SchuldenApp...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!emailVerified) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
        <EmailVerification onVerified={() => setEmailVerified(true)} />
      </div>
    );
  }

  // Calculate totals
  let totalOwed = 0;
  let totalOwes = 0;
  debts.forEach((debt) => {
    if (debt.status === "pending") {
      const isCreditor = debt.creditorEmail.toLowerCase() === user.email.toLowerCase();
      if (isCreditor) {
        totalOwed += debt.amount;
      } else {
        totalOwes += debt.amount;
      }
    }
  });

  const handleOpenAddModal = (friend = null) => {
    setEditingDebt(null);
    setPreselectedFriend(friend);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (debt) => {
    setEditingDebt(debt);
    setPreselectedFriend(null);
    setIsModalOpen(true);
  };

  return (
    <div className="app-container">
      <Navbar 
        currentUser={user} 
        totalOwed={totalOwed} 
        totalOwes={totalOwes} 
      />

      <main className="main-content">
        {selectedFriend ? (
          <FriendDetail 
            friend={selectedFriend}
            debts={debts}
            currentUser={user}
            onBack={() => setSelectedFriend(null)}
            onAddDebt={() => handleOpenAddModal(selectedFriend)}
            onEditDebt={handleOpenEditModal}
          />
        ) : (
          <Dashboard 
            debts={debts}
            currentUser={user}
            contacts={contacts}
            onSelectFriend={setSelectedFriend}
            onAddDebt={() => handleOpenAddModal(null)}
            onAddContact={() => setIsContactModalOpen(true)}
          />
        )}
      </main>

      <DebtModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={user}
        contacts={contacts}
        editingDebt={editingDebt}
        preselectedFriend={preselectedFriend}
      />

      <ContactModal 
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        currentUser={user}
      />
    </div>
  );
}
