// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
 apiKey: "AIzaSyBH6Y61lrJWO6cFYklgfco3O5v7GfA4D8c",
  authDomain: "for-alive.firebaseapp.com",
  databaseURL: "https://for-alive-default-rtdb.firebaseio.com", // ✅ use this!
  projectId: "for-alive",
  storageBucket: "for-alive.appspot.com",
  messagingSenderId: "830764636345",
  appId: "1:830764636345:web:edfa0d68b8481defa36368",
  measurementId: "G-6244M0TTXW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
