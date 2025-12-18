
import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, onSnapshot, Unsubscribe, getDoc, Timestamp, query, where, arrayUnion, arrayRemove, orderBy, limit } from 'firebase/firestore';
import type { Match, Goal, CustomAchievement, AIInteraction, PlayerProfileData, Tournament, PublicProfile, ChatMessage, Notification } from '../types';
import { v4 as uuidv4 } from 'uuid';

export type UserData = {
    matches: Match[];
    goals: Goal[];
    customAchievements: CustomAchievement[];
    aiInteractions: AIInteraction[];
    playerProfile: PlayerProfileData;
    tournaments: Tournament[];
    isOnboardingComplete: boolean;
};

// Helper to recursively convert Firestore Timestamps to ISO strings
const convertTimestampsToISO = (data: any): any => {
    if (data instanceof Timestamp) {
        return data.toDate().toISOString();
    }
    if (Array.isArray(data)) {
        return data.map(item => convertTimestampsToISO(item));
    }
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
        const newData: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newData[key] = convertTimestampsToISO(data[key]);
            }
        }
        return newData;
    }
    return data;
};

// Helper to sanitize data for Firestore
const cleanDataForFirestore = (data: any): any => {
    if (data === undefined) return null;
    if (data === null) return null;
    if (data instanceof Timestamp) return data;
    
    if (Array.isArray(data)) {
        return data.map(cleanDataForFirestore);
    }
    
    if (typeof data === 'object') {
        const newObj: any = {};
        for (const key in data) {
            if (key === 'id') continue;
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const cleanValue = cleanDataForFirestore(data[key]);
                if (cleanValue !== undefined) {
                    newObj[key] = cleanValue;
                } else {
                    newObj[key] = null;
                }
            }
        }
        return newObj;
    }
    return data;
};

export const getOneTimeUserData = async (userId: string): Promise<UserData | null> => {
    const profileSnap = await getDoc(doc(db, 'users', userId));
    if (!profileSnap.exists()) return null;

    const profileData = convertTimestampsToISO(profileSnap.data());
    const { isOnboardingComplete, ...playerProfile } = profileData;

    const collectionsToFetch = ['matches', 'goals', 'customAchievements', 'aiInteractions', 'tournaments'];
    const data: any = {
        playerProfile,
        isOnboardingComplete: isOnboardingComplete ?? true
    };

    for (const colName of collectionsToFetch) {
        const snapshot = await getDocs(collection(db, 'users', userId, colName));
        data[colName] = snapshot.docs.map(doc => ({ 
            ...convertTimestampsToISO(doc.data()), 
            id: doc.id 
        }));
    }

    return data as UserData;
};

export const subscribeToUserData = (
    userId: string, 
    callback: (data: UserData, fromCache: boolean) => void,
    onError?: (error: string) => void
): Unsubscribe => {
    const collectionsToSubscribe = ['matches', 'goals', 'customAchievements', 'aiInteractions', 'tournaments'];
    const unsubscribers: Unsubscribe[] = [];
    let dataCache: Partial<UserData> = {
        matches: [], goals: [], customAchievements: [], aiInteractions: [], tournaments: [],
        playerProfile: { name: '' }, isOnboardingComplete: false
    };
    let snapshotMetadata: Record<string, boolean> = {};
    let hasErrorOccurred = false;
    const allKeys = [...collectionsToSubscribe, 'profile'];

    const triggerCallback = () => {
        const allLoaded = allKeys.every(key => key in snapshotMetadata);
        if (allLoaded && !hasErrorOccurred) {
            const isFromCache = allKeys.some(key => snapshotMetadata[key]);
            callback(dataCache as UserData, isFromCache);
        }
    };

    collectionsToSubscribe.forEach(colName => {
        const unsub = onSnapshot(collection(db, 'users', userId, colName), (snapshot) => {
            snapshotMetadata[colName] = snapshot.metadata.fromCache;
            dataCache[colName as keyof UserData] = snapshot.docs.map(doc => ({ 
                ...convertTimestampsToISO(doc.data()),
                id: doc.id 
            })) as any;
            triggerCallback();
        }, (error) => {
            hasErrorOccurred = true;
            onError?.(`Error en ${colName}: ${error.message}`);
        });
        unsubscribers.push(unsub);
    });

    const profileUnsub = onSnapshot(doc(db, 'users', userId), (docSnap) => {
        snapshotMetadata['profile'] = docSnap.metadata.fromCache;
        if (docSnap.exists()) {
            const convertedData = convertTimestampsToISO(docSnap.data());
            const { isOnboardingComplete, ...playerProfile } = convertedData;
            dataCache.playerProfile = playerProfile as PlayerProfileData;
            dataCache.isOnboardingComplete = isOnboardingComplete ?? true;
        }
        triggerCallback();
    });
    unsubscribers.push(profileUnsub);

    return () => unsubscribers.forEach(unsub => unsub());
};

