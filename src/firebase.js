import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB1DGOBnpma5sg9AYwTAhwRl8LN3j02bDk",
  authDomain: "gym-apc.web.app",
  projectId: "gym-apc",
  storageBucket: "gym-apc.firebasestorage.app",
  messagingSenderId: "645735217820",
  appId: "1:645735217820:web:31784188570257a2470b59",
  measurementId: "G-2NZ4ZYFM44"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

// Persistencia offline: los datos se guardan en IndexedDB del browser.
// Después del primer login, la app carga instantáneamente desde el caché local
// y sincroniza en segundo plano con Firebase.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);
