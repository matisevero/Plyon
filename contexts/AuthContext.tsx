
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  updateEmail, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  sendPasswordResetEmail,
  type User 
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  updateUserEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  updateUserPassword: (newPassword: string, currentPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to ensure user doc exists in Firestore with search fields
  const syncUserToFirestore = async (firebaseUser: User, name?: string | null) => {
    if (!db) return; // Protección si db no cargó
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    const displayName = name || firebaseUser.displayName || 'Plyr';
    const email = firebaseUser.email || '';

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        name: displayName,
        email: email,
        searchName: displayName.toLowerCase(),
        searchEmail: email.toLowerCase(),
        createdAt: new Date().toISOString(),
        friends: [],
        friendRequestsSent: [],
        friendRequestsReceived: [],
        level: 1,
        xp: 0,
        careerPoints: 0 // Initialize for Global Rankings
      }, { merge: true });
    } else {
        const data = userSnap.data();
        await setDoc(userRef, {
            searchName: (data.name || displayName).toLowerCase(),
            searchEmail: (data.email || email).toLowerCase(),
            // Ensure points exist for old users so they appear in ranking
            careerPoints: data.careerPoints ?? 0,
            level: data.level ?? 1,
            xp: data.xp ?? 0
        }, { merge: true });
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error("Firebase no está configurado correctamente.");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await syncUserToFirestore(result.user);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!auth) throw new Error("Firebase no está configurado correctamente.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        await syncUserToFirestore(userCredential.user, name);
        setUser({ ...userCredential.user, displayName: name });
      }
    } catch (error) {
      console.error("Error signing up", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase no está configurado correctamente.");
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await syncUserToFirestore(result.user);
    } catch (error) {
      console.error("Error signing in", error);
      throw error;
    }
  };

  const logOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const updateUserEmail = async (newEmail: string, currentPassword: string) => {
    if (!user || !user.email || !auth || !db) throw new Error("No hay conexión con el servicio.");
    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, newEmail);
        await setDoc(doc(db, 'users', user.uid), { 
            email: newEmail, 
            searchEmail: newEmail.toLowerCase() 
        }, { merge: true });
    } catch (error) {
        console.error("Error al actualizar el correo electrónico:", error);
        throw error;
    }
  };

  const updateUserPassword = async (newPassword: string, currentPassword: string) => {
    if (!user || !user.email || !auth) throw new Error("No hay ningún usuario conectado.");
    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
    } catch (error) {
        console.error("Error al actualizar la contraseña:", error);
        throw error;
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) return;
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset email", error);
      throw error;
    }
  };

  useEffect(() => {
    if (!auth) {
        // Si auth falló al cargar en config.ts, terminamos la carga sin usuario
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // Sync on every load to ensure data consistency
      if (currentUser) {
          syncUserToFirestore(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading, signInWithGoogle, signUp, signIn, logOut, updateUserEmail, updateUserPassword, resetPassword };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