export const overwriteCloudData = async (userId: string, data: Partial<UserData>) => {
    const collections = ['matches', 'goals', 'customAchievements', 'aiInteractions', 'tournaments'];
    for (const colName of collections) {
        const snapshot = await getDocs(collection(db, 'users', userId, colName));
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
    
    const batch = writeBatch(db);
    if (data.playerProfile) {
        const profileData: any = { ...data.playerProfile, isOnboardingComplete: data.isOnboardingComplete ?? true };
        if (profileData.name) profileData.searchName = profileData.name.trim().toLowerCase();
        if (profileData.email) profileData.searchEmail = profileData.email.trim().toLowerCase();
        batch.set(doc(db, 'users', userId), cleanDataForFirestore(profileData));
    }
    
    for (const [colName, items] of Object.entries(data)) {
        if (Array.isArray(items) && colName !== 'playerProfile') {
            items.forEach(item => {
                const { id, ...rest } = item;
                const docRef = id ? doc(db, 'users', userId, colName, id) : doc(collection(db, 'users', userId, colName));
                batch.set(docRef, cleanDataForFirestore(rest));
            });
        }
    }
    await batch.commit();
};

const createFirebaseCRUD = <T extends { id: string }>(collectionName: string) => ({
    add: async (userId: string, data: T): Promise<void> => {
        const { id, ...rest } = data;
        const cleanedData = cleanDataForFirestore(rest);
        await setDoc(doc(db, 'users', userId, collectionName, id), cleanedData);
    },
    update: async (userId: string, data: T): Promise<void> => {
        const { id, ...rest } = data;
        const cleanedData = cleanDataForFirestore(rest);
        await setDoc(doc(db, 'users', userId, collectionName, id), cleanedData, { merge: true });
    },
    delete: async (userId: string, id: string): Promise<void> => {
        await deleteDoc(doc(db, 'users', userId, collectionName, id));
    },
});

export const matchesService = createFirebaseCRUD<Match>('matches');
export const goalsService = createFirebaseCRUD<Goal>('goals');
export const customAchievementsService = createFirebaseCRUD<CustomAchievement>('customAchievements');
export const aiInteractionsService = createFirebaseCRUD<AIInteraction>('aiInteractions');
export const tournamentsService = createFirebaseCRUD<Tournament>('tournaments');

export const updateProfile = async (userId: string, data: Partial<PlayerProfileData>): Promise<void> => {
    const updateData: any = { ...data };
    if (data.name) updateData.searchName = data.name.trim().toLowerCase();
    if (data.email) updateData.searchEmail = data.email.trim().toLowerCase();
    await setDoc(doc(db, 'users', userId), cleanDataForFirestore(updateData), { merge: true });
};

export const createSharedView = async (payload: any): Promise<string> => {
    const { snapshot, ...metadata } = payload;
    const docRef = await addDoc(collection(db, 'sharedViews'), { ...metadata, data: JSON.stringify(snapshot), createdAt: Timestamp.now() });
    return docRef.id;
};

export const getSharedView = async (shareId: string) => {
    const docSnap = await getDoc(doc(db, 'sharedViews', shareId));
    if (docSnap.exists()) {
        const data = docSnap.data();
        return { snapshot: JSON.parse(data.data), page: data.page, playerProfileName: data.playerProfileName };
    }
    return null;
};

export const searchUsers = async (searchTerm: string, currentUserId: string): Promise<PublicProfile[]> => {
    const usersRef = collection(db, 'users');
    const termLower = searchTerm.trim().toLowerCase();
    
    if (!termLower) return [];

    // Search by normalized email
    const qEmail = query(usersRef, where('searchEmail', '==', termLower));
    
    // Search by normalized name prefix (prefix matching for names)
    const qName = query(usersRef, 
        where('searchName', '>=', termLower), 
        where('searchName', '<=', termLower + '\uf8ff')
    );
    
    const [emailSnap, nameSnap] = await Promise.all([getDocs(qEmail), getDocs(qName)]);
    const results = new Map<string, PublicProfile>();
    
    const processDoc = (docSnap: any) => {
        const data = docSnap.data();
        if (docSnap.id !== currentUserId && data.name) {
            results.set(docSnap.id, { 
                uid: docSnap.id, 
                name: data.name, 
                photo: data.photo, 
                level: data.level || 1 
            });
        }
    }
    
    emailSnap.forEach(processDoc);
    nameSnap.forEach(processDoc);
    
    return Array.from(results.values());
};

export const createFriendship = async (userId1: string, userId2: string, name1: string, name2: string) => {
    const batch = writeBatch(db);
    
    // Update User 1
    batch.update(doc(db, 'users', userId1), { 
        friends: arrayUnion(userId2),
        friendRequestsReceived: arrayRemove(userId2),
        friendRequestsSent: arrayRemove(userId2)
    });
    // Add Notification for User 1
    const notif1Ref = doc(collection(db, 'users', userId1, 'notifications'));
    batch.set(notif1Ref, {
        id: notif1Ref.id,
        date: new Date().toISOString(),
        message: `¡Nueva conexión! Ahora eres amigo de ${name2}.`,
        type: 'social',
        read: false
    });

    // Update User 2
    batch.update(doc(db, 'users', userId2), { 
        friends: arrayUnion(userId1),
        friendRequestsReceived: arrayRemove(userId1),
        friendRequestsSent: arrayRemove(userId1)
    });
    // Add Notification for User 2
    const notif2Ref = doc(collection(db, 'users', userId2, 'notifications'));
    batch.set(notif2Ref, {
        id: notif2Ref.id,
        date: new Date().toISOString(),
        message: `¡Nueva conexión! Ahora eres amigo de ${name1}.`,
        type: 'social',
        read: false
    });

    await batch.commit();
};

export const sendFriendRequest = async (currentUserId: string, targetUserId: string) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', currentUserId), { friendRequestsSent: arrayUnion(targetUserId) });
    batch.update(doc(db, 'users', targetUserId), { friendRequestsReceived: arrayUnion(currentUserId) });
    await batch.commit();
};

