import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: 'AIzaSyAGtmpXGoE9eYPwvgq-s5TuO2Rc-WqdixA',
  authDomain: 'aadiyog-app.firebaseapp.com',
  projectId: 'aadiyog-app',
  storageBucket: 'aadiyog-app.appspot.com',
  messagingSenderId: '246601370983',
  appId: '1:246601370983:web:9b533d716485f9557fb3c2'
};

const app = initializeApp(firebaseConfig);

// ✅ Use v3 Site Key from Firebase App Check
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LfT4o0rAAAAADCD9IvOn9hvfSc7n3JTmOkCx0tM'), 
  isTokenAutoRefreshEnabled: true
});

const auth = getAuth(app);
export { auth };
