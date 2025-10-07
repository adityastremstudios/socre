import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBH6Y61lrJWO6cFYklgfco3O5v7GfA4D8c",
  authDomain: "for-alive.firebaseapp.com",
  databaseURL: "https://for-alive-default-rtdb.firebaseio.com",
  projectId: "for-alive",
  storageBucket: "for-alive.firebasestorage.app",
  messagingSenderId: "830764636345",
  appId: "1:830764636345:web:edfa0d68b8481defa36368",
  measurementId: "G-6244M0TTXW"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
