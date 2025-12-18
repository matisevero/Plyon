
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import type { 
    Match, Goal, CustomAchievement, AIInteraction, PlayerProfileData, Tournament,
    Page, Notification, PublicProfile, WorldCupStage, ConfederationName, WorldCupCampaignHistory, QualifiersCampaignHistory
} from '../types';
import { initialData as appInitialData } from '../data/initialData';
import { useAuth } from './AuthContext';
import * as firebaseService from '../services/firebaseService';
import { UserData } from '../services/firebaseService';
import { v4 as uuidv4 } from 'uuid';
import { CONFEDERATIONS, generateQualifiersStandings, parseLocalDate, getLocalDateString } from '../utils/analytics';

interface SyncState {
    status: 'LOCAL' | 'SYNCED' | 'SYNCING_UP' | 'SYNCING_DOWN' | 'ERROR' | 'LOADING' | 'READ_ONLY';
    lastSynced?: Date;
    error?: string;
}

interface DataContextType {
    matches: Match[];
    goals: Goal[];
    customAchievements: CustomAchievement[];
    aiInteractions: AIInteraction[];
    tournaments: Tournament[];
    availableTournaments: string[];
    playerProfile: PlayerProfileData;
    isOnboardingComplete: boolean;
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    loading: boolean;
    syncState: SyncState;
    dataConflict: boolean;
    isReadOnly: boolean;
    isShareMode: boolean;
    
    // Actions
    addMatch: (match: Omit<Match, 'id'>) => Promise<Match>;
    updateMatch: (match: Match) => Promise<void>;
    deleteMatch: (id: string) => Promise<void>;
    addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    addCustomAchievement: (achievement: Omit<CustomAchievement, 'id'>) => Promise<void>;
    deleteCustomAchievement: (id: string) => Promise<void>;
    addAIInteraction: (type: AIInteraction['type'], content: any) => Promise<void>;
    updateTournament: (tournament: Tournament) => Promise<void>;
    deleteTournament: (id: string) => Promise<void>;
    updatePlayerProfile: (data: Partial<PlayerProfileData>) => Promise<void>;
    completeOnboarding: (name: string, type: 'fresh' | 'demo') => Promise<void>;
    
    // Features
    importMatchesFromAI: (matches: Partial<Match>[]) => Promise<void>;
    importJsonData: (json: string) => Promise<void>;
    importCsvData: (csv: string) => Promise<void>;
    resetApp: () => Promise<void>;
    
    // World Cup
    startNewWorldCupCampaign: () => Promise<void>;
    addWorldCupMatch: (match: Omit<Match, 'id'>) => Promise<Match>;
    addQualifiersMatch: (match: Omit<Match, 'id'>) => Promise<Match>;
    abandonWorldCupCampaign: () => Promise<void>;
    abandonQualifiers: () => Promise<void>;
    startWorldCupFromQualification: () => Promise<void>;
    startWorldCupFromSelection: () => Promise<void>;
    startNewQualifiersCampaign: (confederation: ConfederationName) => Promise<void>;
    clearChampionCampaign: () => Promise<void>;
    
    // Notifications
    notifications: Notification[];
    hasUnreadNotifications: boolean;
    addNotification: (message: string, type?: string) => void;
    markNotificationsAsRead: () => void;
    
