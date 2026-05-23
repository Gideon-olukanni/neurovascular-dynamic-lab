// 1. Import the core Firebase App and Firestore Database functions from the official web delivery network (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Your unique web credentials that point directly to your "neurovascular-dynamic" project
const firebaseConfig = {
  apiKey: "AIzaSyDoiEOqSdTGtNVSxsD_-bvJe6FnVKaVN04",
  authDomain: "neurovascular-dynamic-la-ad574.firebaseapp.com",
  projectId: "neurovascular-dynamic-la-ad574",
  storageBucket: "neurovascular-dynamic-la-ad574.firebasestorage.app",
  messagingSenderId: "107310850378",
  appId: "1:107310850378:web:1596950dfa2fcfd486a1b3",
  measurementId: "G-KJZ39Z1J53"
};

// 3. Initialize the connection
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. Export these tools so your main quiz or flashcard code can use them to save/fetch questions
export { db, collection, addDoc, getDocs, query, where };
