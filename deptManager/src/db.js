import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  getDocs, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

// SDK configuration for Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyBzFpmbTWAygLS4jdTgdil_jFBgDevrBcU",
  authDomain: "bozen-2026.firebaseapp.com",
  projectId: "bozen-2026",
  storageBucket: "bozen-2026.firebasestorage.app",
  messagingSenderId: "1029525328732",
  appId: "1:1029525328732:web:d6c7c51dd56bc73fd9a799"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// In-Memory cache for synchronous component state read calls
let cacheUsers = {};
let cacheTransactions = [];
const subscribers = new Set();

const notifySubscribers = () => {
  subscribers.forEach(cb => cb());
};

// Listeners unsubscribe references
let usersUnsubscribe = null;
let debtsUnsubscribe = null;

// Track Auth State and attach/detach Firestore listeners dynamically
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is logged in, start sync listeners
    if (!usersUnsubscribe) {
      usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const newUsers = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          newUsers[data.username] = { id: doc.id, ...data };
        });
        cacheUsers = newUsers;
        notifySubscribers();
      });
    }

    if (!debtsUnsubscribe) {
      debtsUnsubscribe = onSnapshot(collection(db, 'debts'), (snapshot) => {
        const newTxs = [];
        snapshot.forEach(doc => {
          newTxs.push({ id: doc.id, ...doc.data() });
        });
        // Sort by timestamp ascending
        cacheTransactions = newTxs.sort((a, b) => a.timestamp - b.timestamp);
        notifySubscribers();
      });
    }
  } else {
    // User is logged out, stop sync and clear cache
    if (usersUnsubscribe) {
      usersUnsubscribe();
      usersUnsubscribe = null;
    }
    if (debtsUnsubscribe) {
      debtsUnsubscribe();
      debtsUnsubscribe = null;
    }
    cacheUsers = {};
    cacheTransactions = [];
    notifySubscribers();
  }
});

// --- Database Getters (Read synchronously from cache) ---

export const getUsers = () => {
  return cacheUsers;
};

export const getFriendsForUser = (userId) => {
  const users = getUsers();
  const currentUserObj = Object.values(users).find(usr => usr.id === userId);
  if (!currentUserObj || !currentUserObj.friends) return [];
  return currentUserObj.friends
    .map(fUsername => users[fUsername])
    .filter(Boolean);
};

export const getTransactionHistory = (currentUserId, friendId) => {
  const cId = currentUserId.toLowerCase().trim();
  const fId = friendId.toLowerCase().trim();
  return cacheTransactions.filter(tx => 
    (tx.lenderId === cId && tx.borrowerId === fId) || 
    (tx.lenderId === fId && tx.borrowerId === cId)
  );
};

export const getBalanceBetween = (currentUserId, friendId) => {
  const cId = currentUserId.toLowerCase().trim();
  const fId = friendId.toLowerCase().trim();

  // Sum only confirmed transactions
  const confirmedTx = cacheTransactions.filter(tx => tx.status === 'confirmed');

  const lentSum = confirmedTx
    .filter(tx => tx.lenderId === cId && tx.borrowerId === fId)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const borrowedSum = confirmedTx
    .filter(tx => tx.lenderId === fId && tx.borrowerId === cId)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = lentSum - borrowedSum;
  if (balance > 0) return { amount: balance, status: 'credit' };
  if (balance < 0) return { amount: Math.abs(balance), status: 'debt' };
  return { amount: 0, status: 'balanced' };
};

// --- Database Mutators (Write asynchronously to Firestore) ---

