import { doc, setDoc, getDoc, collection, getDocs, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
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
  matchName?: string;
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
  const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
  
  // Para cada usuario sin displayName, buscar su nombre en matches
  const usersWithNames = await Promise.all(
    users.map(async (user) => {
      if (!user.displayName || user.displayName === user.email?.split('@')[0]) {
        try {
          // Buscar el último partido creado por este usuario
          const matchesQuery = query(
            collection(db, 'matches'),
            where('createdBy', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const matchesSnap = await getDocs(matchesQuery);
          
          if (!matchesSnap.empty) {
            const lastMatch = matchesSnap.docs[0].data();
            if (lastMatch.name) {
              user.matchName = lastMatch.name;
            }
          }
        } catch (error) {
          console.log('Error buscando partidos para usuario:', user.uid);
        }
      }
      return user;
    })
  );
  
  return usersWithNames;
};

export const updateUserRole = async (uid: string, newRole: UserRole): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { role: newRole });
};
