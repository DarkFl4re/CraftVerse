// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCBwnzrybZih8gyp5cZn8JuXf2fccvUqqM",
  authDomain: "craftverse-app.firebaseapp.com",
  projectId: "craftverse-app",
  storageBucket: "craftverse-app.firebasestorage.app",
  messagingSenderId: "362787782858",
  appId: "1:362787782858:web:9865ea2a77934ecd97f433",
  measurementId: "G-S7VTYWJT6Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);