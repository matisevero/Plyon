
import React, { useState } from 'react';
import type { Match } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { ChevronIcon } from '../../components/icons/ChevronIcon';
import { parseLocalDate } from '../../utils/analytics';
import SectionHelp from '../../components/common/SectionHelp';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { ClipboardIcon } from '../../components/icons/ClipboardIcon';

interface HistoricalAnalysisProps {
  matches: Match[];
}

interface MonthlyStats {
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  matchCount: number;
  matches: Match[];
}

const monthOrder = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const HistoricalAnalysis: React.FC<HistoricalAnalysisProps> = ({ matches }) => {
  const { theme } = useTheme();

  const statsByYearAndMonth = React.useMemo(() => {
    const data: Record<string, Record<string, MonthlyStats>> = {};
    
    matches.forEach(match => {
      const date = parseLocalDate(match.date);
      const year = date.getFullYear().toString();
      const month = date.toLocaleString('es-ES', { month: 'long' });
      const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
      
      if (!data[year]) data[year] = {};
      if (!data[year][capitalizedMonth]) {
        data[year][capitalizedMonth] = { wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, matchCount: 0, matches: [] };
      }
      
      const stats = data[year][capitalizedMonth];
      stats.matchCount++;
      stats.goals += match.myGoals;
      stats.assists += match.myAssists;
      if (match.result === 'VICTORIA') stats.wins++;
      else if (match.result === 'EMPATE') stats.draws++;
      else if (match.result === 'DERROTA') stats.losses++;
      stats.matches.push(match);
    });

    for (const year in data) {
        for (const month in data[year]) {
            data[year][month].matches.sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
        }
    }

    return data;
  }, [matches]);
  
  const sortedYears = Object.keys(statsByYearAndMonth).sort((a, b) => parseInt(b) - parseInt(a));

  const getInitialState = () => {
    if (sortedYears.length === 0) {
      return { year: null, month: null };
    }
    const latestYear = sortedYears[0];
    const monthsOfLatestYear = Object.keys(statsByYearAndMonth[latestYear]).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    const latestMonth = monthsOfLatestYear.length > 0 ? monthsOfLatestYear[monthsOfLatestYear.length - 1] : null;

    return {
      year: latestYear,
      month: latestMonth ? `${latestYear}-${latestMonth}` : null,
    };
  };

  const initialState = getInitialState();
  const [expandedYear, setExpandedYear] = useState<string | null>(initialState.year);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(initialState.month);

  const historicalGuide = [
      { title: "Desglose Mensual", content: "Profundiza en tus datos. Despliega cada año para ver tu rendimiento mes a mes.", icon: <CalendarIcon size={48} /> },
      { title: "Detalle de Partidos", content: "Al expandir un mes, verás la lista de partidos jugados con sus estadísticas individuales.", icon: <ClipboardIcon size={48} /> }
  ];


  const getResultStyle = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
    const base = {
        width: '24px', height: '24px', borderRadius: '6px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
        fontWeight: 'bold', flexShrink: 0, color: theme.colors.textOnAccent
    };
    switch (result) {
      case 'VICTORIA': return { ...base, backgroundColor: theme.colors.win };
      case 'DERROTA': return { ...base, backgroundColor: theme.colors.loss };
      case 'EMPATE': return { ...base, backgroundColor: theme.colors.draw };
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    yearContainer: {},
    yearHeader: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: theme.spacing.medium, backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.medium, cursor: 'pointer',
      border: `1px solid ${theme.colors.borderStrong}`,
    },
    yearTitle: { margin: 0, fontSize: theme.typography.fontSize.medium, fontWeight: 600 },
    monthContainer: {
      paddingLeft: theme.spacing.large,
      marginTop: theme.spacing.small,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.small,
    },
    monthHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: theme.spacing.medium, backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.medium, cursor: 'pointer',
        border: `1px solid ${theme.colors.border}`,
    },
    monthTitle: { margin: 0, textTransform: 'capitalize' },
    statsGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: theme.spacing.medium, padding: theme.spacing.medium,
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        borderTop: 'none',
        borderRadius: `0 0 ${theme.borderRadius.medium} ${theme.borderRadius.medium}`
    },
    statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' },
    statIcon: {
        height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: theme.colors.secondaryText, fontSize: '1.25rem',
    },
    statValue: { display: 'block', fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    statLabel: { display: 'block', fontSize: theme.typography.fontSize.extraSmall, color: theme.colors.secondaryText },
    matchListContainer: {
        padding: `${theme.spacing.small} ${theme.spacing.medium}`,
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        borderTop: 'none',
        borderRadius: `0 0 ${theme.borderRadius.medium} ${theme.borderRadius.medium}`
    },
    matchRow: {
        display: 'flex', alignItems: 'center', gap: theme.spacing.medium,
        padding: `${theme.spacing.small} 0`, borderBottom: `1px solid ${theme.colors.border}`,
    },
    lastMatchRow: { borderBottom: 'none' },
    matchDate: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, flexBasis: '80px' },
    matchStats: { display: 'flex', gap: theme.spacing.medium, color: theme.colors.primaryText },
    matchStatItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
    },
  };

  return (
    <>
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in-down {
          animation: fadeInDown 0.3s ease-out forwards;
        }
      `}</style>
      <div style={styles.container}>
        {sortedYears.map(year => (
          <div key={year} style={styles.yearContainer}>
            <div style={styles.yearHeader} onClick={() => setExpandedYear(expandedYear === year ? null : year)}>
              <h4 style={styles.yearTitle}>{year}</h4>
              <ChevronIcon isExpanded={expandedYear === year} />
            </div>
            {expandedYear === year && (
              <div style={styles.monthContainer} className="fade-in-down">
                {Object.keys(statsByYearAndMonth[year]).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)).reverse().map(month => {
                  const stats = statsByYearAndMonth[year][month];
                  const key = `${year}-${month}`;
                  const isExpanded = expandedMonth === key;
                  
                  const efectividad = stats.matchCount > 0 ? ((stats.wins * 3 + stats.draws) / (stats.matchCount * 3)) * 100 : 0;
                  const recordStyle: React.CSSProperties = {
                      fontSize: theme.typography.fontSize.small,
                      fontWeight: 600,
                      marginLeft: theme.spacing.small,
                  };
                  if (efectividad > 50) {
                      recordStyle.color = theme.colors.win;
                  } else if (efectividad < 50) {
                      recordStyle.color = theme.colors.loss;
                  } else {
                      recordStyle.color = theme.colors.draw;
                  }

                  return (
                      <div key={key}>
                          <div style={styles.monthHeader} onClick={() => setExpandedMonth(isExpanded ? null : key)}>
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                <h5 style={styles.monthTitle}>{month}</h5>
                                <span style={recordStyle}>
                                    ({stats.wins}-{stats.draws}-{stats.losses})
                                </span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center'}}>
                                {/* REMOVED SectionHelp from here */}
                                <ChevronIcon isExpanded={isExpanded} />
                            </div>
                          </div>
                          {isExpanded && (
                              <div className="fade-in-down">
                                  <div style={{...styles.statsGrid, borderRadius: stats.matches.length > 0 ? 0 : `0 0 ${theme.borderRadius.medium} ${theme.borderRadius.medium}` }}>
                                      <div style={styles.statItem}><span style={styles.statIcon}>📌</span><span style={styles.statValue}>{stats.matchCount}</span><span style={styles.statLabel}>Partidos</span></div>
                                      <div style={styles.statItem}><span style={styles.statIcon}>✅</span><span style={styles.statValue}>{stats.wins}</span><span style={styles.statLabel}>V</span></div>
                                      <div style={styles.statItem}><span style={styles.statIcon}>🤝</span><span style={styles.statValue}>{stats.draws}</span><span style={styles.statLabel}>E</span></div>
                                      <div style={styles.statItem}><span style={styles.statIcon}>❌</span><span style={styles.statValue}>{stats.losses}</span><span style={styles.statLabel}>D</span></div>
                                      <div style={styles.statItem}><span style={styles.statIcon}>⚽️</span><span style={styles.statValue}>{stats.goals}</span><span style={styles.statLabel}>Goles</span></div>
                                      <div style={styles.statItem}><span style={styles.statIcon}>👟</span><span style={styles.statValue}>{stats.assists}</span><span style={styles.statLabel}>Asist.</span></div>
                                  </div>
                                  {stats.matches.length > 0 && (
                                      <div style={styles.matchListContainer}>
                                          {stats.matches.map((match, index) => (
                                              <div key={match.id} style={ index === stats.matches.length - 1 ? {...styles.matchRow, ...styles.lastMatchRow} : styles.matchRow}>
                                                  <span style={styles.matchDate}>{parseLocalDate(match.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                                                  <div style={getResultStyle(match.result)}>{match.result.charAt(0)}</div>
                                                  <div style={styles.matchStats}>
                                                      <span style={styles.matchStatItem}>⚽️ {match.myGoals}</span>
                                                      <span style={styles.matchStatItem}>👟 {match.myAssists}</span>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default HistoricalAnalysis;
