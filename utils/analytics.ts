
import { Match, HistoricalRecords, PlayerMorale, SeasonRating, FeaturedInsight, PlayerProfileData, QualifiersProgress, WorldCupProgress, Goal, CustomAchievement, GoalMetric, MoraleLevel } from '../types';

// --- DATE UTILS ---
export const parseLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// --- COLOR UTILS ---
export const getColorForString = (str: string): string => {
  const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// --- CONSTANTS ---
export const WORLD_CUP_LOGO: Record<string, string> = {
    light: 'https://www.dropbox.com/scl/fi/9iste5u6ze5ed3xfchrin/WorldCup2026-Light.png?rlkey=lzil2u05fdp07oou9m2vi6evh&raw=1',
    dark: 'https://www.dropbox.com/scl/fi/t2h7gje7410b3efp3v0vc/WorldCup2026-Dark.png?rlkey=59cw33t0q3bkc39v0dr204nf6&raw=1'
};

export const CONFEDERATIONS: any = {
    CONMEBOL: {
        name: 'CONMEBOL (Sudamérica)',
        slots: 6,
        playoffSlots: 1,
        matchesToPlay: 18,
        difficulty: 'Extrema',
        pointsMultiplier: 3,
        formatDescription: 'Liga de todos contra todos',
        simulationType: 'league',
        teams: ['Brasil', 'Argentina', 'Uruguay', 'Colombia', 'Ecuador', 'Chile', 'Perú', 'Paraguay', 'Venezuela', 'Bolivia'],
        logo: { 
            light: 'https://www.dropbox.com/scl/fi/f4orohs5hbzw9p787xb0b/CONMEBOL-Light.png?rlkey=nmqzb4y77hyktik3g96facwf3&raw=1',
            dark: 'https://www.dropbox.com/scl/fi/zfcbe6hdg5qajj3f8xzx8/CONMEBOL-Dark.png?rlkey=qc5hxdjars73vdi17f53oh530&raw=1'
        }
    },
    UEFA: {
        name: 'UEFA (Europa)',
        slots: 16,
        playoffSlots: 0,
        matchesToPlay: 10,
        difficulty: 'Alta',
        pointsMultiplier: 2.5,
        formatDescription: 'Fase de Grupos',
        simulationType: 'groups',
        teams: ['Francia', 'Inglaterra', 'España', 'Alemania', 'Italia', 'Portugal', 'Países Bajos', 'Croacia', 'Bélgica', 'Dinamarca'],
        logo: { 
            light: 'https://www.dropbox.com/scl/fi/b8fha5qnrnwp1g6mgoos5/UEFA-Light-01.png?rlkey=36snoo25t7rsqypsnqsxxigol&raw=1',
            dark: 'https://www.dropbox.com/scl/fi/yt3piyogka49f572zoi64/UEFA-Dark-01.png?rlkey=h6za381d16fkdoji3hv27t4vo&raw=1'
        }
    },
    CONCACAF: {
        name: 'CONCACAF (Norte/Centroamérica)',
        slots: 6,
        playoffSlots: 2,
        matchesToPlay: 14,
        difficulty: 'Media',
        pointsMultiplier: 2,
        formatDescription: 'Octagonal Final',
        simulationType: 'league',
        teams: ['USA', 'México', 'Canadá', 'Costa Rica', 'Panamá', 'Jamaica', 'Honduras', 'El Salvador'],
        logo: { 
            light: 'https://www.dropbox.com/scl/fi/b7hnalgal7low3w33hue2/CONCACAF-Light.png?rlkey=jio2cnyrh37cusx9mtbcnjkck&raw=1',
            dark: 'https://www.dropbox.com/scl/fi/y8qr9fcw0yaqrcewqepqn/CONCACAF-Dark.png?rlkey=275o0jvyfyzgp1y9kr1cj6iih&raw=1'
        }
    },
    CAF: {
        name: 'CAF (África)',
        slots: 9,
        playoffSlots: 1,
        matchesToPlay: 10,
        difficulty: 'Alta',
        pointsMultiplier: 2.5,
        formatDescription: 'Fase de Grupos',
        simulationType: 'groups',
        teams: ['Marruecos', 'Senegal', 'Egipto', 'Nigeria', 'Camerún', 'Argelia', 'Costa de Marfil', 'Ghana'],
        logo: { 
            light: 'https://www.dropbox.com/scl/fi/z3qq3uvt7wkz79zqp19co/CAF-Light.png?rlkey=9bd01fncmbz7wcrw9r6gwbcs6&raw=1',
            dark: 'https://www.dropbox.com/scl/fi/9xr8y26q5ca6tfu3dd8d4/CAF-Dark.png?rlkey=winct131mx52ox6frfyi7t6kk&raw=1'
        }
    },
    AFC: {
        name: 'AFC (Asia)',
        slots: 8,
        playoffSlots: 1,
        matchesToPlay: 10,
        difficulty: 'Media',
        pointsMultiplier: 2,
        formatDescription: 'Fase de Grupos',
        simulationType: 'groups',
        teams: ['Japón', 'Corea del Sur', 'Irán', 'Australia', 'Arabia Saudita', 'Qatar'],
        logo: { 
            light: 'https://www.dropbox.com/scl/fi/uou6dg1qp6ov35r4pywxz/AFC-Light.png?rlkey=ukpn9qbw7x27sop6rmnjb9aq9&raw=1',
            dark: 'https://www.dropbox.com/scl/fi/y8z65ssfbgm622ig92tr6/AFC-Dark.png?rlkey=skx9dhivtsqxal88ik29vbcix&raw=1'
        }
    },
    OFC: {
        name: 'OFC (Oceanía)',
        slots: 1,
        playoffSlots: 1,
        matchesToPlay: 6,
        difficulty: 'Baja',
        pointsMultiplier: 1.5,
        formatDescription: 'Fase de Grupos',
        simulationType: 'groups',
        teams: ['Nueva Zelanda', 'Fiji', 'Islas Salomón', 'Tahití'],
        logo: { 
            light: 'https://www.dropbox.com/scl/fi/0qnubqlcd9rxukfkd069s/OFC-Light.png?rlkey=0gwbt2xloc0uni79o1qbstt25&raw=1',
            dark: 'https://www.dropbox.com/scl/fi/dsqo38bvygbpvcdhjuknu/OFC-Dark.png?rlkey=k9tze4xf4lzgi8xcepr23qf6g&raw=1'
        }
    }
};

// --- HISTORICAL RECORDS ---
export const calculateHistoricalRecords = (matches: Match[]): HistoricalRecords => {
    // Sort matches by date ascending
    const sortedMatches = [...matches].sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

    const records: HistoricalRecords = {
        longestWinStreak: { value: 0, count: 0 },
        longestUndefeatedStreak: { value: 0, count: 0 },
        longestDrawStreak: { value: 0, count: 0 },
        longestLossStreak: { value: 0, count: 0 },
        longestWinlessStreak: { value: 0, count: 0 },
        longestGoalStreak: { value: 0, count: 0 },
        longestAssistStreak: { value: 0, count: 0 },
        longestGoalDrought: { value: 0, count: 0 },
        longestAssistDrought: { value: 0, count: 0 },
        bestGoalPerformance: { value: 0, count: 0 },
        bestAssistPerformance: { value: 0, count: 0 }
    };

    let currentWinStreak = 0;
    let currentUndefeatedStreak = 0;
    let currentDrawStreak = 0;
    let currentLossStreak = 0;
    let currentWinlessStreak = 0;
    let currentGoalStreak = 0;
    let currentAssistStreak = 0;
    let currentGoalDrought = 0;
    let currentAssistDrought = 0;

    sortedMatches.forEach(match => {
        // Streaks
        if (match.result === 'VICTORIA') {
            currentWinStreak++;
            currentWinlessStreak = 0;
            currentLossStreak = 0;
            currentDrawStreak = 0;
        } else {
            currentWinStreak = 0;
            currentWinlessStreak++;
            if (match.result === 'DERROTA') {
                currentLossStreak++;
                currentDrawStreak = 0;
            } else {
                currentLossStreak = 0;
                currentDrawStreak++;
            }
        }

        if (match.result !== 'DERROTA') {
            currentUndefeatedStreak++;
        } else {
            currentUndefeatedStreak = 0;
        }

        // Goals/Assists Streaks
        if (match.myGoals > 0) {
            currentGoalStreak++;
            currentGoalDrought = 0;
        } else {
            currentGoalStreak = 0;
            currentGoalDrought++;
        }

        if (match.myAssists > 0) {
            currentAssistStreak++;
            currentAssistDrought = 0;
        } else {
            currentAssistStreak = 0;
            currentAssistDrought++;
        }

        // Update Max Records
        records.longestWinStreak.value = Math.max(records.longestWinStreak.value, currentWinStreak);
        records.longestUndefeatedStreak.value = Math.max(records.longestUndefeatedStreak.value, currentUndefeatedStreak);
        records.longestDrawStreak.value = Math.max(records.longestDrawStreak.value, currentDrawStreak);
        records.longestLossStreak.value = Math.max(records.longestLossStreak.value, currentLossStreak);
        records.longestWinlessStreak.value = Math.max(records.longestWinlessStreak.value, currentWinlessStreak);
        records.longestGoalStreak.value = Math.max(records.longestGoalStreak.value, currentGoalStreak);
        records.longestAssistStreak.value = Math.max(records.longestAssistStreak.value, currentAssistStreak);
        records.longestGoalDrought.value = Math.max(records.longestGoalDrought.value, currentGoalDrought);
        records.longestAssistDrought.value = Math.max(records.longestAssistDrought.value, currentAssistDrought);
        
        // Single Match Records
        if (match.myGoals > records.bestGoalPerformance.value) {
            records.bestGoalPerformance.value = match.myGoals;
            records.bestGoalPerformance.count = 1;
        } else if (match.myGoals === records.bestGoalPerformance.value && match.myGoals > 0) {
            records.bestGoalPerformance.count++;
        }

        if (match.myAssists > records.bestAssistPerformance.value) {
            records.bestAssistPerformance.value = match.myAssists;
            records.bestAssistPerformance.count = 1;
        } else if (match.myAssists === records.bestAssistPerformance.value && match.myAssists > 0) {
            records.bestAssistPerformance.count++;
        }
    });

    return records;
};

// --- MATH UTILS ---
export const calculateStandardDeviation = (values: number[]): number => {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
};

export const calculateAveragePerformance = (matches: Match[]) => {
    if (matches.length === 0) return { goals: 0, assists: 0, rating: 0 };
    const goals = matches.reduce((acc, m) => acc + m.myGoals, 0) / matches.length;
    const assists = matches.reduce((acc, m) => acc + m.myAssists, 0) / matches.length;
    // Simple rating logic
    const rating = (goals * 1.5) + assists + (matches.filter(m => m.result === 'VICTORIA').length / matches.length * 2);
    return { goals, assists, rating };
};

// --- GAME LOGIC ---

export const getProgressForGoal = (goal: Goal, matches: Match[]): number => {
    let relevantMatches = matches;
    
    // Filter by Date
    if (goal.startDate && goal.endDate) {
        const start = parseLocalDate(goal.startDate).getTime();
        const end = parseLocalDate(goal.endDate).getTime();
        relevantMatches = matches.filter(m => {
            const date = parseLocalDate(m.date).getTime();
            return date >= start && date <= end;
        });
    }

    if (goal.goalType === 'peak') {
        if (relevantMatches.length === 0) return 0;
        if (goal.metric === 'myGoals') return Math.max(...relevantMatches.map(m => m.myGoals));
        if (goal.metric === 'myAssists') return Math.max(...relevantMatches.map(m => m.myAssists));
        return 0;
    }

    if (goal.goalType === 'streak') {
        const records = calculateHistoricalRecords(relevantMatches);
        if (goal.metric === 'longestWinStreak') return records.longestWinStreak.value;
        if (goal.metric === 'longestUndefeatedStreak') return records.longestUndefeatedStreak.value;
        return 0;
    }

    const totalMatches = relevantMatches.length;
    if (totalMatches === 0) return 0;

    switch (goal.metric) {
        case 'myGoals':
            return relevantMatches.reduce((sum, m) => sum + m.myGoals, 0);
        case 'myAssists':
            return relevantMatches.reduce((sum, m) => sum + m.myAssists, 0);
        case 'VICTORIA':
            return relevantMatches.filter(m => m.result === 'VICTORIA').length;
        case 'winRate':
            return (relevantMatches.filter(m => m.result === 'VICTORIA').length / totalMatches) * 100;
        case 'gpm':
            return relevantMatches.reduce((sum, m) => sum + m.myGoals, 0) / totalMatches;
        case 'undefeatedRate':
            return (relevantMatches.filter(m => m.result !== 'DERROTA').length / totalMatches) * 100;
        default:
            return 0;
    }
};

export const evaluateCustomAchievement = (achievement: CustomAchievement, matches: Match[]): boolean => {
    // This requires complex streak logic for every metric type.
    // Simplifying: we calculate historical records for the passed matches and check the value.
    const records = calculateHistoricalRecords(matches);
    const { metric, value, operator } = achievement.condition;
    
    let achievedValue = 0;
    switch (metric) {
        case 'winStreak': achievedValue = records.longestWinStreak.value; break;
        case 'lossStreak': achievedValue = records.longestLossStreak.value; break;
        case 'undefeatedStreak': achievedValue = records.longestUndefeatedStreak.value; break;
        case 'winlessStreak': achievedValue = records.longestWinlessStreak.value; break;
        case 'goalStreak': achievedValue = records.longestGoalStreak.value; break;
        case 'assistStreak': achievedValue = records.longestAssistStreak.value; break;
        case 'goalDrought': achievedValue = records.longestGoalDrought.value; break;
        case 'assistDrought': achievedValue = records.longestAssistDrought.value; break;
        // Complex conditions not fully implemented in basic records, skipping for MVP
        default: achievedValue = 0;
    }

    if (operator === 'greater_than_or_equal_to') {
        return achievedValue >= value;
    }
    return false;
};

export const calculatePlayerMorale = (matches: Match[]): PlayerMorale | null => {
    if (matches.length < 3) return null;
    
    // Sort matches newest first
    const sortedMatches = [...matches].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
    const last5 = sortedMatches.slice(0, 5);
    
    // Calculate Score (0-100)
    let score = 50; // Base
    
    // Recent Form Weight
    last5.forEach((m, i) => {
        const weight = (5 - i) * 2; // More recent = more weight
        if (m.result === 'VICTORIA') score += weight * 2;
        else if (m.result === 'EMPATE') score += weight;
        else score -= weight * 1.5;
        
        score += (m.myGoals * 2) + m.myAssists;
    });

    score = Math.max(0, Math.min(100, score));

    // Determine Level
    let level = MoraleLevel.REGULAR;
    let description = "Estás en un momento normal.";

    if (score >= 90) { level = MoraleLevel.MODO_D10S; description = "Injugable. Todo lo que tocas es oro."; }
    else if (score >= 80) { level = MoraleLevel.ESTELAR; description = "Estás brillando en el campo."; }
    else if (score >= 70) { level = MoraleLevel.INSPIRADO; description = "Con mucha confianza y buen juego."; }
    else if (score >= 60) { level = MoraleLevel.CONFIADO; description = "Te sientes bien y los resultados acompañan."; }
    else if (score >= 50) { level = MoraleLevel.SOLIDO; description = "Rendimiento constante y fiable."; }
    else if (score >= 40) { level = MoraleLevel.REGULAR; description = "Ni bien ni mal, hay que apretar."; }
    else if (score >= 30) { level = MoraleLevel.DUDOSO; description = "Algunas dudas en tu juego reciente."; }
    else if (score >= 20) { level = MoraleLevel.BLOQUEADO; description = "Necesitas un buen partido para desbloquearte."; }
    else { level = MoraleLevel.EN_CAIDA_LIBRE; description = "Mala racha. Es momento de resetear."; }

    // Trend calculation
    // Compare last 3 vs previous 3
    const currentAvg = last5.slice(0, 3).reduce((acc, m) => acc + (m.result === 'VICTORIA' ? 3 : m.result === 'EMPATE' ? 1 : 0), 0) / 3;
    const prevAvg = last5.slice(3, 5).length > 0 ? last5.slice(3, 5).reduce((acc, m) => acc + (m.result === 'VICTORIA' ? 3 : m.result === 'EMPATE' ? 1 : 0), 0) / last5.slice(3, 5).length : currentAvg;
    
    let trend: 'up' | 'down' | 'same' | 'new' = 'same';
    if (currentAvg > prevAvg) trend = 'up';
    else if (currentAvg < prevAvg) trend = 'down';

    return {
        level,
        score,
        description,
        recentMatchesSummary: { matchesConsidered: last5.length, record: '', goals: 0, assists: 0 }, // Simplified
        trend,
        trendStreak: 1
    };
};

export const calculateSeasonRating = (matches: Match[]): SeasonRating => {
    const totalMatches = matches.length;
    if (totalMatches === 0) return { tierName: 'N/A', description: 'Sin partidos', score: 0, efficiency: 0 };

    const wins = matches.filter(m => m.result === 'VICTORIA').length;
    const draws = matches.filter(m => m.result === 'EMPATE').length;
    const goals = matches.reduce((s, m) => s + m.myGoals, 0);
    const assists = matches.reduce((s, m) => s + m.myAssists, 0);
    const points = wins * 3 + draws;
    const efficiency = (points / (totalMatches * 3)) * 100;
    
    // Score Formula
    const score = (points * 10) + (goals * 5) + (assists * 3) + (efficiency * 2);
    
    let tierName = 'Novato';
    let description = 'Temporada de aprendizaje.';

    if (score > 1500) { tierName = 'GOAT 🐐'; description = 'Una temporada legendaria.'; }
    else if (score > 1000) { tierName = 'The Best 🏆'; description = 'Dominaste la liga.'; }
    else if (score > 750) { tierName = 'Clase Mundial 🌍'; description = 'Rendimiento de élite.'; }
    else if (score > 500) { tierName = 'Estrella ⭐'; description = 'Gran temporada.'; }
    else if (score > 250) { tierName = 'Profesional 🎩'; description = 'Sólido y cumplidor.'; }
    
    return { tierName, description, score: Math.round(score), efficiency: Math.round(efficiency) };
};

export const generateFeaturedInsights = (matches: Match[], profile: PlayerProfileData): FeaturedInsight[] => {
    const insights: FeaturedInsight[] = [];
    // Example logic
    const wins = matches.filter(m => m.result === 'VICTORIA').length;
    if (wins > 10) {
        insights.push({ icon: '🔥', title: 'Ganador', description: `Has ganado ${wins} partidos este año.` });
    }
    const goals = matches.reduce((s, m) => s + m.myGoals, 0);
    if (goals > 20) {
        insights.push({ icon: '⚽', title: 'Goleador', description: `Llevas ${goals} goles anotados.` });
    }
    return insights;
};

export const generateQualifiersStandings = (progress: QualifiersProgress, playerName: string, campaignMatches: Match[]) => {
    const conf = CONFEDERATIONS[progress.confederation];
    const teams = conf.teams; // ["Brasil", "Argentina", ...]
    const myName = playerName || 'Jugador';
    
    // Initialize stats
    const standings: Record<string, { name: string, points: number, played: number, wins: number, draws: number, losses: number, gd: number }> = {};
    
    // --- FIX START: Recalculate stats dynamically from the actual matches ---
    // Instead of trusting progress.matchesPlayed which might be desynced/corrupted
    let realPlayed = 0;
    let realPoints = 0;
    let realWins = 0;
    let realDraws = 0;
    let realLosses = 0;
    let realGd = 0;

    if (campaignMatches && campaignMatches.length > 0) {
        campaignMatches.forEach(m => {
            realPlayed++;
            realGd += (m.goalDifference || 0);
            if (m.result === 'VICTORIA') { realPoints += 3; realWins++; }
            else if (m.result === 'EMPATE') { realPoints += 1; realDraws++; }
            else { realLosses++; }
        });
    } else {
        // Fallback to progress if no matches passed (though UI usually passes them)
        realPlayed = progress.matchesPlayed;
        realPoints = progress.points;
        realWins = progress.record.wins;
        realDraws = progress.record.draws;
        realLosses = progress.record.losses;
        realGd = progress.goalDifference;
    }
    // --- FIX END ---
    
    // Add "Me" / "My Team"
    standings[myName] = {
        name: myName,
        points: realPoints,
        played: realPlayed,
        wins: realWins,
        draws: realDraws,
        losses: realLosses,
        gd: realGd
    };

    // Add Simulated CPU Teams
    const seed = progress.campaignNumber * 123; // Simple seed
    const pseudoRandom = (input: number) => {
        const x = Math.sin(seed + input) * 10000;
        return x - Math.floor(x);
    };

    teams.forEach((team: string, index: number) => {
        if (!progress.group || progress.group.length === 0 || progress.group.includes(team)) {
            // Only include if in group (for group simulation) or if simulated (for league)
            const strength = 1 - (index / teams.length); // 1.0 down to 0.0
            const played = realPlayed; // Keep CPU pace with User (using calculated value)
            
            // Randomize slightly
            const luck = pseudoRandom(index); 
            const performance = (strength * 0.7) + (luck * 0.3);
            
            const wins = Math.round(played * performance);
            const draws = Math.round(played * (1 - performance) * 0.4);
            const losses = played - wins - draws;
            const pts = (wins * 3) + draws;
            const gd = Math.round((wins - losses) * 1.5);

            standings[team] = {
                name: team,
                points: pts,
                played: played,
                wins: wins,
                draws: draws,
                losses: losses,
                gd: gd
            };
        }
    });

    // If 'groups' mode, filter only group members + user
    let teamList = Object.values(standings);
    if (conf.simulationType === 'groups' && progress.group) {
        const groupSet = new Set([myName, ...progress.group]);
        teamList = teamList.filter(t => groupSet.has(t.name));
    }

    // Sort
    return teamList.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.wins - a.wins;
    }).map((t, i) => ({ ...t, position: i + 1 }));
};

export const calculateMatchCareerPoints = (match: Match, profile?: PlayerProfileData): number => {
    // Basic logic
    let points = match.result === 'VICTORIA' ? 10 : match.result === 'EMPATE' ? 3 : 1;
    points += match.myGoals * 2;
    points += match.myAssists * 1;
    
    // Bonus for World Cup / Qualifiers
    if (match.matchMode === 'world-cup') points *= 5;
    if (match.matchMode === 'qualifiers') points *= 3;
    if (match.earnedPoints) points += match.earnedPoints; // Add explicit points if stored

    return Math.round(points);
};

export const inferMatchMode = (match: Match, profile?: PlayerProfileData): 'regular' | 'world-cup' | 'qualifiers' => {
    if (match.matchMode) return match.matchMode;
    // Fallback logic by date could be here if needed
    return 'regular';
};
