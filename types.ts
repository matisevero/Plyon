
import React from 'react';

export type Page = 'landing' | 'recorder' | 'stats' | 'table' | 'duels' | 'progress' | 'social' | 'coach' | 'worldcup' | 'settings' | 'admin' | 'season_recap';

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
  earnedPoints?: number; 
  myTeamPlayers?: PlayerPerformance[];
  opponentPlayers?: PlayerPerformance[];
  verified?: boolean;
}

export interface SocialActivity {
    id: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    type: 'match' | 'achievement' | 'campaign_milestone' | 'streak' | 'post';
    title: string;
    description: string;
    timestamp: string;
    metadata?: {
        image?: string;
        videoUrl?: string;
        location?: string;
        mood?: string; // e.g., 'training', 'matchday', 'injured'
        moodIcon?: string;
        likes?: string[];
        reactions?: Record<string, string[]>; // Map emoji -> array of userIds
        comments?: number;
    };
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
  type: 'match_summary' | 'highlight_analysis' | 'coach_insight' | 'consistency_analysis' | 'goal_suggestion' | 'achievement_suggestion' | 'match_headline' | 'player_comparison' | 'feedback';
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

export interface SeasonRating {
    tierName: string;
    description: string;
    score: number;
    efficiency: number;
    similarTo?: string;
}

export interface PublicProfile {
    uid: string;
    name: string;
    username?: string;
    photo?: string;
    level?: number;
    careerPoints?: number;
    favoriteTeam?: string;
    friends?: string[];
    reputation?: {
        totalValidations: number;
        perfectValidations: number; // Accepted without edits
    };
}

export interface Notification {
    id: string;
    date: string;
    message: string;
    type: string; 
    read: boolean;
    result?: string;
    metadata?: any;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
    read: boolean;
    participants?: string[];
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
    isQualified?: boolean; 
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
    isQualified?: boolean; 
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

// Optimized structure for scalability
export interface AggregatedStats {
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number; // My Goals
    assists: number;
}

export interface PlayerProfileData {
  name: string;
  username?: string;
  photo?: string;
  dob?: string;
  weight?: number;
  height?: number;
  favoriteTeam?: string;
  email?: string;
  friends?: string[];
  blockedUsers?: string[]; // New: Blocked users list
  playerMappings?: Record<string, string>; 
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
  stats?: AggregatedStats; // New aggregated stats
  reputation?: {
      totalValidations: number;
      perfectValidations: number;
  };
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

export interface FriendRequest {
    id: string;
    from: string;
    to: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    fromName: string;
    senderProfile?: PublicProfile;
}

export interface RankingUser extends PublicProfile {
    position: number;
    stats: {
        totalMatches: number;
        totalPoints: number;
        winRate: number;
    }
}

export interface Invitation {
    code: string;
    createdBy: string;
    createdAt: string;
    expiresAt: string;
    usedBy: string[];
}

export interface PendingMatch {
    id: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    matchData: Match;
    role: 'teammate' | 'opponent';
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

export interface UserReport {
    id: string;
    reporterId: string;
    reportedUserId: string;
    reason: string;
    comments?: string;
    createdAt: string;
    status: 'pending' | 'reviewed';
}