import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxIoZjSK0nq7eNZBYfzpUIVPmxRDIttGE",
  authDomain: "laliya-uz.firebaseapp.com",
  projectId: "laliya-uz",
  storageBucket: "laliya-uz.firebasestorage.app",
  messagingSenderId: "307432035320",
  appId: "1:307432035320:web:032d22aed41a797a79bc0d",
  measurementId: "G-PCLCGPC541"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;