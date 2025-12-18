
import React from 'react';

export type Page = 'recorder' | 'stats' | 'table' | 'duels' | 'progress' | 'social' | 'coach' | 'worldcup' | 'settings';

export type MatchResult = 'VICTORIA' | 'EMPATE' | 'DERROTA';

export interface PlayerPerformance {
  name: string;
  goals: number;
  assists: number;
}

export interface Match {
  id: string;
  date: string;
  result: MatchResult;
  myGoals: number;
  myAssists: number;
  goalDifference?: number;
  notes?: string;
  tournament?: string;
  matchMode?: 'regular' | 'world-cup' | 'qualifiers';
  myTeamPlayers?: PlayerPerformance[];
  opponentPlayers?: PlayerPerformance[];
}

export type MatchSortByType = 'date_desc' | 'date_asc' | 'goals_desc' | 'goals_asc' | 'assists_desc' | 'assists_asc';

export interface Tournament {
  id: string;
  name: string;
  matchDuration: number;
  playersPerSide: number;
  icon: string;
  color: string;
}

export type GoalMetric = 'myGoals' | 'myAssists' | 'VICTORIA' | 'longestWinStreak' | 'longestUndefeatedStreak' | 'winRate' | 'gpm' | 'undefeatedRate';
export type GoalType = 'accumulate' | 'percentage' | 'average' | 'streak' | 'peak';

export interface Goal {
  id: string;
  metric: GoalMetric;
  goalType: GoalType;
  target: number;
  title: string;
  startDate?: string;
  endDate?: string;
}

export interface AchievementCondition {
  metric: 'winStreak' | 'lossStreak' | 'undefeatedStreak' | 'winlessStreak' | 'goalStreak' | 'assistStreak' | 'goalDrought' | 'assistDrought' | 'breakWinAfterLossStreak' | 'breakUndefeatedAfterWinlessStreak';
  operator: 'greater_than_or_equal_to';
  value: number;
  window: number;
}

export interface CustomAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  unlocked?: boolean;
}

export interface AchievementTier {
  name: string;
  target: number;
  icon: string;
}

export interface HistoricalRecord {
  value: number;
  count: number;
}

export interface HistoricalRecords {
  longestWinStreak: HistoricalRecord;
  longestUndefeatedStreak: HistoricalRecord;
  longestDrawStreak: HistoricalRecord;
  longestLossStreak: HistoricalRecord;
  longestWinlessStreak: HistoricalRecord;
  longestGoalStreak: HistoricalRecord;
  longestAssistStreak: HistoricalRecord;
  longestGoalDrought: HistoricalRecord;
  longestAssistDrought: HistoricalRecord;
  bestGoalPerformance: HistoricalRecord;
  bestAssistPerformance: HistoricalRecord;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: (matches: Match[], records: HistoricalRecords) => number;
  tiers: AchievementTier[];
  isSecret?: boolean;
}

export interface AIHighlight {
  matchId: string;
  title: string;
  reason: string;
  match?: Match;
}

export interface CoachingInsight {
  positiveTrend: string;
  areaForImprovement: string;
}

export interface FeedbackAnalysis {
    category: string;
    priority: string;
    response_to_user: string;
}

export interface AIGoalSuggestion {
    title: string;
    description: string;
    metric: GoalMetric;
    goalType: GoalType;
    target: number;
    year: string;
}

export interface AIAchievementSuggestion {
    title: string;
    description: string;
    icon: string;
    condition: AchievementCondition;
}

export interface AIInteraction {
  id: string;
  type: 'match_summary' | 'highlight_analysis' | 'coach_insight' | 'consistency_analysis' | 'goal_suggestion' | 'achievement_suggestion' | 'match_headline' | 'player_comparison';
  date: string;
  content: any;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  progress: number;
}

export interface PlayerContextStats {
  matchesPlayed: number;
  winRate: number;
  record: { wins: number; draws: number; losses: number };
  myGoals: number;
  myAssists: number;
  gpm: number;
  apm: number;
  points: number;
  matches: Match[];
}

export interface PlayerProfileStats {
  teammateStats: PlayerContextStats | null;
  opponentStats: PlayerContextStats | null;
}