export const acceptFriendRequest = async (currentUserId: string, targetUserId: string, currentUserName: string, targetUserName: string) => {
    await createFriendship(currentUserId, targetUserId, currentUserName, targetUserName);
};

export const rejectFriendRequest = async (currentUserId: string, targetUserId: string) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', currentUserId), { friendRequestsReceived: arrayRemove(targetUserId) });
    batch.update(doc(db, 'users', targetUserId), { friendRequestsSent: arrayRemove(currentUserId) });
    await batch.commit();
};

export const fetchPublicProfiles = async (userIds: string[]): Promise<PublicProfile[]> => {
    if (userIds.length === 0) return [];
    const promises = userIds.map(async (uid) => {
        const userDoc = await getDoc(doc(db, 'users', uid));
        return userDoc.exists() ? { uid: userDoc.id, ...userDoc.data() } as PublicProfile : null;
    });
    const profiles = await Promise.all(promises);
    return profiles.filter((p): p is PublicProfile => p !== null);
};

export const sendMessage = async (currentUserId: string, targetUserId: string, text: string) => {
    const chatId = currentUserId < targetUserId ? `${currentUserId}_${targetUserId}` : `${targetUserId}_${currentUserId}`;
    await setDoc(doc(db, 'chats', chatId), { participants: [currentUserId, targetUserId], lastMessage: text, lastMessageTimestamp: Timestamp.now() }, { merge: true });
    await addDoc(collection(db, 'chats', chatId, 'messages'), { senderId: currentUserId, text, timestamp: Timestamp.now(), read: false });
};

export const subscribeToMessages = (currentUserId: string, targetUserId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe => {
    const chatId = currentUserId < targetUserId ? `${currentUserId}_${targetUserId}` : `${targetUserId}_${currentUserId}`;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...convertTimestampsToISO(doc.data()), id: doc.id })) as ChatMessage[]);
    });
};
