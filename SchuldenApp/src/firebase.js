import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBzFpmbTWAygLS4jdTgdil_jFBgDevrBcU",
  authDomain: "bozen-2026.firebaseapp.com",
  projectId: "bozen-2026",
  storageBucket: "bozen-2026.firebasestorage.app",
  messagingSenderId: "1029525328732",
  appId: "1:1029525328732:web:d6c7c51dd56bc73fd9a799"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
