import { doc, setDoc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
  displayName?: string;
  photoURL?: string;
}

export const createUserProfile = async (
  uid: string,
  email: string,
  displayName?: string,
  photoURL?: string
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const existingUser = await getDoc(userRef);
  if (existingUser.exists()) {
    await updateDoc(userRef, { lastLogin: new Date() });
    return;
  }
  const userProfile: UserProfile = {
    uid,
    email,
    role: 'user',
    createdAt: new Date(),
    lastLogin: new Date(),
    displayName: displayName || email.split('@')[0],
    photoURL
  };
  await setDoc(userRef, userProfile);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
};

export const isUserAdmin = async (uid: string): Promise<boolean> => {
  const profile = await getUserProfile(uid);
  return profile?.role === 'admin';
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  return usersSnapshot.docs.map(doc => doc.data() as UserProfile);
};

export const updateUserRole = async (uid: string, newRole: UserRole): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { role: newRole });
};
