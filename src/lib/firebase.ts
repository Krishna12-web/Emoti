// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "emotifriend-2rwkr",
  "appId": "1:443646849072:web:609f186dcb50cbccf83df5",
  "storageBucket": "emotifriend-2rwkr.firebasestorage.app",
  "apiKey": "AIzaSyDd6uUAUyR1qulqUD1AR4SPJC-jMT_vF7U",
  "authDomain": "emotifriend-2rwkr.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "443646849072"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
