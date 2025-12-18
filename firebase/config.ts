
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAjrOzU7xjsdXNaS-6oQH2Y7uE6y1k-jwc",
  authDomain: "futbol-stats-app.firebaseapp.com",
  projectId: "futbol-stats-app",
  storageBucket: "futbol-stats-app.firebasestorage.app",
  messagingSenderId: "418195848680",
  appId: "1:418195848680:web:02dec4fc506f14429a385d",
  measurementId: "G-19RNN6F1VM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with modern persistence settings
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize and export Auth
export const auth = getAuth(app);

export const analytics = getAnalytics(app);