export interface TeammateStats extends PlayerContextStats {
    name: string;
    totalGoals: number;
    totalAssists: number;
    totalContributions: number;
    contributionsPerMatch: number;
    impactScore: number;
    ownGoals: number;
    ownAssists: number;
    rankChange: 'up' | 'down' | 'same' | 'new';
}

export interface OpponentStats extends PlayerContextStats {
    name: string;
    myTotalContributions: number;
    myContributionsPerMatch: number;
    impactScore: number;
    ownGoals: number;
    ownAssists: number;
    rankChange: 'up' | 'down' | 'same' | 'new';
}

export enum MoraleLevel {
  MODO_D10S = 'MODO D10S',
  ESTELAR = 'ESTELAR',
  INSPIRADO = 'INSPIRADO',
  CONFIADO = 'CONFIADO',
  SOLIDO = 'SÓLIDO',
  REGULAR = 'REGULAR',
  DUDOSO = 'DUDOSO',
  BLOQUEADO = 'BLOQUEADO',
  EN_CAIDA_LIBRE = 'EN CAÍDA LIBRE',
  DESCONOCIDO = 'DESCONOCIDO'
}

export interface PlayerMorale {
  level: MoraleLevel;
  score: number;
  description: string;
  recentMatchesSummary: {
    matchesConsidered: number;
    record: string;
    goals: number;
    assists: number;
  };
  trend: 'up' | 'down' | 'same' | 'new';
  trendStreak: number;
}

export interface PublicProfile {
    uid: string;
    name: string;
    photo?: string;
    level?: number;
}

export interface Notification {
    id: string;
    date: string;
    message: string;
    type: string;
    read: boolean;
    result?: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
    read: boolean;
}

export type WorldCupStage = 'group' | 'round_of_16' | 'quarter_finals' | 'semi_finals' | 'final';
export type ConfederationName = 'CONMEBOL' | 'UEFA' | 'AFC' | 'CAF' | 'CONCACAF' | 'OFC';

export interface WorldCupCampaignHistory {
    campaignNumber: number;
    finalStage: WorldCupStage | 'eliminated_group' | 'abandoned';
    status: 'champion' | 'eliminated' | 'abandoned';
    startDate: string;
    endDate: string;
    results: MatchResult[];
}

export interface QualifiersCampaignHistory {
    campaignNumber: number;
    confederation: ConfederationName;
    finalPosition: number;
    status: 'completed' | 'abandoned';
    points: number;
    record: { wins: number; draws: number; losses: number };
    startDate: string;
    endDate: string;
}

export interface WorldCupProgress {
    campaignNumber: number;
    currentStage: WorldCupStage;
    startDate: string;
    groupStage: { matchesPlayed: number; points: number };
    completedStages: WorldCupStage[];
    matchesByStage: Record<string, Match[]>;
    championOfCampaign?: boolean;
}

export interface QualifiersProgress {
    campaignNumber: number;
    confederation: ConfederationName;
    matchesPlayed: number;
    points: number;
    record: { wins: number; draws: number; losses: number };
    goalDifference: number;
    completedMatches: Match[];
    group?: any[];
    status: 'active' | 'completed';
    qualifierStage?: 'league' | 'group' | 'playoff' | 'knockout';
    startDate?: string;
}

export interface PlayerProfileData {
  name: string;
  photo?: string;
  dob?: string;
  weight?: number;
  height?: number;
  favoriteTeam?: string;
  email?: string;
  friends?: string[];
  friendRequestsSent?: string[];
  friendRequestsReceived?: string[];
  careerPoints?: number;
  tutorialsSeen?: Record<string, boolean>;
  activeWorldCupMode?: 'campaign' | 'qualifiers';
  worldCupProgress?: WorldCupProgress | null;
  qualifiersProgress?: QualifiersProgress | null;
  worldCupHistory?: WorldCupCampaignHistory[];
  qualifiersHistory?: QualifiersCampaignHistory[];
  lastFreeWorldCupDate?: string;
  worldCupAttempts?: number;
}

export interface TutorialStep {
    title: string;
    content: string;
    icon?: React.ReactNode;
}

export interface FeaturedInsight {
    icon: string;
    title: string;
    description: string;
}
