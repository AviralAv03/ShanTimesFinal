import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCRSpifn7cEfknSoOFSRchysXK5CeDPxIM",
  authDomain: "shantimesnew.firebaseapp.com",
  projectId: "shantimesnew",
  storageBucket: "shantimesnew.appspot.com",
  messagingSenderId: "580774735438",
  appId: "1:580774735438:web:1d4321a9f9ddb36fea1d1f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);