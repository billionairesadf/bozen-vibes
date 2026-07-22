import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendEmailVerification
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
  where,
  deleteDoc
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
let cacheFriendRequests = [];
const subscribers = new Set();

const notifySubscribers = () => {
  subscribers.forEach(cb => cb());
};

// Listeners unsubscribe references
let usersUnsubscribe = null;
let debtsUnsubscribe = null;
let friendRequestsUnsubscribe = null;

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

    if (!friendRequestsUnsubscribe) {
      friendRequestsUnsubscribe = onSnapshot(collection(db, 'friendRequests'), (snapshot) => {
        const reqs = [];
        snapshot.forEach(doc => {
          reqs.push({ id: doc.id, ...doc.data() });
        });
        cacheFriendRequests = reqs;
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
    if (friendRequestsUnsubscribe) {
      friendRequestsUnsubscribe();
      friendRequestsUnsubscribe = null;
    }
    cacheUsers = {};
    cacheTransactions = [];
    cacheFriendRequests = [];
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

export const getAllTransactionsForUser = (userId) => {
  if (!userId) return [];
  const myUid = userId.toLowerCase().trim();
  return cacheTransactions
    .filter(tx => tx.lenderId === myUid || tx.borrowerId === myUid)
    .sort((a, b) => b.timestamp - a.timestamp);
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
    
    // Send email verification immediately
    try {
      await sendEmailVerification(user);
    } catch (emailErr) {
      console.error('Verifizierungs-E-Mail konnte nicht gesendet werden:', emailErr);
    }
  } catch (err) {
    throw new Error('Registrierung fehlgeschlagen: ' + err.message);
  }

  // 3. Create profile
  return await createUserProfile(user.uid, normalizedUsername, name, normalizedEmail, null);
};

export const loginUserInFirebase = async (loginIdentifier, password) => {
  const identifier = loginIdentifier.toLowerCase().trim();
  let email = identifier;

  // 1. Try to find the user in Firestore by username first
  let q = query(collection(db, 'users'), where('username', '==', identifier));
  let querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    // 2. If not found by username, try to find by email
    q = query(collection(db, 'users'), where('email', '==', identifier));
    querySnapshot = await getDocs(q);
  }

  // 3. If found in Firestore, extract the email
  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    email = userDoc.data().email || `${userDoc.data().username}@bozen.com`;
  } else {
    // If not found in Firestore at all, we still check if they entered a username format without '@'
    if (!identifier.includes('@')) {
      throw new Error('Benutzername nicht gefunden.');
    }
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

export const sendFriendRequest = async (userId, targetUsernameOrEmail) => {
  const target = targetUsernameOrEmail.toLowerCase().trim();
  if (!target) {
    throw new Error('Eingabe darf nicht leer sein.');
  }

  const users = getUsers();
  // Find recipient user profile by username or email
  const friend = Object.values(users).find(usr => 
    usr.username === target || (usr.email && usr.email.toLowerCase().trim() === target)
  );

  if (!friend) {
    throw new Error(`Benutzer '${targetUsernameOrEmail}' wurde nicht gefunden.`);
  }

  const currentUserObj = Object.values(users).find(usr => usr.id === userId);
  if (!currentUserObj) {
    throw new Error('Aktueller Benutzer nicht gefunden.');
  }

  if (friend.id === userId) {
    throw new Error('Du kannst dir nicht selbst eine Freundschaftsanfrage senden.');
  }

  // Check if already friends
  if (currentUserObj.friends && currentUserObj.friends.includes(friend.username)) {
    throw new Error(`@${friend.username} ist bereits in deiner Freundesliste.`);
  }

  // Check if there is already an existing pending request
  const existingRequest = cacheFriendRequests.find(req => 
    (req.from === currentUserObj.username && req.to === friend.username && req.status === 'pending') ||
    (req.from === friend.username && req.to === currentUserObj.username && req.status === 'pending')
  );

  if (existingRequest) {
    if (existingRequest.from === currentUserObj.username) {
      throw new Error(`Ausstehende Anfrage an @${friend.username} bereits vorhanden.`);
    } else {
      throw new Error(`@${friend.username} hat dir bereits eine Anfrage gesendet. Bitte nimm sie an.`);
    }
  }

  // Create friend request doc
  const requestDoc = {
    from: currentUserObj.username,
    to: friend.username,
    status: 'pending',
    timestamp: Date.now()
  };

  await addDoc(collection(db, 'friendRequests'), requestDoc);
};

export const acceptFriendRequest = async (requestId) => {
  const req = cacheFriendRequests.find(r => r.id === requestId);
  if (!req) {
    throw new Error('Freundschaftsanfrage nicht gefunden.');
  }

  const users = getUsers();
  const fromUser = Object.values(users).find(u => u.username === req.from);
  const toUser = Object.values(users).find(u => u.username === req.to);

  if (!fromUser || !toUser) {
    throw new Error('Benutzerprofile für diese Anfrage konnten nicht gefunden werden.');
  }

  // 1. Update friends list for both users (mutual friendship)
  const updatedFriendsFrom = [...(fromUser.friends || []), toUser.username];
  const updatedFriendsTo = [...(toUser.friends || []), fromUser.username];

  await updateDoc(doc(db, 'users', fromUser.id), { friends: updatedFriendsFrom });
  await updateDoc(doc(db, 'users', toUser.id), { friends: updatedFriendsTo });

  // 2. Delete the request document to clean up
  await deleteDoc(doc(db, 'friendRequests', requestId));
};

export const rejectFriendRequest = async (requestId) => {
  await deleteDoc(doc(db, 'friendRequests', requestId));
};

export const getFriendRequests = () => {
  return cacheFriendRequests;
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
