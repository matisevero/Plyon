
import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { MoraleLevel, type Match, type HistoricalRecords, type PlayerMorale, type FeaturedInsight, type SeasonRating } from '../../types';
import { calculateHistoricalRecords, calculatePlayerMorale, calculateAveragePerformance, parseLocalDate, generateFeaturedInsights, calculateSeasonRating } from '../../utils/analytics';
import Card from '../../components/common/Card';
import StatCard from '../../components/StatCard';
import RecentForm from '../../components/RecentForm';
import { Loader } from '../../components/Loader';
import YearFilter from '../../components/YearFilter';
import { TrendingUpIcon } from '../../components/icons/TrendingUpIcon';
import { ChartLineDownIcon } from '../../components/icons/ChartLineDownIcon';
import { TrophyIcon } from '../../components/icons/TrophyIcon';

interface StreaksWidgetProps {
  matches: Match[];
}

const MoraleDisplay: React.FC<{ morale: PlayerMorale | null, isLoading: boolean, isAverage?: boolean }> = ({ morale, isLoading, isAverage }) => {
    const { theme } = useTheme();

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', color: theme.colors.secondaryText, padding: theme.spacing.large }}><Loader /> <p>Calculando...</p></div>;
    }

    if (!morale) {
        return null;
    }
    
    const moraleConfig = {
        [MoraleLevel.MODO_D10S]: { icon: '👑', color: '#FFD700' },
        [MoraleLevel.ESTELAR]: { icon: '🔥', color: theme.colors.win },
        [MoraleLevel.INSPIRADO]: { icon: '✨', color: theme.colors.accent1 },
        [MoraleLevel.CONFIADO]: { icon: '✅', color: theme.colors.accent2 },
        [MoraleLevel.SOLIDO]: { icon: '💪', color: theme.colors.draw },
        [MoraleLevel.REGULAR]: { icon: '😐', color: theme.colors.secondaryText },
        [MoraleLevel.DUDOSO]: { icon: '🤔', color: '#FFB74D' },
        [MoraleLevel.BLOQUEADO]: { icon: '❌', color: '#FF8A65' },
        [MoraleLevel.EN_CAIDA_LIBRE]: { icon: '📉', color: theme.colors.loss },
        [MoraleLevel.DESCONOCIDO]: { icon: '❓', color: '#B00020' },
    }[morale.level];

    const trendIcon = useMemo(() => {
      if (!morale || isAverage) return null; // No trend icon for averages
      switch (morale.trend) {
        case 'up':
          return <TrendingUpIcon color={theme.colors.win} size={24} />;
        case 'down':
          return <ChartLineDownIcon color={theme.colors.loss} size={24} />;
        default:
          return null;
      }
    }, [morale, theme.colors, isAverage]);


    const styles: { [key: string]: React.CSSProperties } = {
        moraleCard: {
            backgroundColor: theme.colors.background,
            borderRadius: theme.borderRadius.large,
            padding: theme.spacing.large,
            display: 'flex',
            flexDirection: 'column' as 'column',
            gap: theme.spacing.medium,
            textAlign: 'center' as 'center',
            border: `1px solid ${moraleConfig.color}80`,
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.medium
        },
        icon: { fontSize: '1.75rem' },
        level: { 
            fontSize: theme.typography.fontSize.large, 
            fontWeight: 700, 
            color: moraleConfig.color 
        },
        barContainer: {
            position: 'relative',
            height: '10px',
            background: `linear-gradient(to right, ${theme.colors.loss}, ${theme.colors.draw}, ${theme.colors.win})`,
            borderRadius: theme.borderRadius.small,
        },
        marker: {
            position: 'absolute',
            top: '50%',
            left: `${morale.score}%`,
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'left 0.5s ease-out',
        },
        markerArrow: {
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${theme.colors.primaryText}`,
        },
        markerValue: {
            backgroundColor: theme.colors.primaryText,
            color: theme.colors.surface,
            padding: '2px 6px',
            borderRadius: theme.borderRadius.small,
            fontWeight: 'bold',
            fontSize: '0.8rem',
        },
        description: {
            fontSize: theme.typography.fontSize.small,
            color: theme.colors.secondaryText,
            lineHeight: 1.6,
            margin: 0,
            fontStyle: 'italic',
        },
        trendContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            backgroundColor: theme.colors.surface,
            padding: '2px 8px',
            borderRadius: theme.borderRadius.medium,
            border: `1px solid ${theme.colors.border}`,
            marginLeft: '4px'
        }
    };

    return (
        <div style={styles.moraleCard}>
            <div style={styles.header}>
                <span style={styles.icon}>{moraleConfig.icon}</span>
                <h4 style={styles.level}>{morale.level}</h4>
                {trendIcon && (
                    <div style={styles.trendContainer}>
                        {trendIcon}
                        {/* Always show streak count (x1, x2, etc) if trend exists */}
                        <span style={{
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            color: morale.trend === 'up' ? theme.colors.win : theme.colors.loss
                        }}>
                            x{morale.trendStreak}
                        </span>
                    </div>
                )}
            </div>
             <div style={styles.barContainer}>
                <div style={styles.marker}>
                    <span style={styles.markerValue}>{morale.score.toFixed(0)}</span>
                    <div style={styles.markerArrow}></div>
                </div>
            </div>
            <p style={styles.description}>{isAverage ? "Rendimiento promedio de la temporada." : `"${morale.description}"`}</p>
        </div>
    );
};

const SeasonRatingDisplay: React.FC<{ rating: SeasonRating, year: string }> = ({ rating, year }) => {
    const { theme } = useTheme();

    const getGradient = (tier: string) => {
        if (tier.includes('GOAT')) return 'linear-gradient(135deg, #d4af37, #f9e587, #aa8524)';
        if (tier.includes('The Best')) return `linear-gradient(135deg, ${theme.colors.accent1}, ${theme.colors.win})`;
        if (tier.includes('Clase Mundial')) return `linear-gradient(135deg, ${theme.colors.accent2}, #5C6BC0)`;
        return `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.background})`;
    };

    const isTopTier = rating.tierName.includes('GOAT') || rating.tierName.includes('The Best') || rating.tierName.includes('Clase Mundial');
    const bg = isTopTier ? getGradient(rating.tierName) : theme.colors.background;
    const textColor = isTopTier ? '#1a1a1a' : theme.colors.primaryText;
    const borderColor = isTopTier ? 'transparent' : theme.colors.border;

    const styles: { [key: string]: React.CSSProperties } = {
        card: {
            background: bg,
            borderRadius: theme.borderRadius.large,
            padding: theme.spacing.large,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            border: `1px solid ${borderColor}`,
            boxShadow: theme.shadows.medium,
            color: textColor
        },
        badge: {
            backgroundColor: isTopTier ? 'rgba(255,255,255,0.3)' : theme.colors.surface,
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '10px',
            display: 'inline-block'
        },
        tierTitle: {
            fontSize: '1.8rem',
            fontWeight: 900,
            margin: '0 0 5px 0',
            textTransform: 'uppercase',
            letterSpacing: '-0.5px'
        },
        score: {
            fontSize: '3rem',
            fontWeight: 900,
            lineHeight: 1,
            margin: '10px 0',
            opacity: 0.9
        },
        label: {
            fontSize: '0.8rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            opacity: 0.7
        },
        efficiency: {
            fontSize: '0.75rem',
            fontWeight: 500,
            opacity: 0.7,
            marginTop: '4px'
        },
        playerCompare: {
            marginTop: '15px',
            paddingTop: '10px',
            borderTop: isTopTier ? '1px solid rgba(0,0,0,0.1)' : `1px solid ${theme.colors.border}`,
            fontSize: '0.9rem',
            fontWeight: 600,
            width: '100%',
        }
    };

    return (
        <div style={styles.card}>
            <div style={styles.badge}>RESUMEN {year}</div>
            <h3 style={styles.tierTitle}>{rating.tierName}</h3>
            <p style={{margin: 0, fontSize: '0.95rem', opacity: 0.8}}>{rating.description}</p>
            
            <div style={styles.score}>
                {rating.score}
            </div>
            <div style={styles.label}>Puntos de Temporada</div>
            
            {rating.similarTo && (
                <div style={styles.playerCompare}>
                    <span style={{opacity: 0.7, fontSize: '0.8rem', display: 'block', marginBottom: '2px'}}>SIMILAR A</span>
                    {rating.similarTo}
                </div>
            )}

            {rating.efficiency !== undefined && (
                <div style={styles.efficiency}>
                    Factor de efectividad: {rating.efficiency}%
                </div>
            )}
        </div>
    );
};

const StreaksWidget: React.FC<StreaksWidgetProps> = ({ matches }) => {
  const { theme } = useTheme();
  // removed favoriteTeam usage
  const { playerProfile } = useData();

  const [morale, setMorale] = useState<PlayerMorale | null>(null);
  const [seasonRating, setSeasonRating] = useState<SeasonRating | null>(null);
  const [isMoraleLoading, setIsMoraleLoading] = useState(true);
  const [moraleError, setMoraleError] = useState<string | null>(null);

  // 1. All Matches Sorted (Newest First) - Base for everything
  const allSortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  }, [matches]);

  const availableYears = useMemo(() => {
    const yearSet = new Set(allSortedMatches.map(m => parseLocalDate(m.date).getFullYear()));
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [allSortedMatches]);
 
  const [selectedYear, setSelectedYear] = useState<string | 'all'>(availableYears.length > 0 ? availableYears[0].toString() : 'all');

  const currentFullYear = new Date().getFullYear();
  const showCurrentStreaks = selectedYear === 'all' || selectedYear === currentFullYear.toString();

  // 2. Filtered Matches (Strictly for the selected year)
  // Used for: "Libro de Récords", "Season Rating"
  const filteredMatches = useMemo(() => {
    if (selectedYear === 'all') return allSortedMatches;
    return allSortedMatches.filter(m => parseLocalDate(m.date).getFullYear().toString() === selectedYear);
  }, [allSortedMatches, selectedYear]);
  
  // 3. Contextual Matches (History up to the end of selected year)
  // Used for: "Active Streaks" (Ongoing streak at that point in time) AND "Current Morale" (Snapshot at that time)
  const matchesForStreaks = useMemo(() => {
      if (selectedYear === 'all') return allSortedMatches;
      const targetYear = parseInt(selectedYear);
      // Include all matches from the selected year AND older years.
      return allSortedMatches.filter(m => parseLocalDate(m.date).getFullYear() <= targetYear);
  }, [allSortedMatches, selectedYear]);

  // 4. Comparison Data (Previous Year Records)
  const previousYearMatches = useMemo(() => {
      if (selectedYear === 'all') return [];
      const prevYear = parseInt(selectedYear) - 1;
      return allSortedMatches.filter(m => parseLocalDate(m.date).getFullYear() === prevYear);
  }, [allSortedMatches, selectedYear]);

  const previousHistoricalRecords = useMemo(() => {
      if (previousYearMatches.length === 0) return null;
      return calculateHistoricalRecords(previousYearMatches);
  }, [previousYearMatches]);

  useEffect(() => {
    const fetchStats = () => {
        setIsMoraleLoading(true);
        setMoraleError(null);
        setMorale(null);
        setSeasonRating(null);

        if (showCurrentStreaks) {
            // For current year or all time, we show the "Current Mood" (Last 5 matches)
            const moraleData = calculatePlayerMorale(matchesForStreaks);
            setMorale(moraleData);
        } else {
            // For past years, we show the "Season Rating" based on the full year performance
            const rating = calculateSeasonRating(filteredMatches);
            setSeasonRating(rating);
        }
        
        setIsMoraleLoading(false);
    };
    
    fetchStats();
  }, [matchesForStreaks, filteredMatches, showCurrentStreaks, selectedYear]);

  const featuredInsights = useMemo(() => {
      const label = selectedYear === 'all' ? 'históricamente' : `en ${selectedYear}`;
      return generateFeaturedInsights(filteredMatches, playerProfile, label);
  }, [filteredMatches, playerProfile, selectedYear]);

  // Use matchesForStreaks here to allow streaks to cross year boundaries
  const { activeStreaks, last5MatchesStats, currentStreaks } = useMemo(() => {
    const sortedMatches = matchesForStreaks; // Already sorted Newest -> Oldest

    const last5 = sortedMatches.slice(0, 5);
    let last5Stats = null;
    if (last5.length > 0) {
        const wins = last5.filter(m => m.result === 'VICTORIA').length;
        const draws = last5.filter(m => m.result === 'EMPATE').length;
        const losses = last5.length - wins - draws;
        const points = wins * 3 + draws;
        const efectividad = (points / (last5.length * 3)) * 100;
        last5Stats = {
            record: `${wins}V-${draws}E-${losses}D`,
            efectividad: efectividad.toFixed(1) + '%'
        };
    }
    
    if (sortedMatches.length < 1) {
      return { activeStreaks: [], last5MatchesStats: last5Stats, currentStreaks: { win: 0, undefeated: 0, loss: 0, winless: 0, goal: 0, assist: 0, goalDrought: 0, assistDrought: 0 } };
    }

    // Streaks calculation
    let winStreak = 0; for (const match of sortedMatches) { if (match.result === 'VICTORIA') winStreak++; else break; }
    let undefeatedStreak = 0; for (const match of sortedMatches) { if (match.result !== 'DERROTA') undefeatedStreak++; else break; }
    let goalStreak = 0; for (const match of sortedMatches) { if (match.myGoals > 0) goalStreak++; else break; }
    let assistStreak = 0; for (const match of sortedMatches) { if (match.myAssists > 0) assistStreak++; else break; }
    let lossStreak = 0; for (const match of sortedMatches) { if (match.result === 'DERROTA') lossStreak++; else break; }
    let winlessStreak = 0; for (const match of sortedMatches) { if (match.result !== 'VICTORIA') winlessStreak++; else break; }
    let goalDrought = 0; for (const match of sortedMatches) { if (match.myGoals === 0) goalDrought++; else break; }
    let assistDrought = 0; for (const match of sortedMatches) { if (match.myAssists === 0) assistDrought++; else break; }

    const allPotentialStreaks = [
      { label: 'Victorias seguidas', value: winStreak, icon: '✅', type: 'positive' },
      { label: 'Partidos invicto', value: undefeatedStreak, icon: '🛡️', type: 'positive' },
      { label: 'Partidos marcando', value: goalStreak, icon: '⚽️', type: 'positive' },
      { label: 'Partidos asistiendo', value: assistStreak, icon: '👟', type: 'positive' },
      { label: 'Derrotas seguidas', value: lossStreak, icon: '❌', type: 'negative' },
      { label: 'Partidos sin ganar', value: winlessStreak, icon: '📉', type: 'negative' },
      { label: 'Partidos sin marcar', value: goalDrought, icon: '🥅', type: 'negative' },
      { label: 'Partidos sin asistir', value: assistDrought, icon: '💨', type: 'negative' },
    ];

    const activeStreaksList = allPotentialStreaks
      .filter(s => s.value >= 2)
      .sort((a, b) => {
        if (a.type === 'positive' && b.type === 'negative') return -1;
        if (a.type === 'negative' && b.type === 'positive') return 1;
        return b.value - a.value;
      })
      .slice(0, 4);

    return { 
        activeStreaks: activeStreaksList, 
        last5MatchesStats: last5Stats,
        currentStreaks: { win: winStreak, undefeated: undefeatedStreak, loss: lossStreak, winless: winlessStreak, goal: goalStreak, assist: assistStreak, goalDrought: goalDrought, assistDrought: assistDrought }
    };

  }, [matchesForStreaks]);

  // Historical Records use filteredMatches (Strictly within the year)
  const historicalRecords: HistoricalRecords = useMemo(() => 
    calculateHistoricalRecords(filteredMatches), 
  [filteredMatches]);

  const getRecordTrend = (key: keyof HistoricalRecords) => {
      if (!previousHistoricalRecords) return undefined;
      const currentVal = historicalRecords[key].value;
      const prevVal = previousHistoricalRecords[key].value;
      if (currentVal > prevVal) return 'up';
      if (currentVal < prevVal) return 'down';
      return 'neutral';
  }

  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    sectionTitle: {
      color: theme.colors.secondaryText,
      fontSize: theme.typography.fontSize.small,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      margin: `0 0 ${theme.spacing.medium} 0`,
      paddingBottom: theme.spacing.small,
      borderBottom: `1px solid ${theme.colors.border}`,
    },
    streakLabel: { color: theme.colors.secondaryText },
    recordsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: theme.spacing.medium,
    },
    featuredInsightsGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.medium,
    },
    featuredInsightItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: theme.spacing.medium,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      border: `1px solid ${theme.colors.border}`,
    },
    featuredInsightIcon: {
      fontSize: '1.5rem',
    },
    featuredInsightTitle: {
      margin: 0,
      fontWeight: 700,
      color: theme.colors.primaryText,
    },
    featuredInsightDesc: {
      margin: `0.25rem 0 0 0`,
      fontSize: '0.875rem',
      color: theme.colors.secondaryText,
      lineHeight: 1.5,
    }
  };
  
  const iconStyle: React.CSSProperties = { fontSize: '1.25rem' };
  
  const renderCurrentStreaks = () => {
    if (activeStreaks.length > 0) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: theme.spacing.medium }}>
          {activeStreaks.map(streak => (
            <StatCard 
              key={streak.label}
              label={streak.label}
              value={streak.value}
              icon={<span style={iconStyle}>{streak.icon}</span>}
              valueStyle={streak.type === 'negative' ? { color: theme.colors.loss } : undefined}
            />
          ))}
        </div>
      );
    }
    if (last5MatchesStats) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium }}>
          <StatCard label="Últimos 5 partidos" value={last5MatchesStats.record} />
          <StatCard label="% Efectividad (Últ. 5)" value={last5MatchesStats.efectividad} />
        </div>
      );
    }
    return <p style={{ ...styles.streakLabel, margin: 0, textAlign: 'center' }}>No hay rachas activas.</p>;
  };

  return (
    <Card title="Rachas, récords y moral">
      <div style={styles.container}>
        <div style={{ marginBottom: theme.spacing.large }}>
            <YearFilter years={availableYears} selectedYear={selectedYear} onSelectYear={setSelectedYear} size="small" allTimeLabel="General" />
        </div>

        {selectedYear !== 'all' && (
            <div>
                <h4 style={styles.sectionTitle}>{showCurrentStreaks ? 'Estado de ánimo actual' : 'Nivel de la Temporada'}</h4>
                {showCurrentStreaks ? (
                    <MoraleDisplay morale={morale} isLoading={isMoraleLoading} />
                ) : (
                    seasonRating && <SeasonRatingDisplay rating={seasonRating} year={selectedYear} />
                )}
                {moraleError && <p style={{color: theme.colors.loss, fontSize: '0.8rem', textAlign: 'center'}}>{moraleError}</p>}
            </div>
        )}

        {/* Always show active streaks, but label changes if past year */}
        <div>
            <h4 style={styles.sectionTitle}>{showCurrentStreaks ? 'Rachas activas' : `Rachas activas al cierre de ${selectedYear}`}</h4>
            {renderCurrentStreaks()}
            <div style={{marginTop: theme.spacing.large}}>
              <RecentForm matches={matchesForStreaks} />
            </div>
        </div>

        {featuredInsights.length > 0 && (
          <div>
            <h4 style={styles.sectionTitle}>Datos destacados</h4>
            <div style={styles.featuredInsightsGrid}>
              {featuredInsights.map(insight => (
                <div key={insight.title} style={styles.featuredInsightItem}>
                  <span style={styles.featuredInsightIcon}>{insight.icon}</span>
                  <div>
                    <h5 style={styles.featuredInsightTitle}>{insight.title}</h5>
                    <p style={styles.featuredInsightDesc}>{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 style={styles.sectionTitle}>Libro de récords ({selectedYear === 'all' ? 'Históricos' : selectedYear})</h4>
          <div style={styles.recordsGrid}>
            <StatCard 
                label="📈 Victorias seguidas" 
                value={historicalRecords.longestWinStreak.value} 
                count={historicalRecords.longestWinStreak.count} 
                isOngoing={currentStreaks.win >= historicalRecords.longestWinStreak.value && historicalRecords.longestWinStreak.value > 0} 
                trend={getRecordTrend('longestWinStreak')}
            />
            <StatCard 
                label="🧤 Partidos invicto" 
                value={historicalRecords.longestUndefeatedStreak.value} 
                count={historicalRecords.longestUndefeatedStreak.count} 
                isOngoing={currentStreaks.undefeated >= historicalRecords.longestUndefeatedStreak.value && historicalRecords.longestUndefeatedStreak.value > 0} 
                trend={getRecordTrend('longestUndefeatedStreak')}
            />
            <StatCard 
                label="📉 Derrotas seguidas" 
                value={historicalRecords.longestLossStreak.value} 
                count={historicalRecords.longestLossStreak.count} 
                isOngoing={currentStreaks.loss >= historicalRecords.longestLossStreak.value && historicalRecords.longestLossStreak.value > 0} 
                trend={getRecordTrend('longestLossStreak')}
                reverseTrendColor={true} // Up is Bad
            />
            <StatCard 
                label="❌ Partidos sin ganar" 
                value={historicalRecords.longestWinlessStreak.value} 
                count={historicalRecords.longestWinlessStreak.count} 
                isOngoing={currentStreaks.winless >= historicalRecords.longestWinlessStreak.value && historicalRecords.longestWinlessStreak.value > 0} 
                trend={getRecordTrend('longestWinlessStreak')}
                reverseTrendColor={true} // Up is Bad
            />
            <StatCard 
                label="🔥 Partidos marcando" 
                value={historicalRecords.longestGoalStreak.value} 
                count={historicalRecords.longestGoalStreak.count} 
                isOngoing={currentStreaks.goal >= historicalRecords.longestGoalStreak.value && historicalRecords.longestGoalStreak.value > 0} 
                trend={getRecordTrend('longestGoalStreak')}
            />
            <StatCard 
                label="💫 Partidos asistiendo" 
                value={historicalRecords.longestAssistStreak.value} 
                count={historicalRecords.longestAssistStreak.count} 
                isOngoing={currentStreaks.assist >= historicalRecords.longestAssistStreak.value && historicalRecords.longestAssistStreak.value > 0} 
                trend={getRecordTrend('longestAssistStreak')}
            />
            <StatCard 
                label="❄️ Sequía de goles" 
                value={historicalRecords.longestGoalDrought.value} 
                count={historicalRecords.longestGoalDrought.count} 
                isOngoing={currentStreaks.goalDrought >= historicalRecords.longestGoalDrought.value && historicalRecords.longestGoalDrought.value > 0} 
                trend={getRecordTrend('longestGoalDrought')}
                reverseTrendColor={true} // Up is Bad
            />
            <StatCard 
                label="💨 Sequía de asist." 
                value={historicalRecords.longestAssistDrought.value} 
                count={historicalRecords.longestAssistDrought.count} 
                isOngoing={currentStreaks.assistDrought >= historicalRecords.longestAssistDrought.value && historicalRecords.longestAssistDrought.value > 0} 
                trend={getRecordTrend('longestAssistDrought')}
                reverseTrendColor={true} // Up is Bad
            />
            <StatCard 
                label="🔝 Goles en 1 partido" 
                value={historicalRecords.bestGoalPerformance.value} 
                count={historicalRecords.bestGoalPerformance.count} 
                trend={getRecordTrend('bestGoalPerformance')}
            />
            <StatCard 
                label="☝🏻 Asist. en 1 partido" 
                value={historicalRecords.bestAssistPerformance.value} 
                count={historicalRecords.bestAssistPerformance.count} 
                trend={getRecordTrend('bestAssistPerformance')}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StreaksWidget;
