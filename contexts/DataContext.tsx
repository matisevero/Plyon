
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Match, Goal, CustomAchievement, AIInteraction, PlayerProfileData, Tournament, Notification, FriendRequest, PendingMatch, SocialActivity } from '../types';
import { initialData } from '../data/initialData';
import { useAuth } from './AuthContext';
import * as firebaseService from '../services/firebaseService';
import { CONFEDERATIONS, calculateHistoricalRecords, generateQualifiersStandings } from '../utils/analytics';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase/config'; // Importar db para verificar si existe

interface DataContextType {
  matches: Match[];
  goals: Goal[];
  customAchievements: CustomAchievement[];
  aiInteractions: AIInteraction[];
  tournaments: Tournament[];
  playerProfile: PlayerProfileData;
  isOnboardingComplete: boolean;
  completeOnboarding: (name: string, type: 'fresh' | 'demo') => Promise<void>;
  addMatch: (match: Omit<Match, 'id'>) => Promise<Match>;
  updateMatch: (match: Match) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  deleteGoal: (id: string) => Promise<void>;
  addCustomAchievement: (achievement: Omit<CustomAchievement, 'id'>) => void;
  deleteCustomAchievement: (id: string) => Promise<void>;
  addAIInteraction: (type: string, content: any) => Promise<void>;
  addTournament: (name: string) => void;
  updateTournament: (tournament: Tournament) => void;
  deleteTournament: (id: string) => Promise<void>;
  updatePlayerProfile: (data: Partial<PlayerProfileData>) => Promise<void>;
  importJsonData: (json: string) => Promise<void>;
  importCsvData: (csv: string) => Promise<void>;
  importMatchesFromAI: (matches: Partial<Match>[]) => Promise<void>;
  checkAILimit: () => void;
  aiUsageCount: number;
  AI_MONTHLY_LIMIT: number;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  resetApp: () => Promise<void>;
  syncState: { status: 'SYNCED' | 'SYNCING_UP' | 'SYNCING_DOWN' | 'ERROR' | 'LOCAL' | 'LOADING' | 'READ_ONLY', error?: string };
  forceSync: () => void;
  isReadOnly: boolean;
  isShareMode: boolean;
  loading: boolean;
  notifications: Notification[];
  pendingMatches: PendingMatch[];
  friendRequests: FriendRequest[];
  hasUnreadNotifications: boolean;
  markNotificationsAsRead: () => void;
  clearAllNotifications: () => Promise<void>;
  confirmPendingMatch: (match: PendingMatch, action: 'accept' | 'reject', overriddenData?: Match) => Promise<void>;
  respondToFriendRequest: (requestId: string, action: 'accept' | 'reject') => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  generateShareLink: (page: string, filters?: any) => Promise<string>;
  startNewWorldCupCampaign: () => Promise<void>;
  abandonQualifiers: () => Promise<void>;
  abandonWorldCupCampaign: () => Promise<void>;
  startWorldCupFromQualification: () => Promise<void>;
  startNewQualifiersCampaign: (conf: any) => Promise<void>;
  clearChampionCampaign: () => Promise<void>;
  addWorldCupMatch: (matchData: Omit<Match, 'id'>) => Promise<Match>;
  addQualifiersMatch: (matchData: Omit<Match, 'id'>) => Promise<Match>;
  resolveConflict: (choice: 'local' | 'cloud') => Promise<void>;
  dataConflict: boolean;
  requestNotificationPermission: () => Promise<void>;
  availableTournaments: string[];
  addNotification: (message: string) => void;
  recalculateStats: () => Promise<void>;
  activeRecapData: any | null; // Nuevo estado
  openSeasonRecap: (data: any) => void; // Nueva función
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode; initialData?: any; readOnlyMode?: boolean }> = ({ children, initialData: propData, readOnlyMode = false }) => {
  const { user } = useAuth();
  
  const [matches, setMatches] = useLocalStorage<Match[]>('matches', initialData.matches);
  const [goals, setGoals] = useLocalStorage<Goal[]>('goals', initialData.goals);
  const [customAchievements, setCustomAchievements] = useLocalStorage<CustomAchievement[]>('customAchievements', initialData.customAchievements);
  const [aiInteractions, setAiInteractions] = useLocalStorage<AIInteraction[]>('aiInteractions', initialData.aiInteractions);
  const [tournaments, setTournaments] = useLocalStorage<Tournament[]>('tournaments', initialData.tournaments);
  const [playerProfile, setPlayerProfile] = useLocalStorage<PlayerProfileData>('playerProfile', initialData.playerProfile);
  const [isOnboardingComplete, setIsOnboardingComplete] = useLocalStorage<boolean>('isOnboardingComplete', false);
  const [currentPage, setCurrentPage] = useState('recorder');
  
  // Nuevo estado para el Recap
  const [activeRecapData, setActiveRecapData] = useState<any | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [syncState, setSyncState] = useState<{ status: 'SYNCED' | 'SYNCING_UP' | 'SYNCING_DOWN' | 'ERROR' | 'LOCAL' | 'LOADING' | 'READ_ONLY', error?: string }>({ status: 'LOCAL' });
  const [dataConflict, setDataConflict] = useState(false);

  const availableTournaments = tournaments.map(t => t.name);
  const hasUnreadNotifications = notifications.some(n => !n.read) || pendingMatches.length > 0 || friendRequests.length > 0;
  const aiUsageCount = aiInteractions.length;
  const AI_MONTHLY_LIMIT = 50;

  useEffect(() => {
    if (readOnlyMode) {
        if (propData) {
            setMatches(propData.matches || []);
            setGoals(propData.goals || []);
            setCustomAchievements(propData.customAchievements || []);
            setAiInteractions(propData.aiInteractions || []);
            setTournaments(propData.tournaments || []);
            setPlayerProfile(propData.playerProfile || initialData.playerProfile);
            setSyncState({ status: 'READ_ONLY' });
        }
        return;
    }

    if (!user || !db) {
        setSyncState({ status: 'LOCAL' });
        setNotifications([]);
        setPendingMatches([]);
        setFriendRequests([]);
        return;
    }

    setSyncState({ status: 'LOADING' });

    try {
        // --- AUTO REPAIR START ---
        // Automatically check and fix user data consistency on load (silent operation)
        firebaseService.ensureProfileConsistency(user.uid);
        // --- AUTO REPAIR END ---

        const unsubscribeUser = firebaseService.subscribeToUserData(user.uid, (data) => {
            if (data.matches) setMatches(data.matches);
            if (data.goals) setGoals(data.goals);
            if (data.customAchievements) setCustomAchievements(data.customAchievements);
            if (data.aiInteractions) setAiInteractions(data.aiInteractions);
            if (data.tournaments) setTournaments(data.tournaments);
            if (data.playerProfile) setPlayerProfile(data.playerProfile);
            if (data.isOnboardingComplete !== undefined) setIsOnboardingComplete(data.isOnboardingComplete);
            setSyncState({ status: 'SYNCED' });
        });

        const unsubscribeNotifs = firebaseService.subscribeToNotifications(user.uid, (notifs) => {
            setNotifications(notifs);
        });

        const unsubscribeRequests = firebaseService.getIncomingFriendRequests(user.uid, (requests) => {
            setFriendRequests(requests);
        });

        const unsubscribePendingMatches = firebaseService.getPendingMatches(user.uid, (matches) => {
            setPendingMatches(matches);
        });

        return () => {
            unsubscribeUser();
            unsubscribeNotifs();
            unsubscribeRequests();
            unsubscribePendingMatches();
        };
    } catch (err: any) {
        console.error("Error subscribing to data:", err);
        setSyncState({ status: 'ERROR', error: err.message });
    }
  }, [user, readOnlyMode, propData]);

  const completeOnboarding = async (name: string, type: 'fresh' | 'demo') => {
      setPlayerProfile(prev => ({ ...prev, name }));
      setIsOnboardingComplete(true);
      if (user && db) await firebaseService.updateProfile(user.uid, { name });
  };

  const addMatch = async (matchData: Omit<Match, 'id'>): Promise<Match> => {
      const newMatch = { ...matchData, id: uuidv4() };
      setMatches(prev => [newMatch, ...prev]);
      
      if (playerProfile.stats) {
          const stats = { ...playerProfile.stats };
          stats.totalMatches++;
          stats.goalsFor += newMatch.myGoals;
          stats.assists += newMatch.myAssists;
          if (newMatch.result === 'VICTORIA') stats.wins++;
          else if (newMatch.result === 'EMPATE') stats.draws++;
          else stats.losses++;
          setPlayerProfile(prev => ({ ...prev, stats }));
      }

      if (user && db) {
          await firebaseService.matchesService.add(user.uid, newMatch);
          if (newMatch.myGoals >= 3 || (newMatch.myGoals + newMatch.myAssists >= 5)) {
              await firebaseService.addActivity({
                  userId: user.uid,
                  userName: playerProfile.name,
                  userPhoto: playerProfile.photo,
                  type: 'match',
                  title: `¡Actuación estelar! 🌟`,
                  description: `${playerProfile.name} anotó ${newMatch.myGoals} goles y dio ${newMatch.myAssists} asistencias en su último partido.`
              });
          }
      }
      return newMatch;
  };

  const updateMatch = async (match: Match) => {
      setMatches(prev => prev.map(m => m.id === match.id ? match : m));
      if (user && db) await firebaseService.matchesService.update(user.uid, match);
  };

  const deleteMatch = async (id: string) => {
      const matchToDelete = matches.find(m => m.id === id);
      setMatches(prev => prev.filter(m => m.id !== id));
      
      if (matchToDelete && playerProfile.stats) {
          const stats = { ...playerProfile.stats };
          stats.totalMatches = Math.max(0, stats.totalMatches - 1);
          stats.goalsFor = Math.max(0, stats.goalsFor - matchToDelete.myGoals);
          stats.assists = Math.max(0, stats.assists - matchToDelete.myAssists);
          if (matchToDelete.result === 'VICTORIA') stats.wins = Math.max(0, stats.wins - 1);
          else if (matchToDelete.result === 'EMPATE') stats.draws = Math.max(0, stats.draws - 1);
          else stats.losses = Math.max(0, stats.losses - 1);
          setPlayerProfile(prev => ({ ...prev, stats }));
      }

      if (user && db) await firebaseService.matchesService.delete(user.uid, id);
  };

  const addGoal = (goal: Omit<Goal, 'id'>) => {
      const newGoal = { ...goal, id: uuidv4() };
      setGoals(prev => [...prev, newGoal]);
      if (user && db) firebaseService.overwriteCloudData(user.uid, { matches, goals: [...goals, newGoal], customAchievements, aiInteractions, tournaments, playerProfile, isOnboardingComplete });
  };

  const deleteGoal = async (id: string) => {
      const newGoals = goals.filter(g => g.id !== id);
      setGoals(newGoals);
      if (user && db) firebaseService.overwriteCloudData(user.uid, { matches, goals: newGoals, customAchievements, aiInteractions, tournaments, playerProfile, isOnboardingComplete });
  };

  const addCustomAchievement = (ach: Omit<CustomAchievement, 'id'>) => {
      const newAch = { ...ach, id: uuidv4() };
      setCustomAchievements(prev => [...prev, newAch]);
      if (user && db) firebaseService.overwriteCloudData(user.uid, { matches, goals, customAchievements: [...customAchievements, newAch], aiInteractions, tournaments, playerProfile, isOnboardingComplete });
  };

  const deleteCustomAchievement = async (id: string) => {
      const newAchs = customAchievements.filter(a => a.id !== id);
      setCustomAchievements(newAchs);
      if (user && db) firebaseService.overwriteCloudData(user.uid, { matches, goals, customAchievements: newAchs, aiInteractions, tournaments, playerProfile, isOnboardingComplete });
  };

  const addAIInteraction = async (type: string, content: any) => {
      const interaction = { id: uuidv4(), type: type as any, content, date: new Date().toISOString() };
      setAiInteractions(prev => [interaction, ...prev]);
      if (user && db) await firebaseService.addAIInteraction(user.uid, interaction);
  };

  const addTournament = (name: string) => {
      const newT = { id: uuidv4(), name, matchDuration: 90, playersPerSide: 11, icon: '🏆', color: '#000' };
      setTournaments(prev => [...prev, newT]);
      if (user && db) firebaseService.overwriteCloudData(user.uid, { matches, goals, customAchievements, aiInteractions, tournaments: [...tournaments, newT], playerProfile, isOnboardingComplete });
  };

  const updateTournament = (t: Tournament) => {
      const newTournaments = tournaments.map(old => old.id === t.id ? t : old);
      setTournaments(newTournaments);
      if (user && db) firebaseService.overwriteCloudData(user.uid, { matches, goals, customAchievements, aiInteractions, tournaments: newTournaments, playerProfile, isOnboardingComplete });
  };

  const deleteTournament = async (id: string) => {
      const newTournaments = tournaments.filter(t => t.id !== id);
      setTournaments(newTournaments);
      if (user && db) firebaseService.overwriteCloudData(user.uid, { matches, goals, customAchievements, aiInteractions, tournaments: newTournaments, playerProfile, isOnboardingComplete });
  };

  const updatePlayerProfile = async (data: Partial<PlayerProfileData>) => {
      setPlayerProfile(prev => ({ ...prev, ...data }));
      if (user && db) await firebaseService.updateProfile(user.uid, data);
  };

  const importJsonData = async (json: string) => {
      const data = JSON.parse(json);
      if (!data.matches) throw new Error("Formato inválido");
      setMatches(data.matches);
      setGoals(data.goals || []);
      setCustomAchievements(data.customAchievements || []);
      setAiInteractions(data.aiInteractions || []);
      setTournaments(data.tournaments || []);
      setPlayerProfile(data.playerProfile || initialData.playerProfile);
      if (user && db) await firebaseService.overwriteCloudData(user.uid, data);
  };

  const importCsvData = async (csv: string) => {
      console.log("CSV import not fully implemented in this demo");
  };

  const importMatchesFromAI = async (newMatches: Partial<Match>[]) => {
      const completeMatches = newMatches.map(m => ({
          id: uuidv4(),
          date: m.date || new Date().toISOString().split('T')[0],
          result: m.result || 'VICTORIA',
          myGoals: m.myGoals || 0,
          myAssists: m.myAssists || 0,
          goalDifference: m.goalDifference || (m.result === 'VICTORIA' ? 1 : m.result === 'DERROTA' ? -1 : 0),
          notes: m.notes || '',
          tournament: m.tournament || ''
      } as Match));
      setMatches(prev => [...completeMatches, ...prev]);
      if (user && db) {
          for (const m of completeMatches) {
              await firebaseService.matchesService.add(user.uid, m);
          }
      }
  };

  const checkAILimit = () => {
      if (aiUsageCount >= AI_MONTHLY_LIMIT) throw new Error("Has alcanzado el límite mensual de uso de IA.");
  };

  const resetApp = async () => {
      setMatches(initialData.matches);
      setGoals(initialData.goals);
      setCustomAchievements(initialData.customAchievements);
      setAiInteractions(initialData.aiInteractions);
      setTournaments(initialData.tournaments);
      setPlayerProfile(initialData.playerProfile);
      setIsOnboardingComplete(false);
      setCurrentPage('recorder');
      if (user && db) await firebaseService.overwriteCloudData(user.uid, initialData as any);
  };

  const forceSync = () => {
      if (user && db) {
          firebaseService.getOneTimeUserData(user.uid).then(data => {
              if (data) {
                  setMatches(data.matches);
              }
          });
      }
  };

  const markNotificationsAsRead = async () => {
      if (!user || !db) return;
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      try {
          await firebaseService.markAllNotificationsRead(user.uid, unreadIds);
      } catch (error) {
          console.error("Error marking notifications as read:", error);
      }
  };

  const clearAllNotifications = async () => {
      if (!user || !db) return;
      for (const n of notifications) {
          await firebaseService.deleteNotification(user.uid, n.id);
      }
      setNotifications([]);
  };

  const confirmPendingMatch = async (match: PendingMatch, action: 'accept' | 'reject', overriddenData?: Match) => {
      if (!user || !db) return;
      await firebaseService.resolvePendingMatch(match, action, overriddenData);
      setPendingMatches(prev => prev.filter(p => p.id !== match.id));
  };

  const respondToFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
      if (!db) return;
      await firebaseService.respondToFriendRequest(requestId, action);
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const deleteNotification = async (id: string) => {
      if (user && db) await firebaseService.deleteNotification(user.uid, id);
      setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const generateShareLink = async (page: string, filters?: any) => {
      if (!user || !db) throw new Error("Debes iniciar sesión para compartir.");
      const snapshot = {
          matches, goals, customAchievements, playerProfile, tournaments
      };
      const shareId = await firebaseService.createSharedView(snapshot, page, filters);
      return `${window.location.origin}/?shareId=${shareId}`;
  };

  const startNewWorldCupCampaign = async () => {
      const newCampaign: any = {
          campaignNumber: (playerProfile.worldCupHistory?.length || 0) + 1,
          currentStage: 'group',
          startDate: new Date().toISOString(),
          groupStage: { matchesPlayed: 0, points: 0 },
          completedStages: [],
          matchesByStage: {}
      };
      await updatePlayerProfile({ activeWorldCupMode: 'campaign', worldCupProgress: newCampaign });
  };

  const abandonQualifiers = async () => {
      if (!playerProfile.qualifiersProgress) return;
      const history = {
          campaignNumber: playerProfile.qualifiersProgress.campaignNumber,
          confederation: playerProfile.qualifiersProgress.confederation,
          finalPosition: 99,
          status: 'abandoned',
          points: playerProfile.qualifiersProgress.points,
          record: playerProfile.qualifiersProgress.record,
          startDate: playerProfile.qualifiersProgress.startDate,
          endDate: new Date().toISOString()
      };
      await updatePlayerProfile({ 
          activeWorldCupMode: null as any, 
          qualifiersProgress: null,
          qualifiersHistory: [...(playerProfile.qualifiersHistory || []), history as any]
      });
  };

  const abandonWorldCupCampaign = async () => {
      if (!playerProfile.worldCupProgress) return;
      const history = {
          campaignNumber: playerProfile.worldCupProgress.campaignNumber,
          finalStage: 'abandoned',
          status: 'abandoned',
          startDate: playerProfile.worldCupProgress.startDate,
          endDate: new Date().toISOString(),
          results: []
      };
      await updatePlayerProfile({ 
          activeWorldCupMode: null as any, 
          worldCupProgress: null,
          worldCupHistory: [...(playerProfile.worldCupHistory || []), history as any]
      });
  };

  const startWorldCupFromQualification = async () => {
      const newCampaign: any = {
          campaignNumber: (playerProfile.worldCupHistory?.length || 0) + 1,
          currentStage: 'group',
          startDate: new Date().toISOString(),
          groupStage: { matchesPlayed: 0, points: 0 },
          completedStages: [],
          matchesByStage: {},
          isQualified: true
      };
      await updatePlayerProfile({ 
          activeWorldCupMode: 'campaign', 
          worldCupProgress: newCampaign,
          qualifiersProgress: null, 
          worldCupAttempts: Math.max(0, (playerProfile.worldCupAttempts || 0) - 1)
      });
  };

  const startNewQualifiersCampaign = async (conf: string) => {
      const confData = CONFEDERATIONS[conf];
      let selectedGroup = [];
      if (confData.simulationType === 'groups') {
          const allTeams = [...confData.teams];
          const shuffled = allTeams.sort(() => 0.5 - Math.random());
          selectedGroup = shuffled.slice(0, 5);
      }
      const newCampaign: any = {
          campaignNumber: (playerProfile.qualifiersHistory?.length || 0) + 1,
          confederation: conf,
          matchesPlayed: 0,
          points: 0,
          record: { wins: 0, draws: 0, losses: 0 },
          goalDifference: 0,
          completedMatches: [],
          status: 'active',
          startDate: new Date().toISOString(),
          group: selectedGroup
      };
      await updatePlayerProfile({ activeWorldCupMode: 'qualifiers', qualifiersProgress: newCampaign });
  };

  const clearChampionCampaign = async () => {
      if (user && db) {
          await firebaseService.addActivity({
              userId: user.uid,
              userName: playerProfile.name,
              userPhoto: playerProfile.photo,
              type: 'campaign_milestone',
              title: `🏆 ¡CAMPEÓN DEL MUNDO!`,
              description: `${playerProfile.name} acaba de ganar la Copa del Mundo tras una campaña épica.`
          });
      }
      await updatePlayerProfile({ 
          activeWorldCupMode: null as any, 
          worldCupProgress: null,
          worldCupHistory: [...(playerProfile.worldCupHistory || []), {
              campaignNumber: playerProfile.worldCupProgress!.campaignNumber,
              finalStage: 'final',
              status: 'champion',
              startDate: playerProfile.worldCupProgress!.startDate,
              endDate: new Date().toISOString(),
              results: ['VICTORIA'],
              isQualified: playerProfile.worldCupProgress!.isQualified
          }]
      });
  };

  const addWorldCupMatch = async (matchData: Omit<Match, 'id'>) => {
      const isQualified = playerProfile.worldCupProgress?.isQualified || false;
      const multiplier = isQualified ? 10 : 2; 
      const result = matchData.result;
      const basePts = result === 'VICTORIA' ? 3 : result === 'EMPATE' ? 1 : 0;
      const earnedPoints = basePts * multiplier;
      const tournamentName = isQualified ? 'Copa Mundial (Élite)' : 'Copa Mundial';
      
      if (!availableTournaments.includes(tournamentName)) {
          addTournament(tournamentName);
      }

      const match = await addMatch({ 
          ...matchData, 
          matchMode: 'world-cup',
          earnedPoints,
          tournament: tournamentName
      });
      if (!playerProfile.worldCupProgress) return match;
      const progress = { ...playerProfile.worldCupProgress };
      if (progress.currentStage === 'group') {
          progress.groupStage.matchesPlayed += 1;
          progress.groupStage.points += basePts;
          if (!progress.matchesByStage.group) progress.matchesByStage.group = [];
          progress.matchesByStage.group.push(match);
          if (progress.groupStage.points >= 5) { 
              progress.completedStages.push('group'); 
              progress.currentStage = 'round_of_16'; 
              await updatePlayerProfile({ careerPoints: (playerProfile.careerPoints || 0) + (progress.isQualified ? 50 : 10) }); 
          } else if (progress.groupStage.matchesPlayed === 3) {
                await updatePlayerProfile({ 
                    activeWorldCupMode: null as any, worldCupProgress: null, 
                    worldCupHistory: [...(playerProfile.worldCupHistory || []), { 
                        campaignNumber: progress.campaignNumber, finalStage: 'eliminated_group', status: 'eliminated', 
                        startDate: progress.startDate, endDate: new Date().toISOString(), results: [...(progress.matchesByStage.group?.map(m => m.result) || [])],
                        isQualified: progress.isQualified
                    }] 
                });
                return match;
          }
      } else {
          if (!progress.matchesByStage[progress.currentStage]) progress.matchesByStage[progress.currentStage] = [];
          progress.matchesByStage[progress.currentStage].push(match);
          if (result === 'VICTORIA') {
              progress.completedStages.push(progress.currentStage);
              await updatePlayerProfile({ careerPoints: (playerProfile.careerPoints || 0) + (progress.isQualified ? 30 : 5) }); 
              if (progress.currentStage === 'round_of_16') progress.currentStage = 'quarter_finals';
              else if (progress.currentStage === 'quarter_finals') progress.currentStage = 'semi_finals';
              else if (progress.currentStage === 'semi_finals') progress.currentStage = 'final';
              else if (progress.currentStage === 'final') { 
                  progress.championOfCampaign = true;
                  await updatePlayerProfile({ careerPoints: (playerProfile.careerPoints || 0) + (progress.isQualified ? 1000 : 100) }); 
              }
          } else {
                await updatePlayerProfile({ 
                    activeWorldCupMode: null as any, worldCupProgress: null, 
                    worldCupHistory: [...(playerProfile.worldCupHistory || []), { 
                        campaignNumber: progress.campaignNumber, finalStage: progress.currentStage, status: 'eliminated', 
                        startDate: progress.startDate, endDate: new Date().toISOString(), results: [],
                        isQualified: progress.isQualified
                    }] 
                });
                return match;
          }
      }
      await updatePlayerProfile({ worldCupProgress: progress });
      return match;
  };

  const addQualifiersMatch = async (matchData: Omit<Match, 'id'>) => {
      let earnedPoints = 0;
      let tournamentName = 'Eliminatorias';
      if (playerProfile.qualifiersProgress) {
          const conf = CONFEDERATIONS[playerProfile.qualifiersProgress.confederation];
          const multiplier = conf?.pointsMultiplier || 2;
          const result = matchData.result;
          const basePts = result === 'VICTORIA' ? 3 : result === 'EMPATE' ? 1 : 0;
          earnedPoints = basePts * multiplier;
          tournamentName = `Elim. ${conf?.name || ''}`;
      } else {
          const result = matchData.result;
          const basePts = result === 'VICTORIA' ? 3 : result === 'EMPATE' ? 1 : 0;
          earnedPoints = basePts * 2; 
      }

      if (!availableTournaments.includes(tournamentName)) {
          addTournament(tournamentName);
      }

      const match = await addMatch({ 
          ...matchData, 
          matchMode: 'qualifiers',
          earnedPoints: earnedPoints,
          tournament: tournamentName
      });
      if (playerProfile.qualifiersProgress) {
          const progress = { ...playerProfile.qualifiersProgress };
          const conf = CONFEDERATIONS[progress.confederation];
          progress.matchesPlayed += 1;
          progress.goalDifference += (match.goalDifference || 0);
          if (match.result === 'VICTORIA') { progress.points += 3; progress.record.wins += 1; }
          else if (match.result === 'EMPATE') { progress.points += 1; progress.record.draws += 1; }
          else { progress.record.losses += 1; }
          if (!progress.completedMatches) progress.completedMatches = [];
          progress.completedMatches.push(match);
          if (conf && progress.matchesPlayed >= conf.matchesToPlay) { 
              progress.status = 'completed';
              const standings = generateQualifiersStandings(progress, playerProfile.name, progress.completedMatches);
              const pos = standings.find(t => t.name === playerProfile.name)?.position || 99;
              if (pos <= conf.slots) {
                  await updatePlayerProfile({ 
                      careerPoints: (playerProfile.careerPoints || 0) + 200, 
                      worldCupAttempts: (playerProfile.worldCupAttempts || 0) + 5
                  });
                  if (user && db) {
                      await firebaseService.addActivity({
                          userId: user.uid,
                          userName: playerProfile.name,
                          userPhoto: playerProfile.photo,
                          type: 'campaign_milestone',
                          title: `🌍 ¡CLASIFICADO!`,
                          description: `${playerProfile.name} ha clasificado al Mundial tras terminar en el puesto ${pos} de ${conf.name}.`
                      });
                  }
              }
          }
          await updatePlayerProfile({ qualifiersProgress: progress });
      }
      return match; 
  };

  const resolveConflict = async (choice: 'local' | 'cloud') => {
      setDataConflict(false);
  };

  const requestNotificationPermission = async () => {
      if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
              console.log('Notification permission granted.');
          }
      }
  };

  const addNotification = (message: string) => {
      const newNotif = {
          id: uuidv4(),
          message,
          date: new Date().toISOString(),
          read: false,
          type: 'system'
      };
      setNotifications(prev => [newNotif, ...prev]);
      if (user && db) firebaseService.addPersistentNotification(user.uid, newNotif);
  };

  const recalculateStats = async () => {
      if (!user) return;
      const stats = await firebaseService.recalculateUserStats(user.uid);
      setPlayerProfile(prev => ({ ...prev, stats }));
  };

  // Función para abrir la nueva página de cierre de temporada
  const openSeasonRecap = (data: any) => {
      setActiveRecapData(data);
      setCurrentPage('season_recap');
  };

  return (
    <DataContext.Provider value={{
      matches, goals, customAchievements, aiInteractions, tournaments, playerProfile, isOnboardingComplete,
      completeOnboarding, addMatch, updateMatch, deleteMatch, addGoal, deleteGoal,
      addCustomAchievement, deleteCustomAchievement, addAIInteraction,
      addTournament, updateTournament, deleteTournament, updatePlayerProfile,
      importJsonData, importCsvData, importMatchesFromAI, checkAILimit, aiUsageCount, AI_MONTHLY_LIMIT,
      currentPage, setCurrentPage, resetApp, syncState, forceSync, isReadOnly: readOnlyMode,
      isShareMode: readOnlyMode,
      loading: false, notifications, pendingMatches, friendRequests, hasUnreadNotifications,
      markNotificationsAsRead, clearAllNotifications, confirmPendingMatch, respondToFriendRequest, deleteNotification,
      generateShareLink, startNewWorldCupCampaign, abandonQualifiers, abandonWorldCupCampaign,
      startWorldCupFromQualification, startNewQualifiersCampaign, clearChampionCampaign,
      addWorldCupMatch, addQualifiersMatch, resolveConflict, dataConflict, requestNotificationPermission, availableTournaments, addNotification,
      recalculateStats, activeRecapData, openSeasonRecap
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
