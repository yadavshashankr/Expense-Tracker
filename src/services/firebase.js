import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCnJeFd4bNwHfJUnE1_g3bcwb7Gqrfx580",
  authDomain: "expense-tracker-49b78.firebaseapp.com",
  projectId: "expense-tracker-49b78",
  storageBucket: "expense-tracker-49b78.firebasestorage.app",
  messagingSenderId: "1007001559811",
  appId: "1:1007001559811:web:083f65ccaed2ccc000bf36"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 