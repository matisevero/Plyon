
import type { Match, HistoricalRecords, HistoricalRecord, CustomAchievement, Goal, QualifiersProgress, ConfederationName, PlayerMorale, PlayerProfileData, FeaturedInsight } from '../types';
import { MoraleLevel } from '../types';

/**
 * Returns today's date in YYYY-MM-DD format based on local time.
 */
export const getLocalDateString = (dateInput: Date = new Date()) => {
  const year = dateInput.getFullYear();
  const month = (dateInput.getMonth() + 1).toString().padStart(2, '0');
  const day = dateInput.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses a 'YYYY-MM-DD' date string or ISO string as a local date.
 * Handles cases where the input might be a full ISO string by taking only the first 10 characters.
 */
export const parseLocalDate = (dateString: string): Date => {
  if (!dateString || typeof dateString !== 'string') {
    return new Date(0); 
  }
  
  // Normalize string: take only YYYY-MM-DD part to avoid timezone shifts or parsing errors with full ISO strings
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const parts = datePart.split('-');
  
  if (parts.length !== 3) {
    return new Date(0);
  }
  
  // Note: month is 0-indexed in the Date constructor
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

export const getColorForString = (str: string): string => {
  if (!str) return '#888888';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const h = hash % 360;
  return `hsl(${h}, 85%, 60%)`;
};

export const calculateStandardDeviation = (data: number[]): number => {
  if (data.length <= 1) {
    return 0;
  }
  const mean = data.reduce((acc, val) => acc + val, 0) / data.length;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
};

export const evaluateCustomAchievement = (achievement: CustomAchievement, matches: Match[]): boolean => {
    const { metric, operator, value, window } = achievement.condition;
    
    const sortedMatches = [...matches].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());

    // NEW LOGIC FOR BREAKING STREAKS
    if (metric === 'breakWinAfterLossStreak') {
        if (sortedMatches.length === 0 || sortedMatches[0].result !== 'VICTORIA') {
            return false;
        }
        let lossStreakBefore = 0;
        for (let i = 1; i < sortedMatches.length; i++) {
            if (sortedMatches[i].result === 'DERROTA') {
                lossStreakBefore++;
            } else {
                break;
            }
        }
        return lossStreakBefore >= value;
    }

    if (metric === 'breakUndefeatedAfterWinlessStreak') {
        if (sortedMatches.length === 0 || sortedMatches[0].result === 'DERROTA') {
            return false;
        }
        let winlessStreakBefore = 0;
        for (let i = 1; i < sortedMatches.length; i++) {
            if (sortedMatches[i].result !== 'VICTORIA') {
                winlessStreakBefore++;
            } else {
                break;
            }
        }
        return winlessStreakBefore >= value;
    }

    // EXISTING LOGIC FOR ONGOING STREAKS
    const recentMatches = sortedMatches.slice(0, window);

    if (recentMatches.length < window) {
        return false;
    }

    let streak = 0;
    
    switch (metric) {
        case 'winStreak':
            for (const match of recentMatches) { if (match.result === 'VICTORIA') streak++; else break; }
            break;
        case 'lossStreak':
             for (const match of recentMatches) { if (match.result === 'DERROTA') streak++; else break; }
            break;
        case 'undefeatedStreak':
             for (const match of recentMatches) { if (match.result !== 'DERROTA') streak++; else break; }
            break;
        case 'winlessStreak':
             for (const match of recentMatches) { if (match.result !== 'VICTORIA') streak++; else break; }
            break;
        case 'goalStreak':
             for (const match of recentMatches) { if (match.myGoals > 0) streak++; else break; }
            break;
        case 'assistStreak':
             for (const match of recentMatches) { if (match.myAssists > 0) streak++; else break; }
            break;
        case 'goalDrought':
             for (const match of recentMatches) { if (match.myGoals === 0) streak++; else break; }
            break;
        case 'assistDrought':
             for (const match of recentMatches) { if (match.myAssists === 0) streak++; else break; }
            break;
        default:
            return false;
    }

    if (operator === 'greater_than_or_equal_to') {
        return streak >= value;
    }
    
    return false;
};

export const calculateHistoricalRecords = (matches: Match[]): HistoricalRecords => {
  const initialRecord: HistoricalRecord = { value: 0, count: 0 };
  const records: HistoricalRecords = {
    longestWinStreak: { ...initialRecord },
    longestUndefeatedStreak: { ...initialRecord },
    longestDrawStreak: { ...initialRecord },
    longestLossStreak: { ...initialRecord },
    longestWinlessStreak: { ...initialRecord },
    longestGoalStreak: { ...initialRecord },
    longestAssistStreak: { ...initialRecord },
    longestGoalDrought: { ...initialRecord },
    longestAssistDrought: { ...initialRecord },
    bestGoalPerformance: { ...initialRecord },
    bestAssistPerformance: { ...initialRecord },
  };

  if (matches.length === 0) {
    return records;
  }

  const sortedMatches = [...matches].sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

  // Single match records
  records.bestGoalPerformance.value = Math.max(0, ...sortedMatches.map(m => m.myGoals));
  records.bestAssistPerformance.value = Math.max(0, ...sortedMatches.map(m => m.myAssists));

  if (records.bestGoalPerformance.value > 0) {
    records.bestGoalPerformance.count = sortedMatches.filter(m => m.myGoals === records.bestGoalPerformance.value).length;
  }
  if (records.bestAssistPerformance.value > 0) {
    records.bestAssistPerformance.count = sortedMatches.filter(m => m.myAssists === records.bestAssistPerformance.value).length;
  }
  
  // Streak calculation
  const streakData: { [key: string]: number[] } = {
    win: [], undefeated: [], draw: [], loss: [], winless: [],
    goal: [], assist: [], goalDrought: [], assistDrought: [],
  };

  let currentWin = 0, currentUndefeated = 0, currentDraw = 0, currentLoss = 0, currentWinless = 0,
      currentGoal = 0, currentAssist = 0, currentGoalDrought = 0, currentAssistDrought = 0;

  for (const match of sortedMatches) {
    // Result streaks
    if (match.result === 'VICTORIA') {
      currentWin++; currentUndefeated++;
      if (currentWinless > 0) streakData.winless.push(currentWinless); currentWinless = 0;
      if (currentLoss > 0) streakData.loss.push(currentLoss); currentLoss = 0;
      if (currentDraw > 0) streakData.draw.push(currentDraw); currentDraw = 0;
    } else if (match.result === 'EMPATE') {
      currentDraw++; currentUndefeated++; currentWinless++;
      if (currentWin > 0) streakData.win.push(currentWin); currentWin = 0;
      if (currentLoss > 0) streakData.loss.push(currentLoss); currentLoss = 0;
    } else { // DERROTA
      currentLoss++; currentWinless++;
      if (currentWin > 0) streakData.win.push(currentWin); currentWin = 0;
      if (currentDraw > 0) streakData.draw.push(currentDraw); currentDraw = 0;
      if (currentUndefeated > 0) streakData.undefeated.push(currentUndefeated); currentUndefeated = 0;
    }
    
    // Performance streaks
    if (match.myGoals > 0) {
      currentGoal++;
      if (currentGoalDrought > 0) streakData.goalDrought.push(currentGoalDrought); currentGoalDrought = 0;
    } else {
      currentGoalDrought++;
      if (currentGoal > 0) streakData.goal.push(currentGoal); currentGoal = 0;
    }

    if (match.myAssists > 0) {
      currentAssist++;
      if (currentAssistDrought > 0) streakData.assistDrought.push(currentAssistDrought); currentAssistDrought = 0;
    } else {
      currentAssistDrought++;
      if (currentAssist > 0) streakData.assist.push(currentAssist); currentAssist = 0;
    }
  }

  // Push final streaks
  if (currentWin > 0) streakData.win.push(currentWin);
  if (currentUndefeated > 0) streakData.undefeated.push(currentUndefeated);
  if (currentDraw > 0) streakData.draw.push(currentDraw);
  if (currentLoss > 0) streakData.loss.push(currentLoss);
  if (currentWinless > 0) streakData.winless.push(currentWinless);
  if (currentGoal > 0) streakData.goal.push(currentGoal);
  if (currentAssist > 0) streakData.assist.push(currentAssist);
  if (currentGoalDrought > 0) streakData.goalDrought.push(currentGoalDrought);
  if (currentAssistDrought > 0) streakData.assistDrought.push(currentAssistDrought);
  
  // Helper to calculate final record
  const calculateRecord = (streaks: number[]): HistoricalRecord => {
    if (streaks.length === 0) return { value: 0, count: 0 };
    const maxValue = Math.max(0, ...streaks);
    if (maxValue === 0) return { value: 0, count: 0 };
    const count = streaks.filter(s => s === maxValue).length;
    return { value: maxValue, count };
  };

  records.longestWinStreak = calculateRecord(streakData.win);
  records.longestUndefeatedStreak = calculateRecord(streakData.undefeated);
  records.longestDrawStreak = calculateRecord(streakData.draw);
  records.longestLossStreak = calculateRecord(streakData.loss);
  records.longestWinlessStreak = calculateRecord(streakData.winless);
  records.longestGoalStreak = calculateRecord(streakData.goal);
  records.longestAssistStreak = calculateRecord(streakData.assist);
  records.longestGoalDrought = calculateRecord(streakData.goalDrought);
  records.longestAssistDrought = calculateRecord(streakData.assistDrought);
  
  return records;
};

export const getProgressForGoal = (goal: Goal, allMatches: Match[]): number => {
    let relevantMatches = allMatches;
    if (goal.startDate && goal.endDate) {
        relevantMatches = relevantMatches.filter(m => {
            const matchDate = parseLocalDate(m.date);
            const startDate = parseLocalDate(goal.startDate!);
            const endDate = parseLocalDate(goal.endDate!);
            return matchDate >= startDate && matchDate <= endDate;
        });
    }

    const records = calculateHistoricalRecords(relevantMatches);
    const totalMatches = relevantMatches.length;

    if (totalMatches === 0 && goal.goalType !== 'peak') return 0;

    if (goal.goalType === 'peak') {
        const peakRecords = calculateHistoricalRecords(relevantMatches);
        if (goal.metric === 'myGoals') return peakRecords.bestGoalPerformance.value;
        if (goal.metric === 'myAssists') return peakRecords.bestAssistPerformance.value;
        return 0;
    }

    switch (goal.metric) {
        case 'myGoals': return relevantMatches.reduce((sum, m) => sum + m.myGoals, 0);
        case 'myAssists': return relevantMatches.reduce((sum, m) => sum + m.myAssists, 0);
        case 'VICTORIA': return relevantMatches.filter(m => m.result === 'VICTORIA').length;
        case 'winRate': return totalMatches > 0 ? (relevantMatches.filter(m => m.result === 'VICTORIA').length / totalMatches) * 100 : 0;
        case 'undefeatedRate': return totalMatches > 0 ? (relevantMatches.filter(m => m.result !== 'DERROTA').length / totalMatches) * 100 : 0;
        case 'gpm': return totalMatches > 0 ? relevantMatches.reduce((sum, m) => sum + m.myGoals, 0) / totalMatches : 0;
        case 'longestWinStreak': return records.longestWinStreak.value;
        case 'longestUndefeatedStreak': return records.longestUndefeatedStreak.value;
        default: return 0;
    }
};


export const calculatePlayerMorale = (matches: Match[]): PlayerMorale | null => {
  const sortedMatches = [...matches].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  
  const MORALE_WINDOW = 8;

  const calculateScoreForWindow = (matchesToCalc: Match[]): number | null => {
    if (matchesToCalc.length < 3) {
      return null;
    }

    let rawScore = 0;
    let momentumBonus = 0;

    // Base score with exponential weighting for recency
    let weightedScoreSum = 0;
    let weightSum = 0;
    matchesToCalc.forEach((match, index) => {
        const weight = Math.pow(0.85, index); // Exponential decay
        let matchScore = 0;
        if (match.result === 'VICTORIA') matchScore += 3;
        else if (match.result === 'EMPATE') matchScore += 1;
        else matchScore -= 2; // Defeats are impactful
        
        matchScore += match.myGoals * 1.5; // Goals are highly valued
        matchScore += match.myAssists * 1.0;
        matchScore += (match.goalDifference ?? 0) * 0.25;

        weightedScoreSum += matchScore * weight;
        weightSum += weight;
    });
    rawScore = weightSum > 0 ? weightedScoreSum / weightSum : 0;
    
    // Momentum bonus/penalty for recent streaks (last 3 matches)
    const last3 = matchesToCalc.slice(0, 3);
    if (last3.length === 3) {
        // Positive streak
        if (last3[0].result === 'VICTORIA' && last3[1].result === 'VICTORIA') {
            momentumBonus += 1.5; // 2 wins in a row
            if (last3[2].result === 'VICTORIA') momentumBonus += 2.0; // 3 wins!
        }
        // Negative streak
        if (last3[0].result === 'DERROTA' && last3[1].result === 'DERROTA') {
            momentumBonus -= 2.0; // 2 losses
            if (last3[2].result === 'DERROTA') momentumBonus -= 2.5; // 3 losses!
        }
        // Streak breaker bonus
        if (last3[0].result === 'VICTORIA' && last3[1].result === 'DERROTA' && last3[2].result === 'DERROTA') {
            momentumBonus += 3.0; // Clutch win after 2 losses
        }
    }

    const totalScore = rawScore + momentumBonus;

    const MIN_RAW_SCORE = -5;
    const MAX_RAW_SCORE = 15;
    let finalScore = ((totalScore - MIN_RAW_SCORE) / (MAX_RAW_SCORE - MIN_RAW_SCORE)) * 100;
    return Math.max(0, Math.min(100, finalScore));
  };

  const currentMatches = sortedMatches.slice(0, MORALE_WINDOW);
  const previousMatches = sortedMatches.slice(1, MORALE_WINDOW + 1);

  const currentScore = calculateScoreForWindow(currentMatches);
  const previousScore = calculateScoreForWindow(previousMatches);
  
  if (currentScore === null) {
    return null;
  }
  
  let trend: 'up' | 'down' | 'same' | 'new';
  if (previousScore === null || sortedMatches.length <= MORALE_WINDOW) {
    trend = 'new';
  } else if (currentScore > previousScore + 2) {
    trend = 'up';
  } else if (currentScore < previousScore - 2) {
    trend = 'down';
  } else {
    trend = 'same';
  }
  
  let trendStreak = 0;
  if (trend === 'up' || trend === 'down') {
      trendStreak = 1;
      for (let i = 1; i < 6; i++) {
          const lookbackCurrentMatches = sortedMatches.slice(i, i + MORALE_WINDOW);
          const lookbackPreviousMatches = sortedMatches.slice(i + 1, i + 1 + MORALE_WINDOW);
          if (lookbackPreviousMatches.length < 3) break;
          const scoreCurrent = calculateScoreForWindow(lookbackCurrentMatches);
          const scorePrevious = calculateScoreForWindow(lookbackPreviousMatches);
          if (scoreCurrent === null || scorePrevious === null) break;
          let historicalTrend: 'up' | 'down' | 'same' = 'same';
          if (scoreCurrent > scorePrevious + 2) historicalTrend = 'up';
          else if (scoreCurrent < scorePrevious - 2) historicalTrend = 'down';
          if (historicalTrend === trend) {
              trendStreak++;
          } else {
              break;
          }
      }
  }

  let level: MoraleLevel;
  if (currentScore === 100) level = MoraleLevel.MODO_D10S;
  else if (currentScore >= 90) level = MoraleLevel.ESTELAR;
  else if (currentScore >= 80) level = MoraleLevel.INSPIRADO;
  else if (currentScore >= 70) level = MoraleLevel.CONFIADO;
  else if (currentScore >= 60) level = MoraleLevel.SOLIDO;
  else if (currentScore >= 50) level = MoraleLevel.REGULAR;
  else if (currentScore >= 40) level = MoraleLevel.DUDOSO;
  else if (currentScore >= 30) level = MoraleLevel.BLOQUEADO;
  else if (currentScore >= 10) level = MoraleLevel.EN_CAIDA_LIBRE;
  else level = MoraleLevel.DESCONOCIDO;

  let wins = 0, draws = 0, losses = 0, goals = 0, assists = 0;
  currentMatches.forEach((match) => {
    if (match.result === 'VICTORIA') wins++;
    else if (match.result === 'EMPATE') draws++;
    else losses++;
    goals += match.myGoals;
    assists += match.myAssists;
  });

  const recentMatchesSummary = {
    matchesConsidered: currentMatches.length,
    record: `${wins}V-${draws}E-${losses}D`,
    goals,
    assists,
  };
  
  const moraleDescriptions: Record<MoraleLevel, string> = {
    [MoraleLevel.MODO_D10S]: "Barrilete cósmico... ¿De qué planeta viniste? Estás en un nivel donde cada pelota que tocas tiene destino de genialidad. Disfrútalo, porque esto es historia.",
    [MoraleLevel.ESTELAR]: "Estás en racha. Te sientes imparable, con la confianza por las nubes para intentar cualquier cosa y que te salga bien. El rival te teme.",
    [MoraleLevel.INSPIRADO]: "Las ideas fluyen y las piernas responden. Estás viendo la jugada antes que los demás y marcando la diferencia en cada intervención.",
    [MoraleLevel.CONFIADO]: "Sientes que el equipo puede contar contigo. Estás tomando buenas decisiones, juegas con seguridad y tu aporte es consistentemente positivo.",
    [MoraleLevel.SOLIDO]: "Cumplidor y fiable. Estás haciendo tu trabajo sin grandes lujos pero con efectividad. Aportas equilibrio y seguridad al equipo.",
    [MoraleLevel.REGULAR]: "Un rendimiento estándar. Tienes momentos buenos y otros no tanto, pero te mantienes en partido. Hay margen para crecer.",
    [MoraleLevel.DUDOSO]: "Un poco desconectado. Las cosas no están saliendo como esperas y te cuesta encontrar tu ritmo. Es momento de simplificar el juego.",
    [MoraleLevel.BLOQUEADO]: "Mentalmente fuera de partido. Sientes que cada decisión es la incorrecta y la frustración empieza a pesar. Necesitas un reseteo.",
    [MoraleLevel.EN_CAIDA_LIBRE]: "Una racha muy negativa te ha quitado toda la confianza. Cada pelota parece pesar una tonelada y el arco rival se ve lejano.",
    [MoraleLevel.DESCONOCIDO]: "Tu rendimiento actual es irreconocible. La tribuna empieza a impacientarse... hay riesgo de que te incendien el auto.",
  };

  return { level, score: currentScore, description: moraleDescriptions[level], recentMatchesSummary, trend, trendStreak };
};

// --- World Cup Qualifiers Data ---

const AFC_TEAMS = [
  { name: 'Japón', strength: 9 }, { name: 'Irán', strength: 8 }, { name: 'Corea del Sur', strength: 8 },
  { name: 'Australia', strength: 7 }, { name: 'Arabia Saudita', strength: 7 }, { name: 'Qatar', strength: 7 },
  { name: 'Irak', strength: 6 }, { name: 'Emiratos Árabes', strength: 6 }, { name: 'Uzbekistán', strength: 6 },
  { name: 'China', strength: 5 }, { name: 'Jordania', strength: 5 }, { name: 'Omán', strength: 5 },
  { name: 'Siria', strength: 4 }, { name: 'Vietnam', strength: 4 }, { name: 'Tailandia', strength: 4 },
  { name: 'Líbano', strength: 3 }, { name: 'India', strength: 3 }, { name: 'Palestina', strength: 3 }
];

const CAF_TEAMS = [
  { name: 'Marruecos', strength: 9 }, { name: 'Senegal', strength: 9 }, { name: 'Nigeria', strength: 8 },
  { name: 'Egipto', strength: 8 }, { name: 'Argelia', strength: 7 }, { name: 'Túnez', strength: 7 },
  { name: 'Camerún', strength: 7 }, { name: 'Costa de Marfil', strength: 7 }, { name: 'Ghana', strength: 6 },
];

const CONCACAF_TEAMS = [
  { name: 'Costa Rica', strength: 7 }, { name: 'Panamá', strength: 6 }, { name: 'Jamaica', strength: 6 },
  { name: 'Honduras', strength: 5 }, { name: 'El Salvador', strength: 4 }, { name: 'Trinidad y Tobago', strength: 4 },
  { name: 'Haití', strength: 3 }, { name: 'Curazao', strength: 3 }, { name: 'Guatemala', strength: 3 },
  { name: 'Surinam', strength: 2 }, { name: 'Nicaragua', strength: 2 }, { name: 'Cuba', strength: 2 }
];

const CONMEBOL_TEAMS = [
  { name: 'Argentina', strength: 9 }, { name: 'Bolivia', strength: 3 }, { name: 'Brasil', strength: 10 },
  { name: 'Chile', strength: 6 }, { name: 'Colombia', strength: 7 }, { name: 'Ecuador', strength: 7 },
  { name: 'Paraguay', strength: 5 }, { name: 'Peru', strength: 6 }, { name: 'Uruguay', strength: 8 },
  { name: 'Venezuela', strength: 4 },
];

const OFC_TEAMS = [
    { name: 'Nueva Zelanda', strength: 7 }, { name: 'Fiyi', strength: 4 }, { name: 'Tahití', strength: 4 },
    { name: 'Nueva Caledonia', strength: 3 }, { name: 'Samoa', strength: 2 }, { name: 'Papúa Nueva Guinea', strength: 3 },
    { name: 'Islas Salomón', strength: 3 }, { name: 'Vanuatu', strength: 2 }
];

const UEFA_TEAMS = [
  { name: 'Francia', strength: 10 }, { name: 'Inglaterra', strength: 9 }, { name: 'Bélgica', strength: 9 },
  { name: 'Croacia', strength: 8 }, { name: 'Países Bajos', strength: 8 }, { name: 'Portugal', strength: 8 },
  { name: 'España', strength: 8 }, { name: 'Italia', strength: 8 }, { name: 'Alemania', strength: 8 },
  { name: 'Suiza', strength: 7 }, { name: 'Dinamarca', strength: 7 }, { name: 'Polonia', strength: 6 },
];

export const WORLD_CUP_LOGO = {
  light: 'https://www.dropbox.com/scl/fi/9iste5u6ze5ed3xfchrin/WorldCup2026-Light.png?rlkey=lzil2u05fdp07oou9m2vi6evh&raw=1',
  dark: 'https://www.dropbox.com/scl/fi/t2h7gje7410b3efp3v0vc/WorldCup2026-Dark.png?rlkey=59cw33t0q3bkc39v0dr204nf6&raw=1'
};

export const CONFEDERATIONS = {
  CONMEBOL: { id: 'CONMEBOL', name: 'CONMEBOL (Sudamérica)', teams: CONMEBOL_TEAMS, slots: 6, playoffSlots: 1, formatDescription: 'Un único grupo de 10 selecciones, todos contra todos. 18 partidos para asegurar la clasificación.', matchesToPlay: 18, simulationType: 'round-robin', logo: { light: 'https://www.dropbox.com/scl/fi/f4orohs5hbzw9p787xb0b/CONMEBOL-Light.png?rlkey=nmqzb4y77hyktik3g96facwf3&raw=1', dark: 'https://www.dropbox.com/scl/fi/zfcbe6hdg5qajj3f8xzx8/CONMEBOL-Dark.png?rlkey=qc5hxdjars73vdi17f53oh530&raw=1' }, difficulty: 'Extrema', pointsMultiplier: 3 },
  UEFA: { id: 'UEFA', name: 'UEFA (Europa)', teams: UEFA_TEAMS, slots: 16, playoffSlots: 0, formatDescription: '12 grupos. Clasifican los 12 ganadores de grupo y los 4 mejores de un playoff entre los segundos y equipos de la Nations League.', matchesToPlay: 8, simulationType: 'groups', logo: { light: 'https://www.dropbox.com/scl/fi/b8fha5qnrnwp1g6mgoos5/UEFA-Light-01.png?rlkey=36snoo25t7rsqypsnqsxxigol&raw=1', dark: 'https://www.dropbox.com/scl/fi/yt3piyogka49f572zoi64/UEFA-Dark-01.png?rlkey=h6za381d16fkdoji3hv27t4vo&raw=1' }, difficulty: 'Extrema', pointsMultiplier: 3 },
  AFC: { id: 'AFC', name: 'AFC (Asia)', teams: AFC_TEAMS, slots: 8, playoffSlots: 1, formatDescription: 'Fase final de 3 grupos de 6. Clasifican los 2 primeros de cada grupo. Los 3ros y 4tos van a una 4ta ronda por 2.5 cupos.', matchesToPlay: 10, simulationType: 'groups', logo: { light: 'https://www.dropbox.com/scl/fi/uou6dg1qp6ov35r4pywxz/AFC-Light.png?rlkey=ukpn9qbw7x27sop6rmnjb9aq9&raw=1', dark: 'https://www.dropbox.com/scl/fi/y8z65ssfbgm622ig92tr6/AFC-Dark.png?rlkey=skx9dhivtsqxal88ik29vbcix&raw=1'}, difficulty: 'Desafiante', pointsMultiplier: 2 },
  CAF: { id: 'CAF', name: 'CAF (Africa)', teams: CAF_TEAMS, slots: 9, playoffSlots: 1, formatDescription: '9 grupos de 6. Clasifica el primero de cada grupo. Los 4 mejores segundos van a un playoff por el repechaje.', matchesToPlay: 10, simulationType: 'groups', logo: { light: 'https://www.dropbox.com/scl/fi/z3qq3uvt7wkz79zqp19co/CAF-Light.png?rlkey=9bd01fncmbz7wcrw9r6gwbcs6&raw=1', dark: 'https://www.dropbox.com/scl/fi/9xr8y26q5ca6tfu3dd8d4/CAF-Dark.png?rlkey=winct131mx52ox6frfyi7t6kk&raw=1' }, difficulty: 'Desafiante', pointsMultiplier: 2 },
  CONCACAF: { id: 'CONCACAF', name: 'CONCACAF (Norte y centro América y Caribe)', teams: CONCACAF_TEAMS, slots: 3, playoffSlots: 2, formatDescription: 'Con 3 anfitriones ya clasificados, la fase final es de 3 grupos de 4. Clasifican los 2 primeros de cada grupo y los 2 mejores 3ros van al repechaje.', matchesToPlay: 6, simulationType: 'groups', logo: { light: 'https://www.dropbox.com/scl/fi/b7hnalgal7low3w33hue2/CONCACAF-Light.png?rlkey=jio2cnyrh37cusx9mtbcnjkck&raw=1', dark: 'https://www.dropbox.com/scl/fi/y8qr9fcw0yaqrcewqepqn/CONCACAF-Dark.png?rlkey=275o0jvyfyzgp1y9kr1cj6iih&raw=1' }, difficulty: 'Desafiante', pointsMultiplier: 2 },
  OFC: { id: 'OFC', name: 'OFC (Oceania)', teams: OFC_TEAMS, slots: 1, playoffSlots: 1, formatDescription: 'Fase de grupos seguida de semifinal y final. ¡Por primera vez con un cupo directo!', matchesToPlay: 3, simulationType: 'groups-knockout', logo: { light: 'https://www.dropbox.com/scl/fi/0qnubqlcd9rxukfkd069s/OFC-Light.png?rlkey=0gwbt2xloc0uni79o1qbstt25&raw=1', dark: 'https://www.dropbox.com/scl/fi/dsqo38bvygbpvcdhjuknu/OFC-Dark.png?rlkey=k9tze4xf4lzgi8xcepr23qf6g&raw=1' }, difficulty: 'Accesible', pointsMultiplier: 1.5 },
};


const simulateMatches = (team: { strength: number }, numMatches: number, seed: number) => {
    const random = () => {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    let wins = 0;
    let draws = 0;
    for (let i = 0; i < numMatches; i++) {
        const resultRand = random();
        const winProb = team.strength / 22;
        const drawProb = 0.25;
        if (resultRand < winProb) {
            wins++;
        } else if (resultRand < winProb + drawProb) {
            draws++;
        }
    }
    const losses = numMatches - wins - draws;
    const points = wins * 3 + draws;
    const goalDifference = Math.round(wins * (random() + 1.2) - losses * (random() + 0.8));
    
    return { wins, draws, losses, points, goalDifference };
};

// MODIFIED: Now accepts `matches` array explicitly to calculate standings based on real-time data
export const generateQualifiersStandings = (progress: QualifiersProgress, playerName: string, explicitMatches?: Match[]) => {
    const conf = CONFEDERATIONS[progress.confederation];
    if (!conf) return [];

    // Use explicit matches if provided (from global context), otherwise fallback to stored (legacy)
    const matchesToCalculate = explicitMatches || progress.completedMatches || [];
    
    // Calculate player stats dynamically from matches
    const playerStats = {
        matchesPlayed: matchesToCalculate.length,
        wins: matchesToCalculate.filter(m => m.result === 'VICTORIA').length,
        draws: matchesToCalculate.filter(m => m.result === 'EMPATE').length,
        losses: matchesToCalculate.filter(m => m.result === 'DERROTA').length,
        points: 0,
        goalDifference: matchesToCalculate.reduce((acc, m) => acc + (m.goalDifference || 0), 0)
    };
    playerStats.points = playerStats.wins * 3 + playerStats.draws;

    const standings: any[] = [];
    
    let aiTeams;
    if (conf.simulationType === 'round-robin') {
        aiTeams = conf.teams.filter(t => t.name.toLowerCase() !== playerName.toLowerCase());
    } else {
        // For group stages, use the group assigned to the player
        aiTeams = progress.group?.filter((t: any) => t.name.toLowerCase() !== playerName.toLowerCase()) || [];
    }
    
    // Add Player to standings
    standings.push({
        name: playerName,
        played: playerStats.matchesPlayed,
        wins: playerStats.wins,
        draws: playerStats.draws,
        losses: playerStats.losses,
        points: playerStats.points,
        goalDifference: playerStats.goalDifference,
    });
    
    // Simulate AI teams based on player's match count
    aiTeams.forEach((team: any) => {
        let seed = team.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) + playerStats.matchesPlayed;
        const simResult = simulateMatches(team, playerStats.matchesPlayed, seed);
        
        standings.push({
            name: team.name,
            played: playerStats.matchesPlayed,
            ...simResult
        });
    });

    // Sort standings
    standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.wins - a.wins;
    });

    return standings.map((team, index) => ({
        ...team,
        position: index + 1,
    }));
};

