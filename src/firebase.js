// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDwQRFu_-Tk9JBSAH53lIf2MyA66j9FZys",
  authDomain: "farmtrack-c0421.firebaseapp.com",
  projectId: "farmtrack-c0421",
  storageBucket: "farmtrack-c0421.firebasestorage.app",
  messagingSenderId: "785570881785",
  appId: "1:785570881785:web:bac2685085f7d669100228",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
