// src/lib/firebase/client.ts
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAGtmpXGoE9eYPwvgq-s5TuO2Rc-WqdixA",
  authDomain: "aadiyog-app.firebaseapp.com",
  projectId: "aadiyog-app",
  storageBucket: "aadiyog-app.firebasestorage.app",
  messagingSenderId: "246601370983",
  appId: "1:246601370983:web:9b533d716485f9557fb3c2",
  measurementId: "G-W30ZY3LSJ4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
