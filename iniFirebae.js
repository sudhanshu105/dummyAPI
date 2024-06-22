
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyBIib5W8ITuFI1ln1rjno1YnITOuX-Vn6w",
  authDomain: "tempapi-2bd63.firebaseapp.com",
  projectId: "tempapi-2bd63",
  storageBucket: "tempapi-2bd63.appspot.com",
  messagingSenderId: "470748446219",
  appId: "1:470748446219:web:97f7d7149c639df700110e",
  measurementId: "G-P0112CSYLZ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);