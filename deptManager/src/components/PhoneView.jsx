import React, { useState, useEffect, useReducer, useRef } from 'react';
import { 
  ArrowLeft, Plus, Minus, LogOut, Search, UserPlus, 
  Clock, ArrowRightLeft, Send, Check, Lock, User, 
  X, ChevronRight, Landmark, ArrowUpRight, ArrowDownLeft,
  Home, MessageCircle, UserCircle, Settings
} from 'lucide-react';
import { 
  auth, loginOrCreateUser, addFriend, getFriendsForUser, 
  getBalanceBetween, getTransactionHistory, addTransaction, 
  subscribeToDB, getUsers, confirmTransaction, rejectTransaction, logoutUser,
  registerUserInFirebase, loginUserInFirebase, checkUsernameUnique, createUserProfile,
  getPendingConfirmations, updateUserProfile
} from '../db';
import { RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged } from 'firebase/auth';
// Google AdSense Global Configuration
const GOOGLE_ADSENSE_PUBLISHER_ID = 'ca-pub-6041979504682770'; // Deine Google AdSense Publisher-ID
const GOOGLE_ADSENSE_SLOT_ID = '1234567890'; // Ersetze dies mit deiner echten Slot-ID aus deinem AdSense-Dashboard


// Simple currency formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
    .format(amount)
    .replace(/\u00a0/g, ' ');
};

// Formats balance string with "+" or "-" prefix
const formatBalance = (amount, status) => {
  const formatted = formatCurrency(amount);
  if (status === 'credit') return `+${formatted}`;
  if (status === 'debt') return `-${formatted}`;
  return formatted;
};

