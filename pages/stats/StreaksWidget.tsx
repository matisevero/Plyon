
import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { MoraleLevel, type Match, type HistoricalRecords, type PlayerMorale, type FeaturedInsight } from '../../types';
import { calculateHistoricalRecords, calculatePlayerMorale, parseLocalDate, generateFeaturedInsights } from '../../utils/analytics';
import Card from '../../components/common/Card';
import StatCard from '../../components/StatCard';
import RecentForm from '../../components/RecentForm';
import { Loader } from '../../components/Loader';
import YearFilter from '../../components/YearFilter';
import { TrendingUpIcon } from '../../components/icons/TrendingUpIcon';
import { ChartLineDownIcon } from '../../components/icons/ChartLineDownIcon';

interface StreaksWidgetProps {
  matches: Match[];
}

const MoraleDisplay: React.FC<{ morale: PlayerMorale | null, isLoading: boolean }> = ({ morale, isLoading }) => {
    const { theme } = useTheme();

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', color: theme.colors.secondaryText, padding: theme.spacing.large }}><Loader /> <p>Calculando moral...</p></div>;
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
      if (!morale) return null;
      switch (morale.trend) {
        case 'up':
          return <TrendingUpIcon color={theme.colors.win} size={24} />;
        case 'down':
          return <ChartLineDownIcon color={theme.colors.loss} size={24} />;
        default:
          return null;
      }
    }, [morale, theme.colors]);


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
        }
    };

    return (
        <div style={styles.moraleCard}>
            <div style={styles.header}>
                <span style={styles.icon}>{moraleConfig.icon}</span>
                <h4 style={styles.level}>{morale.level}</h4>
                {trendIcon && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {trendIcon}
                        {morale.trendStreak > 1 && (
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                color: morale.trend === 'up' ? theme.colors.win : theme.colors.loss
                            }}>
                                ({morale.trendStreak})
                            </span>
                        )}
                    </div>
                )}
            </div>
             <div style={styles.barContainer}>
                <div style={styles.marker}>
                    <span style={styles.markerValue}>{morale.score.toFixed(0)}</span>
                    <div style={styles.markerArrow}></div>
                </div>
            </div>
            <p style={styles.description}>"{morale.description}"</p>
        </div>
    );
};