export const generateFeaturedInsights = (matches: Match[], playerProfile: PlayerProfileData): FeaturedInsight[] => {
    const insights: FeaturedInsight[] = [];
    if (matches.length < 5) return [];

    const sortedMatches = [...matches].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
    const recentMatches = sortedMatches.slice(0, 5);

    // Insight 1: Recent form effectiveness
    if (recentMatches.length > 0) {
        const wins = recentMatches.filter(m => m.result === 'VICTORIA').length;
        const draws = recentMatches.filter(m => m.result === 'EMPATE').length;
        const points = wins * 3 + draws;
        const effectiveness = (points / (recentMatches.length * 3)) * 100;
        if (effectiveness >= 60) {
            insights.push({
                icon: '🔥',
                title: 'En Racha',
                description: `Has conseguido un ${effectiveness.toFixed(0)}% de los puntos en tus últimos ${recentMatches.length} partidos.`
            });
        }
    }

    // Insight: Year-over-year performance comparison
    const today = new Date();
    const currentYear = today.getFullYear();
    const previousYear = currentYear - 1;
    const currentMonth = today.getMonth(); // 0-11
    const currentDayOfMonth = today.getDate();

    const currentYearMatches = matches.filter(m => {
        const matchDate = parseLocalDate(m.date);
        return matchDate.getFullYear() === currentYear &&
               (matchDate.getMonth() < currentMonth || (matchDate.getMonth() === currentMonth && matchDate.getDate() <= currentDayOfMonth));
    });

    const previousYearMatches = matches.filter(m => {
        const matchDate = parseLocalDate(m.date);
        return matchDate.getFullYear() === previousYear &&
               (matchDate.getMonth() < currentMonth || (matchDate.getMonth() === currentMonth && matchDate.getDate() <= currentDayOfMonth));
    });

    if (currentYearMatches.length > 0 && previousYearMatches.length > 0) {
        const currentGoals = currentYearMatches.reduce((sum, m) => sum + m.myGoals, 0);
        const previousGoals = previousYearMatches.reduce((sum, m) => sum + m.myGoals, 0);
        const goalDiff = currentGoals - previousGoals;

        if (Math.abs(goalDiff) >= 2) {
            insights.push({
                icon: goalDiff > 0 ? '📈' : '📉',
                title: `Ritmo Goleador vs. ${previousYear}`,
                description: `Llevas ${Math.abs(goalDiff)} goles ${goalDiff > 0 ? 'más' : 'menos'} que en el mismo período del año pasado.`
            });
        }
        
        const currentAssists = currentYearMatches.reduce((sum, m) => sum + m.myAssists, 0);
        const previousAssists = previousYearMatches.reduce((sum, m) => sum + m.myAssists, 0);
        const assistDiff = currentAssists - previousAssists;

        if (Math.abs(assistDiff) >= 2) {
            insights.push({
                icon: assistDiff > 0 ? '📈' : '📉',
                title: `Ritmo Asistidor vs. ${previousYear}`,
                description: `Llevas ${Math.abs(assistDiff)} asistencias ${assistDiff > 0 ? 'más' : 'menos'} que en el mismo período del año pasado.`
            });
        }
    }

    // Insight 2 & 3: Best Partner & Nemesis
    const teammateData: Record<string, { matches: number; wins: number; draws: number; }> = {};
    const opponentData: Record<string, { matches: number; wins: number; }> = {};

    matches.forEach(match => {
        match.myTeamPlayers?.forEach(player => {
            if (player.name.toLowerCase() === playerProfile.name?.toLowerCase() || !player.name.trim()) return;
            if (!teammateData[player.name]) teammateData[player.name] = { matches: 0, wins: 0, draws: 0 };
            teammateData[player.name].matches++;
            if (match.result === 'VICTORIA') teammateData[player.name].wins++;
            if (match.result === 'EMPATE') teammateData[player.name].draws++;
        });
        match.opponentPlayers?.forEach(player => {
            if (!player.name.trim()) return;
            if (!opponentData[player.name]) opponentData[player.name] = { matches: 0, wins: 0 };
            opponentData[player.name].matches++;
            if (match.result === 'VICTORIA') opponentData[player.name].wins++;
        });
    });

    const MIN_MATCHES = 3;
    const partners = Object.entries(teammateData)
        .filter(([, data]) => data.matches >= MIN_MATCHES)
        .map(([name, data]) => ({ name, effectiveness: ((data.wins * 3 + data.draws) / (data.matches * 3)) * 100 }));
    
    if (partners.length > 0) {
        const bestPartner = partners.sort((a, b) => b.effectiveness - a.effectiveness)[0];
        if (bestPartner.effectiveness > 65) {
            insights.push({
                icon: '🤝',
                title: 'Mejor Socio',
                description: `Tu mejor socio es ${bestPartner.name}, con quien tienes un ${bestPartner.effectiveness.toFixed(0)}% de efectividad.`
            });
        }
    }

    const rivals = Object.entries(opponentData)
        .filter(([, data]) => data.matches >= MIN_MATCHES)
        .map(([name, data]) => ({ name, winRate: (data.wins / data.matches) * 100 }));

    if (rivals.length > 0) {
        const nemesis = rivals.sort((a, b) => a.winRate - b.winRate)[0];
        if (nemesis.winRate < 35) {
            insights.push({
                icon: '⚔️',
                title: 'Némesis',
                description: `Tu rival más difícil es ${nemesis.name}, contra quien solo ganas el ${nemesis.winRate.toFixed(0)}% de las veces.`
            });
        }
    }

    // Return up to 3 insights
    return insights.slice(0, 3);
};