// Returns a relevant image URL based on keywords in the description
const getPhotoByDescription = (desc) => {
  const lower = desc.toLowerCase();
  if (lower.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80';
  if (lower.includes('kaffee') || lower.includes('coffee') || lower.includes('caf') || lower.includes('cappuccino')) return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80';
  if (lower.includes('kino') || lower.includes('cinema') || lower.includes('film') || lower.includes('ticket') || lower.includes('popcorn')) return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&auto=format&fit=crop&q=80';
  if (lower.includes('taxi') || lower.includes('uber') || lower.includes('fahrt') || lower.includes('auto')) return 'https://images.unsplash.com/photo-1492664738948-2ec93a5c0942?w=400&auto=format&fit=crop&q=80';
  if (lower.includes('bier') || lower.includes('beer') || lower.includes('drink') || lower.includes('bar') || lower.includes('cocktail') || lower.includes('club') || lower.includes('wein') || lower.includes('party') || lower.includes('alkohol')) return 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&auto=format&fit=crop&q=80';
  // Default receipt image mockup
  return 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=80';
};

// Helper to resize/crop an uploaded image file client-side to a square 150x150 JPEG
const resizeImage = (file, size = 150) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Calculate crop coordinates for center square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        
        // Compress as JPEG (0.85 quality)
        const base64Url = canvas.toDataURL('image/jpeg', 0.85);
        resolve(base64Url);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Global Google AdSense Banner Component
function GoogleAdBanner({ type = 'dashboard', publisherId, slotId }) {
  const isDemo = !publisherId || !slotId || slotId === '1234567890';

  useEffect(() => {
    if (!isDemo) {
      // Load AdSense script dynamically if not already loaded
      if (!window.adsbygoogleScriptLoaded) {
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
        window.adsbygoogleScriptLoaded = true;
      }
      
      // Initialize ad unit
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('AdSense initialization deferred:', e);
      }
    }
  }, [publisherId, slotId, isDemo]);

  if (isDemo) {
    return (
      <div className={`simulated-ad-banner ${type}`}>
        <div className="ad-badge">Anzeige</div>
        <div className="ad-content">
          <div className="ad-icon">💎</div>
          <div className="ad-text-group">
            <div className="ad-title">Werbefreiheit freischalten?</div>
            <div className="ad-desc">Befreie deine App komplett von Werbung und nutze exklusive DeptManager Pro Features.</div>
          </div>
          <button className="btn-ad-action" onClick={() => alert('Vielen Dank! Premium-Upgrade ist in dieser Demo kostenlos.')}>Pro holen</button>
        </div>
        <div className="ad-dev-note" style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.25)', marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.4rem', width: '100%', textAlign: 'center' }}>
          Entwickler-Hinweis: Um echte Werbung zu schalten, trage deine Slot-ID im Code ein.
        </div>
      </div>
    );
  }

  return (
    <div className={`google-ad-container ${type}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', width: '100%' }}>
      <div style={{ alignSelf: 'flex-start', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Werbung</div>
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%', minHeight: '90px' }}
           data-ad-client={publisherId}
           data-ad-slot={slotId}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}

export default function PhoneView({ defaultUser, phoneName }) {
  // Database synchronization reducer
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // States
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('auth'); // 'auth' | 'dashboard' | 'chat'
  const [selectedFriend, setSelectedFriend] = useState(null);
  
  // Auth Form
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'email'
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Phone Auth specific states
  const [authPhone, setAuthPhone] = useState('');
  const [authSMSCode, setAuthSMSCode] = useState('');
  const [phoneStep, setPhoneStep] = useState('phone'); // 'phone' | 'verify' | 'profile'
  const [phoneConfirmation, setPhoneConfirmation] = useState(null);
  const [phoneUid, setPhoneUid] = useState('');

  // Dashboard Form
  const [friendSearch, setFriendSearch] = useState('');
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [friendError, setFriendError] = useState('');
  const [friendSuccess, setFriendSuccess] = useState(false);

  // Bottom Sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState('lend'); // 'lend' | 'settle'
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txError, setTxError] = useState('');

  // Split Expense
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);
  const [splitAmount, setSplitAmount] = useState('');
  const [splitDescription, setSplitDescription] = useState('');
  const [splitFriends, setSplitFriends] = useState([]);
  const [splitIncludeSelf, setSplitIncludeSelf] = useState(true);
  const [splitError, setSplitError] = useState('');

  // Nudges, Stats, Camera Mock and Lightbox
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTimeout, setToastTimeout] = useState(null);
  const [statsExpanded, setStatsExpanded] = useState(true); // Default stats open to display nicely
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFlash, setCameraFlash] = useState(false);
  const [cameraProcessing, setCameraProcessing] = useState(false);
  const [attachedImage, setAttachedImage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  // Settings Form States
  const [settingsName, setSettingsName] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsAvatar, setSettingsAvatar] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const fileInputRef = useRef(null);
  const [authInitialized, setAuthInitialized] = useState(false);


  // Auto-login if defaultUser is provided (runs on cache loaded from Firestore)
  useEffect(() => {
    if (defaultUser && !currentUser) {
      const users = getUsers();
      const usr = users[defaultUser];
      if (usr) {
        setCurrentUser(usr);
        setCurrentScreen('dashboard');
      }
    }
  }); // Runs on every render to ensure auto-login as soon as cache becomes available

  // Pre-fill settings form when screen changes to settings
  useEffect(() => {
    if (currentScreen === 'settings' && currentUser) {
      setSettingsName(currentUser.name || '');
      setSettingsEmail(currentUser.email || '');
      setSettingsPhone(currentUser.phoneNumber || '');
      setSettingsAvatar(currentUser.avatar || '');
      setSettingsError('');
      setSettingsSuccess(false);
    }
  }, [currentScreen, currentUser]);


  // Listen to Firebase Auth state initialization
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAuthInitialized(true);
      }
    });
    return unsubscribeAuth;
  }, []);

  // Subscribe to DB updates for real-time sync
  useEffect(() => {
    const unsubscribe = subscribeToDB(() => {
      forceUpdate();
      
      const users = getUsers();
      const firebaseUser = auth.currentUser;
      
      if (!currentUser && firebaseUser) {
        // Find the user profile in Firestore cache that matches the firebase uid
        const userProfile = Object.values(users).find(u => u.id === firebaseUser.uid);
        if (userProfile) {
          setCurrentUser(userProfile);
          setCurrentScreen('dashboard');
          setAuthInitialized(true);
        }
      } else if (currentUser) {
        // If we are logged in, make sure our user reference is fresh
        const freshUser = users[currentUser.username];
        if (freshUser) {
          setCurrentUser(freshUser);
        }
      }
    });
    return unsubscribe;
  }, [currentUser]);

  // Listen to BroadcastChannel for real-time nudges
  useEffect(() => {
    const SYNC_CHANNEL_NAME = 'dept_manager_sync';
    const nudgeChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    
    nudgeChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'nudge' && currentUser) {
        if (event.data.toUserId === currentUser.id) {
          setToastMessage(`⚡ ${event.data.fromName} hat dich angestupst!`);
          setShowToast(true);
          if (toastTimeout) clearTimeout(toastTimeout);
          const timeout = setTimeout(() => setShowToast(false), 4000);
          setToastTimeout(timeout);
        }
      }
    };

    return () => nudgeChannel.close();
  }, [currentUser, toastTimeout]);

  // --- Handlers ---

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (isRegisterMode) {
      if (!authEmail.trim()) {
        setAuthError('Bitte gib eine E-Mail-Adresse ein.');
        return;
      }
      if (!authUsername.trim()) {
        setAuthError('Bitte gib einen Benutzernamen ein.');
        return;
      }
      if (!authName.trim()) {
        setAuthError('Bitte gib deinen Namen ein.');
        return;
      }
      if (!authPassword.trim()) {
        setAuthError('Bitte gib ein Passwort ein.');
        return;
      }
      if (authPassword.length < 6) {
        setAuthError('Das Passwort muss mindestens 6 Zeichen lang sein.');
        return;
      }

      try {
        const user = await registerUserInFirebase(authEmail, authPassword, authUsername, authName);
        setCurrentUser(user);
        setCurrentScreen('dashboard');
        // Reset form
        setAuthUsername('');
        setAuthEmail('');
        setAuthName('');
        setAuthPassword('');
      } catch (err) {
        setAuthError(err.message);
      }
    } else {
      // Login
      if (!authUsername.trim()) {
        setAuthError('Bitte gib deinen Benutzernamen oder deine E-Mail ein.');
        return;
      }
      if (!authPassword.trim()) {
        setAuthError('Bitte gib dein Passwort ein.');
        return;
      }

      try {
        const user = await loginUserInFirebase(authUsername, authPassword);
        setCurrentUser(user);
        setCurrentScreen('dashboard');
        // Reset form
        setAuthUsername('');
        setAuthEmail('');
        setAuthName('');
        setAuthPassword('');
      } catch (err) {
        setAuthError(err.message);
      }
    }
  };

  const handleSendSMS = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!authPhone.trim()) {
      setAuthError('Bitte gib deine Handynummer ein (z.B. +491701234567).');
      return;
    }

    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });

      const confirmationResult = await signInWithPhoneNumber(auth, authPhone.trim(), window.recaptchaVerifier);
      setPhoneConfirmation(confirmationResult);
      setPhoneStep('verify');
    } catch (err) {
      setAuthError('Fehler beim Senden der SMS: ' + err.message);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    }
  };

  const handleVerifySMS = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authSMSCode.trim()) {
      setAuthError('Bitte gib den 6-stelligen SMS-Code ein.');
      return;
    }

    try {
      const result = await phoneConfirmation.confirm(authSMSCode.trim());
      const user = result.user;

      // Check if profile exists
      const users = getUsers();
      const userProfile = Object.values(users).find(u => u.id === user.uid);

      if (userProfile) {
        // User already has profile -> log in directly!
        setCurrentUser(userProfile);
        setCurrentScreen('dashboard');
        // Clean form
        setAuthPhone('');
        setAuthSMSCode('');
        setPhoneStep('phone');
        setPhoneConfirmation(null);
      } else {
        // New user! Transition to complete profile step
        setPhoneUid(user.uid);
        setPhoneStep('profile');
      }
    } catch (err) {
      setAuthError('Ungültiger Code: ' + err.message);
    }
  };

  const handleCompletePhoneProfile = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authUsername.trim()) {
      setAuthError('Bitte wähle einen Benutzernamen.');
      return;
    }
    if (!authName.trim()) {
      setAuthError('Bitte gib deinen vollständigen Namen ein.');
      return;
    }

    try {
      const user = await createUserProfile(phoneUid, authUsername, authName, null, authPhone);
      setCurrentUser(user);
      setCurrentScreen('dashboard');
      // Reset form
      setAuthPhone('');
      setAuthSMSCode('');
      setPhoneStep('phone');
      setPhoneConfirmation(null);
      setPhoneUid('');
      setAuthUsername('');
      setAuthName('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleRollAvatar = () => {
    setIsRolling(true);
    const randomSeed = Math.random().toString(36).substring(2, 10);
    setSettingsAvatar(`https://api.dicebear.com/7.x/adventurer/svg?seed=${randomSeed}`);
    setTimeout(() => {
      setIsRolling(false);
    }, 500);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSettingsError('Bitte wähle eine gültige Bilddatei aus.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSettingsError('Das Bild darf maximal 5 MB groß sein.');
      return;
    }

    try {
      setIsRolling(true);
      const resizedBase64 = await resizeImage(file, 150);
      setSettingsAvatar(resizedBase64);
      setTimeout(() => {
        setIsRolling(false);
      }, 500);
    } catch (err) {
      setSettingsError('Fehler beim Verarbeiten des Bildes: ' + err.message);
      setIsRolling(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess(false);

    if (!settingsName.trim()) {
      setSettingsError('Name darf nicht leer sein.');
      return;
    }

    try {
      const updates = {
        name: settingsName.trim(),
        email: settingsEmail.trim() || null,
        phoneNumber: settingsPhone.trim() || null,
        avatar: settingsAvatar
      };
      
      await updateUserProfile(currentUser.id, updates);
      
      setCurrentUser(prev => ({
        ...prev,
        ...updates
      }));

      setSettingsSuccess(true);
      setToastMessage('Profil erfolgreich aktualisiert! 💾');
      setShowToast(true);
      if (toastTimeout) clearTimeout(toastTimeout);
      const timeout = setTimeout(() => setShowToast(false), 3000);
      setToastTimeout(timeout);
      
      setTimeout(() => {
        setCurrentScreen('dashboard');
      }, 1000);
    } catch (err) {
      setSettingsError('Update fehlgeschlagen: ' + err.message);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Möchtest du dich wirklich abmelden?');
    if (!confirmLogout) return;

    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout failed', err);
    }
    setCurrentUser(null);
    setCurrentScreen('auth');
    setSelectedFriend(null);
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setFriendError('');
    setFriendSuccess(false);

    if (!newFriendUsername.trim()) {
      setFriendError('Benutzername erforderlich.');
      return;
    }

    try {
      await addFriend(currentUser.id, newFriendUsername);
      setFriendSuccess(true);
      setNewFriendUsername('');
      setTimeout(() => setFriendSuccess(false), 3000);
    } catch (err) {
      setFriendError(err.message);
    }
  };

  const handleOpenSheet = (type) => {
    setSheetType(type);
    setTxError('');
    
    if (type === 'settle' && selectedFriend) {
      // Pre-fill amount with current balance to make settling simple
      const balance = getBalanceBetween(currentUser.id, selectedFriend.id);
      setTxAmount(balance.amount > 0 ? balance.amount.toFixed(2) : '');
      setTxDescription('Schulden beglichen 🤝');
    } else {
      setTxAmount('');
      setTxDescription('');
    }
    
    setSheetOpen(true);
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    setTxError('');

    const parsedAmount = parseFloat(txAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setTxError('Gültiger Betrag größer als 0 benötigt.');
      return;
    }

    const finalImgUrl = attachedImage ? getPhotoByDescription(txDescription) : null;

    try {
      if (sheetType === 'lend') {
        // Current user lends money to the friend: Current user is Lender, Friend is Borrower
        await addTransaction(currentUser.id, selectedFriend.id, parsedAmount, txDescription || 'Geld geliehen', finalImgUrl, 'pending', currentUser.id);
      } else {
        // Settle debt
        const balance = getBalanceBetween(currentUser.id, selectedFriend.id);
        if (balance.status === 'debt') {
          // Current user owes friend -> Current user pays friend (Current user is Borrower, Friend is Lender)
          // Since the borrower is paying, the lender (friend) must confirm.
          await addTransaction(currentUser.id, selectedFriend.id, parsedAmount, txDescription || 'Schulden beglichen 🤝', finalImgUrl, 'pending', currentUser.id);
        } else {
          // Friend owes current user -> Friend pays current user (Friend is Borrower, Current user is Lender)
          // Since the lender is recording that they received the money, no confirmation is needed.
          await addTransaction(selectedFriend.id, currentUser.id, parsedAmount, txDescription || 'Schulden beglichen 🤝', finalImgUrl, 'confirmed', currentUser.id);
        }
      }
      setSheetOpen(false);
      setTxAmount('');
      setTxDescription('');
      setAttachedImage(false);
    } catch (err) {
      setTxError(err.message);
    }
  };

  const handleOpenSplitPanel = () => {
    setSplitAmount('');
    setSplitDescription('');
    setSplitFriends([]);
    setSplitIncludeSelf(true);
    setSplitError('');
    setAttachedImage(false);
    setSplitPanelOpen(true);
  };

  const handleToggleSplitFriend = (friendId) => {
    setSplitFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateSplit = async (e) => {
    e.preventDefault();
    setSplitError('');

    const parsedAmount = parseFloat(splitAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSplitError('Bitte gib einen gültigen Gesamtbetrag ein.');
      return;
    }

    if (splitFriends.length === 0) {
      setSplitError('Bitte wähle mindestens einen Freund aus.');
      return;
    }

    const divisor = splitFriends.length + (splitIncludeSelf ? 1 : 0);
    const shareAmount = parsedAmount / divisor;
    const finalImgUrl = attachedImage ? getPhotoByDescription(splitDescription) : null;

    try {
      // Loop through all selected friends and record the lending transaction in Firestore
      await Promise.all(splitFriends.map(friendId => 
        addTransaction(
          currentUser.id, 
          friendId, 
          shareAmount, 
          `${splitDescription.trim() || 'Ausgabe aufgeteilt'} (Split 📊)`,
          finalImgUrl,
          'pending',
          currentUser.id
        )
      ));
      
      // Close panel
      setSplitPanelOpen(false);
      setAttachedImage(false);
    } catch (err) {
      setSplitError(err.message);
    }
  };

  const handleNudge = () => {
    if (!currentUser || !selectedFriend) return;
    
    const SYNC_CHANNEL_NAME = 'dept_manager_sync';
    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    channel.postMessage({
      type: 'nudge',
      fromUserId: currentUser.id,
      fromName: currentUser.name,
      toUserId: selectedFriend.id
    });
    channel.close();

    setToastMessage(`⚡ Du hast ${selectedFriend.name} angestupst!`);
    setShowToast(true);
    if (toastTimeout) clearTimeout(toastTimeout);
    const timeout = setTimeout(() => setShowToast(false), 3000);
    setToastTimeout(timeout);
  };

  const handleSnapPhoto = () => {
    setCameraFlash(true);
    setCameraProcessing(true);
    setTimeout(() => {
      setCameraFlash(false);
    }, 300);
    
    setTimeout(() => {
      setAttachedImage(true);
      setCameraProcessing(false);
      setCameraActive(false);
    }, 1800); // 1.8 seconds simulated snap/processing
  };

  const handleConfirmTx = (txId) => {
    try {
      confirmTransaction(txId);
    } catch (err) {
      console.error('Error confirming transaction', err);
    }
  };

  const handleRejectTx = (txId) => {
    try {
      rejectTransaction(txId);
    } catch (err) {
      console.error('Error rejecting transaction', err);
    }
  };

  // --- Render Sub-Views ---

  const renderAuthScreen = () => {
    // Phone completion step is a full card
    if (authMethod === 'phone' && phoneStep === 'profile') {
      return (
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo">👤</div>
            <h2 className="auth-title">Profil vervollständigen</h2>
            <p className="auth-subtitle">Wähle deinen Benutzernamen, um fortzufahren.</p>
          </div>

          <form onSubmit={handleCompletePhoneProfile} className="auth-form">
            {authError && <div className="error-banner">{authError}</div>}

            <div className="input-wrapper">
              <label className="input-label">Benutzername (eindeutig)</label>
              <input 
                type="text" 
                placeholder="z.B. max" 
                className="input-field"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-wrapper">
              <label className="input-label">Vollständiger Name</label>
              <input 
                type="text" 
                placeholder="z.B. Max Mustermann" 
                className="input-field"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.85rem' }}>
              <Check size={18} />
              Profil erstellen &amp; starten
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">💸</div>
          <h2 className="auth-title">DeptManager</h2>
          <p className="auth-subtitle">Einfach. Schnell. Transparent.</p>
        </div>

        {/* Tab Selection */}
        <div className="mode-toggle-group" style={{ marginBottom: '1.25rem', width: '100%', padding: '2px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
          <button 
            type="button"
            className={`mode-btn ${authMethod === 'phone' ? 'active' : ''}`}
            onClick={() => { setAuthMethod('phone'); setAuthError(''); }}
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '10px' }}
          >
            📱 Handynummer
          </button>
          <button 
            type="button"
            className={`mode-btn ${authMethod === 'email' ? 'active' : ''}`}
            onClick={() => { setAuthMethod('email'); setAuthError(''); }}
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '10px' }}
          >
            ✉️ E-Mail
          </button>
        </div>

        {authMethod === 'phone' ? (
          /* --- PHONE AUTH FORM --- */
          <form onSubmit={phoneStep === 'phone' ? handleSendSMS : handleVerifySMS} className="auth-form">
            {authError && <div className="error-banner">{authError}</div>}

            {phoneStep === 'phone' ? (
              <>
                <div className="input-wrapper">
                  <label className="input-label">Deine Handynummer</label>
                  <input 
                    type="tel" 
                    placeholder="z.B. +491701234567" 
                    className="input-field"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    required
                  />
                </div>
                
                <button type="submit" className="btn-primary" style={{ marginTop: '0.85rem' }}>
                  <Send size={16} />
                  SMS-Code senden
                </button>
              </>
            ) : (
              <>
                <div className="input-wrapper">
                  <label className="input-label">6-stelliger SMS-Code</label>
                  <input 
                    type="text" 
                    placeholder="123456" 
                    className="input-field"
                    value={authSMSCode}
                    onChange={(e) => setAuthSMSCode(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
                
                <button type="submit" className="btn-primary" style={{ marginTop: '0.85rem' }}>
                  <Check size={16} />
                  Code verifizieren
                </button>

                <button 
                  type="button" 
                  className="auth-switch-btn" 
                  onClick={() => setPhoneStep('phone')} 
                  style={{ marginTop: '0.75rem', width: '100%', textAlign: 'center', fontSize: '0.75rem' }}
                >
                  Zurück zur Nummerneingabe
                </button>
              </>
            )}

            {/* reCAPTCHA anchor container (Invisible but required) */}
            <div id="recaptcha-container"></div>
          </form>
        ) : (
          /* --- EMAIL AUTH FORM --- */
          <>
            <form onSubmit={handleAuth} className="auth-form">
              {authError && <div className="error-banner">{authError}</div>}
              
              {isRegisterMode ? (
                <>
                  <div className="input-wrapper animate-fade-in">
                    <label className="input-label">E-Mail</label>
                    <input 
                      type="email" 
                      placeholder="name@beispiel.com" 
                      className="input-field"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="input-wrapper animate-fade-in">
                    <label className="input-label">Benutzername (eindeutig)</label>
                    <input 
                      type="text" 
                      placeholder="z.B. alice" 
                      className="input-field"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-wrapper animate-fade-in">
                    <label className="input-label">Vollständiger Name</label>
                    <input 
                      type="text" 
                      placeholder="z.B. Alice Smith" 
                      className="input-field"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="input-wrapper">
                  <label className="input-label">Benutzername oder E-Mail</label>
                  <input 
                    type="text" 
                    placeholder="z.B. alice oder alice@bozen.com" 
                    className="input-field"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="input-wrapper">
                <label className="input-label">Passwort</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input-field"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '0.85rem' }}>
                <Lock size={18} />
                {isRegisterMode ? 'Konto erstellen' : 'Anmelden'}
              </button>
            </form>

            <div className="auth-switch">
              {isRegisterMode ? 'Bereits ein Konto?' : 'Noch kein Konto?'}
              <button 
                className="auth-switch-btn"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setAuthError('');
                }}
              >
                {isRegisterMode ? 'Anmelden' : 'Registrieren'}
              </button>
            </div>
          </>
        )}
        
        {/* Safe reCAPTCHA anchor container (Outside conditional block) */}
        <div id="recaptcha-container"></div>
      </div>
    );
  };

  const renderSettingsScreen = () => {
    return (
      <div className="settings-screen animate-fade-in">
        <div className="settings-card">
          <div className="settings-header">
            <h2 className="settings-title">Profil bearbeiten</h2>
            <p className="settings-subtitle">Hier kannst du dein Profilbild, deinen Namen und deine Kontaktdetails verwalten.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="settings-form">
            {settingsError && <div className="error-banner" style={{ marginBottom: '1.25rem' }}>{settingsError}</div>}
            {settingsSuccess && (
              <div className="error-banner" style={{
                background: 'var(--color-credit-bg)',
                borderColor: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--color-credit)',
                marginBottom: '1.25rem'
              }}>
                Änderungen erfolgreich gespeichert!
              </div>
            )}

            {/* Avatar Selection Section */}
            <div className="avatar-select-container">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              <div 
                className={`avatar-large-preview-wrapper ${isRolling ? 'rolling' : ''}`}
                onClick={triggerFileInput}
                title="Eigenes Bild hochladen"
                style={{ cursor: 'pointer' }}
              >
                <img src={settingsAvatar} alt="Profilbild Vorschau" className="avatar-large-preview" />
                <div className="avatar-upload-overlay">
                  <span>📤</span>
                </div>
              </div>
              
              <div className="avatar-select-actions">
                <button 
                  type="button" 
                  className="btn-roll-avatar" 
                  onClick={handleRollAvatar}
                  disabled={isRolling}
                >
                  🎲 Würfeln
                </button>
                <button 
                  type="button" 
                  className="btn-roll-avatar btn-upload-avatar" 
                  onClick={triggerFileInput}
                  disabled={isRolling}
                >
                  📤 Hochladen
                </button>
              </div>
            </div>

            <div className="input-wrapper">
              <label className="input-label">Benutzername (nicht änderbar)</label>
              <input 
                type="text" 
                className="input-field disabled" 
                value={`@${currentUser.username}`}
                disabled 
              />
            </div>

            <div className="input-wrapper">
              <label className="input-label">Vollständiger Name</label>
              <input 
                type="text" 
                placeholder="z.B. Alice Smith" 
                className="input-field"
                value={settingsName}
                onChange={e => setSettingsName(e.target.value)}
                required
              />
            </div>

            <div className="input-wrapper">
              <label className="input-label">E-Mail-Adresse</label>
              <input 
                type="email" 
                placeholder="name@beispiel.com" 
                className="input-field"
                value={settingsEmail}
                onChange={e => setSettingsEmail(e.target.value)}
              />
            </div>

            <div className="input-wrapper">
              <label className="input-label">Handynummer</label>
              <input 
                type="tel" 
                placeholder="z.B. +491701234567" 
                className="input-field"
                value={settingsPhone}
                onChange={e => setSettingsPhone(e.target.value)}
              />
            </div>

            <div className="settings-actions-group">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setCurrentScreen('dashboard')}
              >
                Abbrechen
              </button>
              <button type="submit" className="btn-primary">
                Speichern
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const friends = getFriendsForUser(currentUser.id);
    
    // Calculate total net balance, credit sum and debt sum
    let totalCredit = 0;
    let totalDebt = 0;
    
    friends.forEach(f => {
      const balance = getBalanceBetween(currentUser.id, f.id);
      if (balance.status === 'credit') totalCredit += balance.amount;
      if (balance.status === 'debt') totalDebt += balance.amount;
    });

    const totalNetBalance = totalCredit - totalDebt;
    const netStatus = totalNetBalance > 0 ? 'credit' : totalNetBalance < 0 ? 'debt' : 'balanced';
    const pendingConfirmations = getPendingConfirmations(currentUser.id);

    // Filter friends list by search keyword
    const filteredFriends = friends.filter(f => 
      f.name.toLowerCase().includes(friendSearch.toLowerCase()) || 
      f.username.toLowerCase().includes(friendSearch.toLowerCase())
    );

    return (
      <div className="dashboard-screen">
        {/* Total Net Balance Card */}
        <div className="balance-card">
          <div className="balance-card-label">Gesamtbilanz</div>
          <div className={`balance-card-val ${netStatus}`}>
            {formatBalance(Math.abs(totalNetBalance), netStatus)}
          </div>
          
          <div className="balance-indicator-row">
            <div className="balance-sub-stat">
              <span className="balance-sub-label">Du kriegst</span>
              <span className="balance-sub-val credit">{formatCurrency(totalCredit)}</span>
            </div>
            <div className="balance-sub-stat">
              <span className="balance-sub-label">Du schuldest</span>
              <span className="balance-sub-val debt">{formatCurrency(totalDebt)}</span>
            </div>
          </div>
        </div>

        {/* Global Inbox / Pending Confirmations Panel */}
        {pendingConfirmations.length > 0 && (
          <div className="inbox-container animate-fade-in">
            <div className="inbox-title-row">
              <span>📬 OFFENE BESTÄTIGUNGEN</span>
              <span className="inbox-count-badge">
                {pendingConfirmations.length} {pendingConfirmations.length === 1 ? 'Anfrage' : 'Anfragen'}
              </span>
            </div>
            
            <div className="inbox-list">
              {pendingConfirmations.map(tx => {
                const isLend = (tx.lenderId || '').toLowerCase() === (tx.createdBy || '').toLowerCase();
                
                // Find initiator profile by UID in user records
                const users = getUsers();
                const initiatorProfile = Object.values(users).find(u => u.id === tx.createdBy);
                const initiatorName = initiatorProfile 
                  ? (initiatorProfile.name || `@${initiatorProfile.username}`) 
                  : 'Unbekannter Nutzer';
                
                const initiatorAvatar = initiatorProfile?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${tx.createdBy}`;

                return (
                  <div key={tx.id} className="inbox-item">
                    <div className="inbox-item-header">
                      <img 
                        src={initiatorAvatar} 
                        alt={initiatorName} 
                        className="inbox-item-avatar"
                      />
                      <div className="inbox-item-meta">
                        <span className="inbox-item-name">
                          {initiatorName}
                        </span>
                        <span className="inbox-item-desc">
                          {isLend ? 'leiht dir Geld für ' : 'gleicht Schulden aus für '} <strong>{tx.description}</strong>
                        </span>
                      </div>
                      <span className="inbox-item-amount font-mono">
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>

                    <div className="inbox-item-actions">
                      <button 
                        onClick={() => handleRejectTx(tx.id)}
                        className="inbox-btn reject"
                      >
                        <X size={12} />
                        Ablehnen
                      </button>
                      <button 
                        onClick={() => handleConfirmTx(tx.id)}
                        className="inbox-btn confirm"
                      >
                        <Check size={12} />
                        Bestätigen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cash Standing Comparison Diagram */}
        {friends.length > 0 && (
          <div className="stats-drawer-container animate-fade-in">
            <div 
              className="stats-drawer-header"
              onClick={() => setStatsExpanded(!statsExpanded)}
            >
              <div className="stats-drawer-title">
                <Landmark size={16} />
                <span>Salden-Verteilung 📊</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {statsExpanded ? 'Schließen ▲' : 'Öffnen ▼'}
              </span>
            </div>
            
            {statsExpanded && (
              <div className="stats-drawer-content animate-fade-in">
                <div className="stats-bar-chart">
                  {(() => {
                    const maxBalance = Math.max(...friends.map(f => getBalanceBetween(currentUser.id, f.id).amount), 1);
                    return friends.map(f => {
                      const bal = getBalanceBetween(currentUser.id, f.id);
                      const pct = Math.min((bal.amount / maxBalance) * 100, 100);
                      return (
                        <div key={f.id} className="stats-bar-row">
                          <div className="stats-bar-label-row">
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>{f.name}</span>
                            <span 
                              className={bal.status === 'credit' ? 'credit' : bal.status === 'debt' ? 'debt' : ''}
                              style={{ fontSize: '0.8rem', fontWeight: 700 }}
                            >
                              {bal.status === 'credit' && '+'}
                              {bal.status === 'debt' && '-'}
                              {formatCurrency(bal.amount)}
                            </span>
                          </div>
                          <div className="stats-bar-outer">
                            <div 
                              className={`stats-bar-inner ${bal.status}`}
                              style={{ width: `${bal.status === 'balanced' ? 0 : pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Friend Row */}
        <form onSubmit={handleAddFriend} className="add-friend-container">
          <input 
            type="text" 
            placeholder="Freund hinzufügen (Username)..." 
            className="input-field flex-input"
            value={newFriendUsername}
            onChange={(e) => setNewFriendUsername(e.target.value)}
          />
          <button type="submit" className="btn-icon-submit">
            <UserPlus size={20} />
          </button>
        </form>
        {friendError && <div className="error-banner" style={{marginBottom: '1rem'}}>{friendError}</div>}
        {friendSuccess && (
          <div className="error-banner" style={{
            background: 'var(--color-credit-bg)', 
            borderColor: 'rgba(16, 185, 129, 0.2)', 
            color: 'var(--color-credit)',
            marginBottom: '1rem'
          }}>
            Freund erfolgreich hinzugefügt!
          </div>
        )}

        {/* Split Expense Button */}
        {friends.length > 0 && (
          <div className="split-btn-container">
            <button 
              type="button" 
              className="btn-action-split"
              onClick={handleOpenSplitPanel}
            >
              <ArrowRightLeft size={18} />
              Ausgabe aufteilen 📊
            </button>
          </div>
        )}

        {/* Search contacts bar */}
        <div className="section-title">
          <span>Freunde &amp; Salden</span>
          <span className="badge-count">{friends.length}</span>
        </div>

        {friends.length > 0 && (
          <div className="input-wrapper" style={{marginBottom: '0.85rem'}}>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <Search size={16} style={{position: 'absolute', left: '12px', color: 'var(--text-secondary)'}} />
              <input 
                type="text" 
                placeholder="Suchen..." 
                className="input-field" 
                style={{paddingLeft: '36px', width: '100%', borderRadius: '10px', fontSize: '0.85rem'}}
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Friends Listing */}
        <div className="friends-list">
          {filteredFriends.length > 0 ? (
            filteredFriends.map(friend => {
              const balance = getBalanceBetween(currentUser.id, friend.id);
              return (
                <div 
                  key={friend.id} 
                  className="friend-item-card"
                  onClick={() => {
                    setSelectedFriend(friend);
                    setCurrentScreen('chat');
                  }}
                >
                  <div className="friend-item-info">
                    <img src={friend.avatar} alt={friend.name} className="friend-avatar" />
                    <div>
                      <div className="friend-name">{friend.name}</div>
                      <div className="friend-status-text">
                        {balance.status === 'credit' && 'schuldet dir'}
                        {balance.status === 'debt' && 'du schuldest'}
                        {balance.status === 'balanced' && 'ausgeglichen'}
                      </div>
                    </div>
                  </div>
                  <div className="friend-balance-column">
                    <div className={`friend-balance-val ${balance.status}`}>
                      {formatBalance(balance.amount, balance.status)}
                    </div>
                    <ChevronRight size={16} style={{color: 'var(--text-muted)', marginTop: '2px', display: 'inline-block'}} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <User size={24} className="empty-icon" />
              <div>
                <p style={{fontWeight: 600, fontSize: '0.9rem'}}>Keine Freunde gefunden</p>
                <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                  Füge Freunde über ihren Benutzernamen oben hinzu (z.B. bob, charlie, diana).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Global Google Ad Unit */}
        <GoogleAdBanner 
          type="dashboard" 
          publisherId={GOOGLE_ADSENSE_PUBLISHER_ID} 
          slotId={GOOGLE_ADSENSE_SLOT_ID} 
        />
      </div>
    );
  };

  const renderChatScreen = () => {
    if (!selectedFriend) return null;
    const balance = getBalanceBetween(currentUser.id, selectedFriend.id);
    const history = getTransactionHistory(currentUser.id, selectedFriend.id);

    return (
      <div className="detail-chat-screen">
        {/* Chat Message List */}
        <div className="chat-bubbles-container">
          {history.length > 0 ? (
            history.map((tx) => {
              // Outgoing is when current user recorded the lending, or friend settled to us
              // Basically, if the tx benefits current user's balance:
              // Wait, let's look at the transaction properties:
              // lenderId is the one who lent the money. 
              // If lenderId == currentUser, it's outgoing (Alice lent to Bob, or Bob borrowed from Alice)
              // If lenderId == friend, it's incoming (Bob lent to Alice)
              const isOutgoing = tx.lenderId === currentUser.id;
              
              // Detect if this transaction description represents a settlement
              const isSettle = tx.description.includes('Schulden beglichen') || tx.description.includes('🤝');

              const isPending = tx.status === 'pending';
              const isRejected = tx.status === 'rejected';
              const isCreator = tx.createdBy === currentUser.id;

              return (
                <div 
                  key={tx.id} 
                  className={`chat-bubble-item ${isOutgoing ? 'outgoing' : 'incoming'} ${isRejected ? 'rejected-tx' : ''}`}
                >
                  <div className={`bubble-shell ${isSettle ? 'settle-bubble' : ''} ${isPending ? 'pending-bubble' : ''}`}>
                    <div className="bubble-type-tag">
                      {isSettle ? (
                        <>
                          <Check size={12} style={{color: 'var(--color-credit)'}} />
                          Auszahlung
                        </>
                      ) : (
                        isOutgoing ? (
                          <>
                            <ArrowUpRight size={12} style={{color: 'var(--color-credit)'}} />
                            Geliehen
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft size={12} style={{color: 'var(--color-debt)'}} />
                            Gekriegt
                          </>
                        )
                      )}
                    </div>
                    <div className="bubble-desc">{tx.description}</div>
                    <div className="bubble-amount-row">
                      <div className="bubble-amount">
                        {isSettle 
                          ? formatCurrency(tx.amount) 
                          : isOutgoing 
                            ? `+${formatCurrency(tx.amount)}` 
                            : `-${formatCurrency(tx.amount)}`
                        }
                      </div>
                    </div>
                    {tx.imageUrl && (
                      <div 
                        className="bubble-photo-container"
                        onClick={() => setLightboxImage(tx.imageUrl)}
                        title="Klicken zum Vergrößern"
                      >
                        <img src={tx.imageUrl} alt="Anhang" className="bubble-photo" />
                      </div>
                    )}

                    {/* Pending state details / Review buttons */}
                    {isPending && (
                      isCreator ? (
                        <div className="bubble-status-row">
                          <span className="bubble-status-badge pending">
                            <Clock size={10} />
                            Wartend
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                            Warte auf {selectedFriend.name}...
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="bubble-status-row">
                            <span className="bubble-status-badge pending">
                              <Clock size={10} />
                              Ausstehend
                            </span>
                          </div>
                          <div className="bubble-action-buttons">
                            <button 
                              type="button"
                              className="btn-bubble-confirm"
                              onClick={() => handleConfirmTx(tx.id)}
                            >
                              Bestätigen
                            </button>
                            <button 
                              type="button"
                              className="btn-bubble-decline"
                              onClick={() => handleRejectTx(tx.id)}
                            >
                              Ablehnen
                            </button>
                          </div>
                        </>
                      )
                    )}

                    {/* Rejected status label */}
                    {isRejected && (
                      <div className="bubble-status-row">
                        <span className="bubble-status-badge rejected">
                          <X size={10} />
                          Abgelehnt
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="bubble-time">
                    {new Date(tx.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="chat-empty-state">
              <Clock size={32} style={{color: 'var(--text-muted)', marginBottom: '0.5rem'}} />
              <p style={{fontWeight: 600, fontSize: '0.9rem'}}>Keine Transaktionen</p>
              <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                Trage unten eine neue Transaktion ein, um den Verlauf zu starten.
              </p>
            </div>
          )}
        </div>

        {/* Chat Action Footer */}
        <div className="chat-action-footer">
          <button 
            className="btn-action-lend"
            onClick={() => handleOpenSheet('lend')}
          >
            <Plus size={18} />
            Geld geliehen (+)
          </button>
          
          <button 
            className="btn-action-settle"
            disabled={balance.status === 'balanced'}
            onClick={() => handleOpenSheet('settle')}
          >
            <Check size={18} />
            Ausgleichen (-)
          </button>
        </div>
      </div>
    );
  };

  // --- Main Render Layout: Full Web App with Sidebar ---
  const friends = currentUser ? getFriendsForUser(currentUser.id) : [];

  const renderSidebar = () => {
    if (!currentUser) return null;
    let totalCredit = 0, totalDebt = 0;
    friends.forEach(f => {
      const bal = getBalanceBetween(currentUser.id, f.id);
      if (bal.status === 'credit') totalCredit += bal.amount;
      if (bal.status === 'debt') totalDebt += bal.amount;
    });
    const totalNet = totalCredit - totalDebt;
    const netStatus = totalNet > 0 ? 'credit' : totalNet < 0 ? 'debt' : 'balanced';
    const pendingCount = getPendingConfirmations(currentUser.id).length;

    return (
      <aside className="web-sidebar">
        {/* App Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">💸</div>
          <span className="sidebar-brand-name">DeptManager</span>
        </div>

        {/* User Profile */}
        <div className="sidebar-profile">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="sidebar-avatar" 
            style={{ cursor: 'pointer' }}
            onClick={() => setCurrentScreen('settings')}
            title="Profil bearbeiten"
          />
          <div 
            className="sidebar-profile-info" 
            style={{ cursor: 'pointer', minWidth: 0 }} 
            onClick={() => setCurrentScreen('settings')} 
            title="Profil bearbeiten"
          >
            <div className="sidebar-profile-name">{currentUser.name}</div>
            <div className="sidebar-profile-username">@{currentUser.username}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
            <button className="icon-btn" onClick={() => setCurrentScreen('settings')} title="Einstellungen">
              <Settings size={15} />
            </button>
            <button className="icon-btn" onClick={handleLogout} title="Abmelden">
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Net Balance Summary */}
        <div className={`sidebar-balance-card ${netStatus}`}>
          <span className="sidebar-balance-label">Gesamtbilanz</span>
          <span className="sidebar-balance-value">{formatBalance(Math.abs(totalNet), netStatus)}</span>
          <div className="sidebar-balance-row">
            <span className="credit">↑ {formatCurrency(totalCredit)}</span>
            <span className="debt">↓ {formatCurrency(totalDebt)}</span>
          </div>
        </div>

        {/* Pending Inbox Badge */}
        {pendingCount > 0 && (
          <div className="sidebar-inbox-hint" onClick={() => setCurrentScreen('dashboard')}>
            <span>📬 {pendingCount} offene {pendingCount === 1 ? 'Bestätigung' : 'Bestätigungen'}</span>
          </div>
        )}

        {/* Friends List */}
        <div className="sidebar-section-label">Freunde & Salden</div>
        <div className="sidebar-friends-list">
          {friends.length === 0 && (
            <div className="sidebar-empty">Noch keine Freunde hinzugefügt.</div>
          )}
          {friends.map(f => {
            const bal = getBalanceBetween(currentUser.id, f.id);
            const isActive = selectedFriend?.id === f.id && currentScreen === 'chat';
            return (
              <div
                key={f.id}
                className={`sidebar-friend-item ${isActive ? 'active' : ''}`}
                onClick={() => { setSelectedFriend(f); setCurrentScreen('chat'); }}
              >
                <img src={f.avatar} alt={f.name} className="sidebar-friend-avatar" />
                <div className="sidebar-friend-info">
                  <span className="sidebar-friend-name">{f.name}</span>
                  <span className="sidebar-friend-status">{bal.status === 'credit' ? 'schuldet dir' : bal.status === 'debt' ? 'du schuldest' : 'ausgeglichen'}</span>
                </div>
                <span className={`sidebar-friend-amount ${bal.status}`}>{bal.status !== 'balanced' ? formatBalance(bal.amount, bal.status) : '—'}</span>
              </div>
            );
          })}
        </div>

        {/* Add Friend */}
        <form onSubmit={handleAddFriend} className="sidebar-add-friend">
          <input
            type="text"
            placeholder="Username hinzufügen..."
            className="input-field"
            style={{ fontSize: '0.8rem' }}
            value={newFriendUsername}
            onChange={e => setNewFriendUsername(e.target.value)}
          />
          <button type="submit" className="btn-icon-submit" style={{ minWidth: '36px' }}>
            <UserPlus size={16} />
          </button>
        </form>
        {friendError && <div className="error-banner" style={{ margin: '0.5rem 0 0', fontSize: '0.75rem' }}>{friendError}</div>}
        {friendSuccess && <div className="error-banner" style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', background: 'var(--color-credit-bg)', color: 'var(--color-credit)', border: '1px solid rgba(16,185,129,0.2)' }}>Freund hinzugefügt!</div>}

        {/* Split Button */}
        {friends.length > 0 && (
          <button className="btn-action-split sidebar-split-btn" onClick={handleOpenSplitPanel}>
            <ArrowRightLeft size={15} /> Ausgabe aufteilen
          </button>
        )}
      </aside>
    );
  };

  const renderMainContent = () => {
    if (!currentUser) {
      // Auth screen: full-width centered
      return (
        <div className="web-main web-main-auth">
          {renderAuthScreen()}
        </div>
      );
    }

    return (
      <div className="web-main">
        {/* Top bar for chat */}
        {currentScreen === 'chat' && selectedFriend && (
          <header className="web-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="back-btn web-back-btn" onClick={() => setCurrentScreen('dashboard')}>
                <ArrowLeft size={20} />
              </button>
              <img src={selectedFriend.avatar} alt={selectedFriend.name} className="avatar active-avatar" />
              <div className="chat-user-header-info">
                <span className="user-meta-name">{selectedFriend.name}</span>
                <span className={`chat-user-balance-sub ${getBalanceBetween(currentUser.id, selectedFriend.id).status}`}>
                  {(() => { const b = getBalanceBetween(currentUser.id, selectedFriend.id); return formatBalance(b.amount, b.status); })()}
                </span>
              </div>
            </div>
            {(() => {
              const bal = getBalanceBetween(currentUser.id, selectedFriend.id);
              if (bal.status === 'credit') {
                return (
                  <button className="btn-action-settle animate-pulse" style={{ padding: '0.35rem 0.75rem', borderRadius: '10px', fontSize: '0.78rem', background: 'var(--color-primary-glow)', color: 'var(--text-primary)', borderColor: 'var(--color-primary)', fontWeight: 700 }} onClick={handleNudge}>
                    ⚡ Anstupsen
                  </button>
                );
              }
              return null;
            })()}
          </header>
        )}

        {/* Top bar for settings */}
        {currentScreen === 'settings' && (
          <header className="web-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="back-btn web-back-btn" onClick={() => setCurrentScreen('dashboard')}>
                <ArrowLeft size={20} />
              </button>
              <span className="user-meta-name">Profileinstellungen</span>
            </div>
          </header>
        )}

        {/* Dashboard, Chat or Settings */}
        <div className="web-content-area">
          {currentScreen === 'dashboard' && renderDashboard()}
          {currentScreen === 'chat' && renderChatScreen()}
          {currentScreen === 'settings' && renderSettingsScreen()}
        </div>
      </div>
    );
  };

  if (!authInitialized) {
    return (
      <div className="app-root-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060913', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid rgba(99, 102, 241, 0.1)', 
            borderTopColor: 'var(--color-primary)', 
            borderRadius: '50%',
            margin: '0 auto 1.25rem auto'
          }}></div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            Sitzung wird wiederhergestellt...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root-screen">
      {currentUser ? (
        <div className="web-layout">
          {renderSidebar()}
          {renderMainContent()}
        </div>
      ) : (
        <div className="web-auth-wrapper">
          {renderAuthScreen()}
          <div id="recaptcha-container"></div>
        </div>
      )}

      {/* Overlays: sheets, toast, lightbox, camera — always rendered in root */}
      {sheetOpen && (
        <>
          <div className="bottom-sheet-backdrop" onClick={() => setSheetOpen(false)}></div>
          <div className="bottom-sheet">
            <div className="sheet-handle"></div>
            <div className="sheet-header">
              <h3 className="sheet-title">{sheetType === 'lend' ? 'Geld geliehen (+)' : 'Schulden begleichen (-)'}</h3>
              <button className="icon-btn" onClick={() => setSheetOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateTransaction} className="sheet-body">
              {txError && <div className="error-banner">{txError}</div>}
              <div className="amount-input-container">
                <span className="amount-currency">€</span>
                <input type="text" placeholder="0,00" className="amount-input" value={txAmount} onChange={e => setTxAmount(e.target.value)} autoFocus />
              </div>
              <div className="input-wrapper">
                <label className="input-label">Foto anhängen (optional)</label>
                {attachedImage ? (
                  <div className="photo-attached-preview animate-fade-in">
                    <img src={getPhotoByDescription(txDescription)} alt="Attachment" />
                    <button type="button" className="photo-attached-remove" onClick={() => setAttachedImage(false)}><X size={12} /></button>
                  </div>
                ) : (
                  <button type="button" className="btn-attach-photo" onClick={() => setCameraActive(true)}><span>📷 Foto aufnehmen</span></button>
                )}
              </div>
              <div className="input-wrapper">
                <label className="input-label">Verwendungszweck</label>
                <input type="text" placeholder={sheetType === 'lend' ? 'z.B. Pizza 🍕' : 'z.B. Schulden ausgeglichen 🤝'} className="input-field" value={txDescription} onChange={e => setTxDescription(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Eintragen</button>
            </form>
          </div>
        </>
      )}

      {splitPanelOpen && (
        <>
          <div className="bottom-sheet-backdrop" onClick={() => setSplitPanelOpen(false)}></div>
          <div className="bottom-sheet" style={{ maxHeight: '85%', display: 'flex', flexDirection: 'column' }}>
            <div className="sheet-handle"></div>
            <div className="sheet-header">
              <h3 className="sheet-title">Ausgabe aufteilen 📊</h3>
              <button className="icon-btn" onClick={() => setSplitPanelOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateSplit} className="sheet-body" style={{ flex: 1, overflowY: 'auto' }}>
              {splitError && <div className="error-banner" style={{ marginBottom: '1rem' }}>{splitError}</div>}
              <div className="amount-input-container">
                <span className="amount-currency">€</span>
                <input type="text" placeholder="0,00" className="amount-input" value={splitAmount} onChange={e => setSplitAmount(e.target.value)} autoFocus />
              </div>
              <div className="input-wrapper">
                <label className="input-label">Verwendungszweck</label>
                <input type="text" placeholder="z.B. Abendessen 🍽️, Taxi 🚕" className="input-field" value={splitDescription} onChange={e => setSplitDescription(e.target.value)} />
              </div>
              <div className="input-wrapper">
                <label className="input-label">Freunde auswählen ({splitFriends.length} gewählt)</label>
                <div className="split-friends-checklist">
                  {getFriendsForUser(currentUser.id).map(friend => {
                    const isSelected = splitFriends.includes(friend.id);
                    return (
                      <div key={friend.id} className={`split-friend-checkbox-item ${isSelected ? 'selected' : ''}`} onClick={() => handleToggleSplitFriend(friend.id)}>
                        <div className="split-checkbox-row">
                          <img src={friend.avatar} alt={friend.name} className="avatar" style={{ width: '28px', height: '28px' }} />
                          <span className="friend-name" style={{ fontSize: '0.85rem' }}>{friend.name}</span>
                        </div>
                        <div className="checkbox-custom">{isSelected && <Check size={12} className="checkbox-icon" />}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="split-toggle-container">
                <span className="split-toggle-label">Mich selbst einbeziehen</span>
                <div className={`switch-outer ${splitIncludeSelf ? 'active' : ''}`} onClick={() => setSplitIncludeSelf(!splitIncludeSelf)}>
                  <div className="switch-inner"></div>
                </div>
              </div>
              {parseFloat(splitAmount) > 0 && splitFriends.length > 0 && (
                <div className="split-preview-card">
                  <span className="split-preview-title">Berechnung Vorschau</span>
                  <div className="split-preview-amount-headline">
                    {(() => { const amt = parseFloat(splitAmount.replace(',', '.')); const div = splitFriends.length + (splitIncludeSelf ? 1 : 0); return isNaN(amt) ? '0,00 €' : formatCurrency(amt / div); })()}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>pro Person</span>
                  </div>
                  <div className="split-preview-list">
                    {splitFriends.map(friendId => {
                      const friendObj = getUsers()[friendId];
                      const amt = parseFloat(splitAmount.replace(',', '.'));
                      const div = splitFriends.length + (splitIncludeSelf ? 1 : 0);
                      return friendObj ? (
                        <div key={friendId} className="split-preview-item">
                          <span>{friendObj.name} schuldet dir:</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(amt / div)}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Splitten &amp; Eintragen</button>
            </form>
          </div>
        </>
      )}

      {showToast && (
        <div className="nudge-toast"><div className="nudge-toast-icon">⚡</div><div className="nudge-toast-text">{toastMessage}</div></div>
      )}
      {lightboxImage && (
        <div className="lightbox-backdrop" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} alt="Anhang Großansicht" className="lightbox-img" />
          <div className="lightbox-caption">Foto-Anhang 📷</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Tippen zum Schließen</p>
        </div>
      )}
      {cameraActive && (
        <div className="camera-overlay">
          <div className={`camera-flash ${cameraFlash ? 'flash-active' : ''}`}></div>
          <div className="camera-header">
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>📷 Foto aufnehmen</span>
            <button type="button" className="icon-btn" onClick={() => setCameraActive(false)}><X size={16} /></button>
          </div>
          <div className="camera-viewfinder">
            <div className="camera-grid-line h1"></div>
            <div className="camera-grid-line h2"></div>
            <div className="camera-grid-line v1"></div>
            <div className="camera-grid-line v2"></div>
            <div className="camera-scan-glow"></div>
            {cameraProcessing ? (
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', zIndex: 10, textAlign: 'center' }}>
                <Clock size={32} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', color: 'var(--color-primary)' }} />
                Foto wird verarbeitet...
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.75rem', zIndex: 10, textAlign: 'center', background: 'rgba(0,0,0,0.5)', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
                Gegenstand oder Beleg fokussieren
              </div>
            )}
          </div>
          <div className="camera-controls">
            <button type="button" className="camera-shutter-btn" disabled={cameraProcessing} onClick={handleSnapPhoto}></button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation - only visible on small screens */}
      {currentUser && (
        <nav className="mobile-bottom-nav">
          <button
            className={`mobile-nav-item ${currentScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('dashboard')}
          >
            <Home size={20} />
            <span>Home</span>
          </button>
          {selectedFriend && (
            <button
              className={`mobile-nav-item ${currentScreen === 'chat' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('chat')}
            >
              <MessageCircle size={20} />
              <span>{selectedFriend.name.split(' ')[0]}</span>
            </button>
          )}
          <button
            className={`mobile-nav-item ${currentScreen === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('settings')}
          >
            <Settings size={20} />
            <span>Profil</span>
          </button>
          <button
            className="mobile-nav-item"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Abmelden</span>
          </button>
        </nav>
      )}
    </div>
  );
}