const StreaksWidget: React.FC<StreaksWidgetProps> = ({ matches }) => {
  const { theme } = useTheme();
  const { playerProfile } = useData();

  const [morale, setMorale] = useState<PlayerMorale | null>(null);
  const [isMoraleLoading, setIsMoraleLoading] = useState(true);
  const [moraleError, setMoraleError] = useState<string | null>(null);

  const availableYears = useMemo(() => {
    const yearSet = new Set(matches.map(m => parseLocalDate(m.date).getFullYear()));
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [matches]);
 
  const [selectedYear, setSelectedYear] = useState<string | 'all'>(availableYears.length > 0 ? availableYears[0].toString() : 'all');

  const currentFullYear = new Date().getFullYear();
  const showCurrentStreaks = selectedYear === 'all' || selectedYear === currentFullYear.toString();

  const filteredMatches = useMemo(() => {
    if (selectedYear === 'all') return matches;
    return matches.filter(m => parseLocalDate(m.date).getFullYear().toString() === selectedYear);
  }, [matches, selectedYear]);
  
  useEffect(() => {
    const fetchMorale = () => {
        setIsMoraleLoading(true);
        setMoraleError(null);
        setMorale(null);

        const moraleData = calculatePlayerMorale(filteredMatches);
        
        if (!moraleData) {
            setIsMoraleLoading(false);
            return;
        }
        
        setMorale(moraleData);
        setIsMoraleLoading(false);
    };
    
    fetchMorale();
  }, [filteredMatches]);

  const featuredInsights = useMemo(() => {
      return generateFeaturedInsights(filteredMatches, playerProfile);
  }, [filteredMatches, playerProfile]);

  const { activeStreaks, last5MatchesStats, currentStreaks } = useMemo(() => {
    const sortedMatches = [...filteredMatches].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());

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

  }, [filteredMatches]);

  const historicalRecords: HistoricalRecords = useMemo(() => 
    calculateHistoricalRecords(filteredMatches), 
  [filteredMatches]);

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

        <div>
            <h4 style={styles.sectionTitle}>Estado de ánimo</h4>
            <MoraleDisplay morale={morale} isLoading={isMoraleLoading} />
            {moraleError && <p style={{color: theme.colors.loss, fontSize: '0.8rem', textAlign: 'center'}}>{moraleError}</p>}
        </div>

        {showCurrentStreaks && (
          <div>
            <h4 style={styles.sectionTitle}>Rachas activas</h4>
            {renderCurrentStreaks()}
            <div style={{marginTop: theme.spacing.large}}>
              <RecentForm matches={filteredMatches} />
            </div>
          </div>
        )}

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
            <StatCard label="📈 Victorias seguidas" value={historicalRecords.longestWinStreak.value} count={historicalRecords.longestWinStreak.count} isOngoing={showCurrentStreaks && currentStreaks.win >= historicalRecords.longestWinStreak.value && historicalRecords.longestWinStreak.value > 0} />
            <StatCard label="🧤 Partidos invicto" value={historicalRecords.longestUndefeatedStreak.value} count={historicalRecords.longestUndefeatedStreak.count} isOngoing={showCurrentStreaks && currentStreaks.undefeated >= historicalRecords.longestUndefeatedStreak.value && historicalRecords.longestUndefeatedStreak.value > 0} />
            <StatCard label="📉 Derrotas seguidas" value={historicalRecords.longestLossStreak.value} count={historicalRecords.longestLossStreak.count} isOngoing={showCurrentStreaks && currentStreaks.loss >= historicalRecords.longestLossStreak.value && historicalRecords.longestLossStreak.value > 0} />
            <StatCard label="❌ Partidos sin ganar" value={historicalRecords.longestWinlessStreak.value} count={historicalRecords.longestWinlessStreak.count} isOngoing={showCurrentStreaks && currentStreaks.winless >= historicalRecords.longestWinlessStreak.value && historicalRecords.longestWinlessStreak.value > 0} />
            <StatCard label="🔥 Partidos marcando" value={historicalRecords.longestGoalStreak.value} count={historicalRecords.longestGoalStreak.count} isOngoing={showCurrentStreaks && currentStreaks.goal >= historicalRecords.longestGoalStreak.value && historicalRecords.longestGoalStreak.value > 0} />
            <StatCard label="💫 Partidos asistiendo" value={historicalRecords.longestAssistStreak.value} count={historicalRecords.longestAssistStreak.count} isOngoing={showCurrentStreaks && currentStreaks.assist >= historicalRecords.longestAssistStreak.value && historicalRecords.longestAssistStreak.value > 0} />
            <StatCard label="❄️ Sequía de goles" value={historicalRecords.longestGoalDrought.value} count={historicalRecords.longestGoalDrought.count} isOngoing={showCurrentStreaks && currentStreaks.goalDrought >= historicalRecords.longestGoalDrought.value && historicalRecords.longestGoalDrought.value > 0} />
            <StatCard label="💨 Sequía de asist." value={historicalRecords.longestAssistDrought.value} count={historicalRecords.longestAssistDrought.count} isOngoing={showCurrentStreaks && currentStreaks.assistDrought >= historicalRecords.longestAssistDrought.value && historicalRecords.longestAssistDrought.value > 0} />
            <StatCard label="🔝 Goles en 1 partido" value={historicalRecords.bestGoalPerformance.value} count={historicalRecords.bestGoalPerformance.count} />
            <StatCard label="☝🏻 Asist. en 1 partido" value={historicalRecords.bestAssistPerformance.value} count={historicalRecords.bestAssistPerformance.count} />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StreaksWidget;
