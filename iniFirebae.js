// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBIib5W8ITuFI1ln1rjno1YnITOuX-Vn6w",
  authDomain: "tempapi-2bd63.firebaseapp.com",
  projectId: "tempapi-2bd63",
  storageBucket: "tempapi-2bd63.appspot.com",
  messagingSenderId: "470748446219",
  appId: "1:470748446219:web:97f7d7149c639df700110e",
  measurementId: "G-P0112CSYLZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);