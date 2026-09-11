/*
  Firebase setup:
  1) Create a Firebase project.
  2) Register this website as a Web App.
  3) Paste the config below.
  4) Enable Authentication + Firestore.
*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCEVBrehaW1afPsK2IN3ndiRNZ5XUvfQIY",
  authDomain: "coopy-read.firebaseapp.com",
  projectId: "coopy-read",
  storageBucket: "coopy-read.firebasestorage.app",
  messagingSenderId: "1076871159879",
  appId: "1:1076871159879:web:9c28d7a26f5298a6145162",
  measurementId: "G-8V56SL731G"
};

const isConfigured = Object.values(firebaseConfig).every(
  value => value && !String(value).startsWith("YOUR_")
);

let app = null, auth = null, db = null;
if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export {
  isConfigured, app, auth, db, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp
};