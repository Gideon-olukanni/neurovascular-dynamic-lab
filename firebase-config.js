// ══════════════════════════════════════════════════════════════════
//  firebase-config.js — Single source of truth for all Firebase
//  imports across the Neurovascular Dynamic Lab.
//
//  Every page (admin.html, quiz.html, etc.) must import ONLY from
//  this file — never directly from the Firebase CDN — so that db,
//  auth, and all Firestore helpers share the same app instance.
// ══════════════════════════════════════════════════════════════════

// ── 1. Core SDK ───────────────────────────────────────────────────
import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// ── 2. Firestore ──────────────────────────────────────────────────
import {
  getFirestore,
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
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── 3. Auth ───────────────────────────────────────────────────────
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ── 4. Your Project Credentials ───────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyDoiEOqSdTGtNVSxsD_-bvJe6FnVKaVN04",
  authDomain:        "neurovascular-dynamic-la-ad574.firebaseapp.com",
  projectId:         "neurovascular-dynamic-la-ad574",
  storageBucket:     "neurovascular-dynamic-la-ad574.firebasestorage.app",
  messagingSenderId: "107310850378",
  appId:             "1:107310850378:web:1596950dfa2fcfd486a1b3",
  measurementId:     "G-KJZ39Z1J53"
};

// ── 5. Initialize Once ────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// ── 6. Export Everything ──────────────────────────────────────────
//  Import from THIS file only. Never import Firestore/Auth helpers
//  directly from the CDN in any other file — doing so creates a
//  second Firebase instance and breaks collection(db, ...) calls.
export {
  // instances
  db,
  auth,

  // Firestore — document ops
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,

  // Firestore — query helpers
  query,
  where,
  orderBy,
  limit,
  onSnapshot,

  // Firestore — write helpers
  serverTimestamp,
  increment,
  writeBatch,
  arrayUnion,
  arrayRemove,

  // Auth
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
};
