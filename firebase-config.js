// 1. Core Firebase SDK Imports (Aligned to matching v10.8.0 versions)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 2. Your unique web credentials
const firebaseConfig = {
  apiKey: "AIzaSyDoiEOqSdTGtNVSxsD_-bvJe6FnVKaVN04",
  authDomain: "neurovascular-dynamic-la-ad574.firebaseapp.com",
  projectId: "neurovascular-dynamic-la-ad574",
  storageBucket: "neurovascular-dynamic-la-ad574.firebasestorage.app",
  messagingSenderId: "107310850378",
  appId: "1:107310850378:web:1596950dfa2fcfd486a1b3",
  measurementId: "G-KJZ39Z1J53"
};

// 3. Initialize Connections Once
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 4. Clean Export Strategy for Your Application Pages
export {
  db,
  auth,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
  arrayUnion,
  arrayRemove,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
};
