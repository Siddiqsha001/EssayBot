import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; 
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCka4iV6yjEfraXgvdP2soKjGEwVZXTxg0",
    authDomain: "essay-8f833.firebaseapp.com",
    projectId: "essay-8f833",
    storageBucket: "essay-8f833.firebasestorage.app",
    messagingSenderId: "987939497935",
    appId: "1:987939497935:web:0b3658417784f41f6254ba",
    measurementId: "G-K5CBRGHN0Y"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
