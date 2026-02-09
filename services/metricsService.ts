import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface DashboardMetrics {
  totalUsers: number;
  newUsersToday: number;
  totalMatches: number;
  activeUsersWeek: number;
}

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    // Total usuarios
    const usersSnap = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnap.size;

    // Nuevos usuarios hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    
    const newUsersQuery = query(
      collection(db, 'users'),
      where('createdAt', '>=', todayTimestamp)
    );
    const newUsersSnap = await getDocs(newUsersQuery);
    const newUsersToday = newUsersSnap.size;

    // Total partidos
    const matchesSnap = await getDocs(collection(db, 'matches'));
    const totalMatches = matchesSnap.size;

    // Usuarios activos última semana
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoTimestamp = Timestamp.fromDate(weekAgo);
    
    const activeUsersQuery = query(
      collection(db, 'users'),
      where('lastLogin', '>=', weekAgoTimestamp)
    );
    const activeUsersSnap = await getDocs(activeUsersQuery);
    const activeUsersWeek = activeUsersSnap.size;

    return {
      totalUsers,
      newUsersToday,
      totalMatches,
      activeUsersWeek
    };
  } catch (error) {
    console.error('Error getting metrics:', error);
    return {
      totalUsers: 0,
      newUsersToday: 0,
      totalMatches: 0,
      activeUsersWeek: 0
    };
  }
};