    // Misc
    forceSync: () => void;
    resolveConflict: (choice: 'local' | 'cloud') => Promise<void>;
    generateShareLink: (page: string, filters?: any) => Promise<string>;
    checkAILimit: () => void;
    aiUsageCount: number;
    AI_MONTHLY_LIMIT: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode; initialData?: any; readOnlyMode?: boolean }> = ({ children, initialData: sharedData, readOnlyMode = false }) => {
    const { user } = useAuth();
    const [matches, setMatches] = useState<Match[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [customAchievements, setCustomAchievements] = useState<CustomAchievement[]>([]);
    const [aiInteractions, setAiInteractions] = useState<AIInteraction[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [playerProfile, setPlayerProfile] = useState<PlayerProfileData>(appInitialData.playerProfile);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
    const [currentPage, setCurrentPage] = useState<Page>('recorder');
    const [loading, setLoading] = useState(true);
    const [syncState, setSyncState] = useState<SyncState>({ status: 'LOADING' });
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [aiUsageCount, setAiUsageCount] = useState(0);
    
    const AI_MONTHLY_LIMIT = 50;

    const availableTournaments = useMemo(() => tournaments.map(t => t.name), [tournaments]);

    const readLocalData = useCallback((): UserData => {
        try {
            const localProfile = JSON.parse(localStorage.getItem('playerProfile_local') || JSON.stringify(appInitialData.playerProfile));
            const data: UserData = {
                matches: JSON.parse(localStorage.getItem('matches_local') || '[]'),
                goals: JSON.parse(localStorage.getItem('goals_local') || '[]'),
                customAchievements: JSON.parse(localStorage.getItem('customAchievements_local') || '[]'),
                aiInteractions: JSON.parse(localStorage.getItem('aiInteractions_local') || '[]'),
                tournaments: JSON.parse(localStorage.getItem('tournaments_local') || JSON.stringify(appInitialData.tournaments)),
                playerProfile: localProfile,
                isOnboardingComplete: JSON.parse(localStorage.getItem('isOnboardingComplete_local') || 'false'),
            };
            return data;
        } catch {
            return { ...appInitialData, isOnboardingComplete: false };
        }
    }, []);

    const saveLocalData = useCallback((data: Partial<UserData>) => {
        if (data.matches) localStorage.setItem('matches_local', JSON.stringify(data.matches));
        if (data.goals) localStorage.setItem('goals_local', JSON.stringify(data.goals));
        if (data.customAchievements) localStorage.setItem('customAchievements_local', JSON.stringify(data.customAchievements));
        if (data.aiInteractions) localStorage.setItem('aiInteractions_local', JSON.stringify(data.aiInteractions));
        if (data.tournaments) localStorage.setItem('tournaments_local', JSON.stringify(data.tournaments));
        if (data.playerProfile) localStorage.setItem('playerProfile_local', JSON.stringify(data.playerProfile));
        if (data.isOnboardingComplete !== undefined) localStorage.setItem('isOnboardingComplete_local', JSON.stringify(data.isOnboardingComplete));
    }, []);

    useEffect(() => {
        const initData = async () => {
            if (readOnlyMode && sharedData) {
                setMatches(sharedData.matches || []);
                setTournaments(sharedData.tournaments || []);
                setPlayerProfile(sharedData.playerProfile || appInitialData.playerProfile);
                setIsOnboardingComplete(true);
                setSyncState({ status: 'READ_ONLY' });
                setLoading(false);
                return;
            }

            if (user) {
                setSyncState({ status: 'SYNCING_DOWN' });
                try {
                    const cloud = await firebaseService.getOneTimeUserData(user.uid);
                    if (cloud) {
                        setMatches(cloud.matches);
                        setGoals(cloud.goals);
                        setCustomAchievements(cloud.customAchievements);
                        setAiInteractions(cloud.aiInteractions);
                        setTournaments(cloud.tournaments);
                        setPlayerProfile(cloud.playerProfile);
                        setIsOnboardingComplete(cloud.isOnboardingComplete);
                        saveLocalData(cloud);
                        const unsubscribe = firebaseService.subscribeToUserData(user.uid, (data) => {
                            setMatches(data.matches);
                            setGoals(data.goals);
                            setCustomAchievements(data.customAchievements);
                            setPlayerProfile(data.playerProfile);
                            setIsOnboardingComplete(data.isOnboardingComplete);
                            saveLocalData(data);
                        });
                        setSyncState({ status: 'SYNCED', lastSynced: new Date() });
                        setLoading(false);
                        return () => unsubscribe();
                    } else {
                        const local = readLocalData();
                        await firebaseService.overwriteCloudData(user.uid, local);
                        setMatches(local.matches);
                        setPlayerProfile(local.playerProfile);
                        setIsOnboardingComplete(local.isOnboardingComplete);
                        setLoading(false);
                    }
                } catch (e) {
                    const local = readLocalData();
                    setMatches(local.matches);
                    setPlayerProfile(local.playerProfile);
                    setIsOnboardingComplete(local.isOnboardingComplete);
                    setLoading(false);
                }
            } else {
                const local = readLocalData();
                setMatches(local.matches);
                setPlayerProfile(local.playerProfile);
                setIsOnboardingComplete(local.isOnboardingComplete);
                setSyncState({ status: 'LOCAL' });
                setLoading(false);
            }
        };
        initData();
    }, [user, readOnlyMode]);

    const completeOnboarding = async (name: string, type: 'fresh' | 'demo') => {
        const newProfile = { 
            ...playerProfile, 
            name, 
            email: user?.email || '', 
            friends: [], 
            friendRequestsSent: [], 
            friendRequestsReceived: [] 
        };
        let newMatches: Match[] = [];
        
        if (type === 'demo') {
            const today = getLocalDateString();
            newMatches = [
                { id: uuidv4(), date: today, result: 'VICTORIA', myGoals: 2, myAssists: 1, goalDifference: 2, tournament: 'Liga de los Martes' },
            ];
        }

        // 1. Guardar localmente
        setPlayerProfile(newProfile);
        setMatches(newMatches);
        setIsOnboardingComplete(true);
        saveLocalData({ playerProfile: newProfile, matches: newMatches, isOnboardingComplete: true });

        // 2. Persistir en Nube si hay usuario
        if (user) {
            await firebaseService.updateProfile(user.uid, newProfile);
            await firebaseService.overwriteCloudData(user.uid, {
                playerProfile: newProfile,
                matches: newMatches,
                isOnboardingComplete: true,
                tournaments: tournaments.length > 0 ? tournaments : appInitialData.tournaments
            });
        }
    };

    const addMatch = async (matchData: Omit<Match, 'id'>) => {
        const newMatch = { ...matchData, id: uuidv4() };
        if (user) await firebaseService.matchesService.add(user.uid, newMatch as Match);
        return newMatch as Match;
    };

    const updateMatch = async (match: Match) => {
        if (user) await firebaseService.matchesService.update(user.uid, match);
    };

    const deleteMatch = async (id: string) => {
        if (user) await firebaseService.matchesService.delete(user.uid, id);
    };

    const updatePlayerProfile = async (data: Partial<PlayerProfileData>) => {
        const updatedProfile = { ...playerProfile, ...data };
        setPlayerProfile(updatedProfile);
        if (user) await firebaseService.updateProfile(user.uid, data);
    };

    const addNotification = (message: string, type: string = 'info') => {
        const newNotif: Notification = {
            id: uuidv4(),
            date: new Date().toISOString(),
            message,
            type,
            read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    const markNotificationsAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const value = {
        matches, goals: [], customAchievements: [], aiInteractions: [], tournaments, availableTournaments, playerProfile, isOnboardingComplete,
        currentPage, setCurrentPage, loading, syncState, dataConflict: false, isReadOnly: readOnlyMode, isShareMode: readOnlyMode,
        addMatch, updateMatch, deleteMatch, addGoal: async() => {}, deleteGoal: async() => {}, addCustomAchievement: async() => {}, deleteCustomAchievement: async() => {},
        addAIInteraction: async() => {}, updateTournament: async() => {}, deleteTournament: async() => {}, updatePlayerProfile, completeOnboarding,
        importMatchesFromAI: async () => {}, importJsonData: async () => {}, importCsvData: async () => {}, resetApp: async () => {},
        startNewWorldCupCampaign: async () => {}, addWorldCupMatch: async () => ({} as Match), addQualifiersMatch: async () => ({} as Match), abandonWorldCupCampaign: async () => {}, abandonQualifiers: async () => {},
        startWorldCupFromQualification: async () => {}, startWorldCupFromSelection: async () => {}, startNewQualifiersCampaign: async () => {}, clearChampionCampaign: async () => {},
        notifications, hasUnreadNotifications: notifications.some(n => !n.read), addNotification, markNotificationsAsRead,
        forceSync: () => {}, resolveConflict: async () => {}, generateShareLink: async () => '', checkAILimit: () => {}, aiUsageCount, AI_MONTHLY_LIMIT
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("useData must be used within a DataProvider");
    return context;
};