export const checkUsernameUnique = async (username) => {
  const normalizedUsername = username.toLowerCase().trim();
  const q = query(collection(db, 'users'), where('username', '==', normalizedUsername));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

export const createUserProfile = async (uid, username, name, email = null, phoneNumber = null) => {
  const normalizedUsername = username.toLowerCase().trim();
  
  // Verify username is unique
  const isUnique = await checkUsernameUnique(normalizedUsername);
  if (!isUnique) {
    throw new Error('Dieser Benutzername ist bereits vergeben.');
  }

  const defaultFriends = normalizedUsername === 'alice' ? ['bob', 'charlie', 'diana']
                       : normalizedUsername === 'bob' ? ['alice', 'charlie']
                       : normalizedUsername === 'charlie' ? ['alice', 'bob']
                       : normalizedUsername === 'diana' ? ['alice']
                       : [];

  const profile = {
    username: normalizedUsername,
    name: name.trim() || normalizedUsername,
    email: email ? email.toLowerCase().trim() : null,
    phoneNumber: phoneNumber || null,
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${normalizedUsername}`,
    friends: defaultFriends
  };

  await setDoc(doc(db, 'users', uid), profile);

  // Seed default transactions if debts collection is empty
  try {
    const debtsCollection = collection(db, 'debts');
    const debtsSnapshot = await getDocs(debtsCollection);
    if (debtsSnapshot.empty) {
      const mockTxs = [
        { lenderId: 'alice', borrowerId: 'bob', amount: 15.00, description: 'Pizza 🍕', status: 'confirmed', createdBy: 'alice', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80', timestamp: Date.now() - 3600000 * 5 },
        { lenderId: 'bob', borrowerId: 'alice', amount: 5.00, description: 'Kaffee ☕', status: 'confirmed', createdBy: 'bob', imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80', timestamp: Date.now() - 3600000 * 4 },
        { lenderId: 'charlie', borrowerId: 'alice', amount: 20.00, description: 'Kino-Ticket 🍿', status: 'confirmed', createdBy: 'charlie', imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&auto=format&fit=crop&q=80', timestamp: Date.now() - 3600000 * 3 },
        { lenderId: 'alice', borrowerId: 'diana', amount: 12.50, description: 'Snacks 🍿', status: 'confirmed', createdBy: 'alice', timestamp: Date.now() - 3600000 * 2 }
      ];
      for (const tx of mockTxs) {
        await addDoc(debtsCollection, tx);
      }
    }
  } catch (seedErr) {
    console.warn('Seeding transactions failed:', seedErr);
  }

  return { id: uid, ...profile };
};

export const registerUserInFirebase = async (email, password, username, name) => {
  const normalizedUsername = username.toLowerCase().trim();
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if the username is unique
  const isUnique = await checkUsernameUnique(normalizedUsername);
  if (!isUnique) {
    throw new Error('Dieser Benutzername ist bereits vergeben.');
  }

  // 2. Create the user in Firebase Auth
  let user;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    user = userCredential.user;
  } catch (err) {
    throw new Error('Registrierung fehlgeschlagen: ' + err.message);
  }

  // 3. Create profile
  return await createUserProfile(user.uid, normalizedUsername, name, normalizedEmail, null);
};

export const loginUserInFirebase = async (loginIdentifier, password) => {
  let email = loginIdentifier.toLowerCase().trim();

  // If it's a username (doesn't contain '@'), look up their email in Firestore
  if (!email.includes('@')) {
    const q = query(collection(db, 'users'), where('username', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('Benutzername nicht gefunden.');
    }
    const userDoc = querySnapshot.docs[0];
    email = userDoc.data().email || `${userDoc.data().username}@bozen.com`;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return { id: user.uid, ...userDoc.data() };
    }
    throw new Error('Benutzerprofil nicht in Firestore gefunden.');
  } catch (err) {
    throw new Error('Anmeldung fehlgeschlagen: ' + err.message);
  }
};

export const loginOrCreateUser = async (username, password, name = '') => {
  try {
    return await loginUserInFirebase(username, password);
  } catch (err) {
    return await registerUserInFirebase(`${username.toLowerCase()}@bozen.com`, password, username, name);
  }
};

export const addFriend = async (userId, friendUsername) => {
  const targetName = friendUsername.toLowerCase().trim();
  const users = getUsers();
  const friend = Object.values(users).find(usr => usr.username === targetName);
  if (!friend) {
    throw new Error(`Benutzer @${friendUsername} existiert nicht.`);
  }

  const currentUserObj = Object.values(users).find(usr => usr.id === userId);
  if (!currentUserObj) {
    throw new Error('Aktueller Benutzer nicht gefunden.');
  }

  if (currentUserObj.friends.includes(targetName)) {
    throw new Error(`@${friendUsername} ist bereits in deiner Freundesliste.`);
  }

  // Update current user's friends list
  const updatedFriendsSelf = [...currentUserObj.friends, targetName];
  await updateDoc(doc(db, 'users', userId), { friends: updatedFriendsSelf });

  // Update friend's friends list to make it mutual
  if (!friend.friends.includes(currentUserObj.username)) {
    const updatedFriendsFriend = [...friend.friends, currentUserObj.username];
    await updateDoc(doc(db, 'users', friend.id), { friends: updatedFriendsFriend });
  }
};

export const addTransaction = async (lenderId, borrowerId, amount, description, imageUrl = null, status = 'pending', createdBy = null) => {
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Bitte gib einen gültigen Betrag ein.');
  }

  const newTx = {
    lenderId: lenderId.toLowerCase().trim(),
    borrowerId: borrowerId.toLowerCase().trim(),
    amount: parseFloat(amount),
    description: description.trim() || 'Unbekannt',
    imageUrl: imageUrl,
    status: status,
    createdBy: createdBy || lenderId,
    timestamp: Date.now()
  };

  await addDoc(collection(db, 'debts'), newTx);
};

export const confirmTransaction = async (txId) => {
  await updateDoc(doc(db, 'debts', txId), { status: 'confirmed' });
};

export const rejectTransaction = async (txId) => {
  await updateDoc(doc(db, 'debts', txId), { status: 'rejected' });
};

export const updateUserProfile = async (userId, updates) => {
  if (!userId) throw new Error('Benutzer-ID fehlt.');
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
};


export const getPendingConfirmations = (userId) => {
  if (!userId) return [];
  const myUid = userId.toLowerCase().trim();

  return cacheTransactions.filter(tx => {
    if (tx.status !== 'pending') return false;
    
    // UIDs might be stored as mixed-case or lowercase, so we normalize for comparison
    const creator = (tx.createdBy || '').toLowerCase().trim();
    const lender = (tx.lenderId || '').toLowerCase().trim();
    const borrower = (tx.borrowerId || '').toLowerCase().trim();
    
    const validator = creator === lender ? borrower : lender;
    return validator === myUid;
  });
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const subscribeToDB = (callback) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

export const resetDatabase = () => {
  console.warn('resetDatabase called. Resetting database is disabled in Firebase production mode.');
};
