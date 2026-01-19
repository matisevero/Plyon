
import React, { useState, useMemo } from 'react';
import type { Match } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/common/Card';
import YearFilter from '../../components/YearFilter';
import { parseLocalDate } from '../../utils/analytics';

interface ActivityCalendarProps {
  matches: Match[];
}

type CalendarView = 'heatmap' | 'summary' | 'log';

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ matches }) => {
  const { theme } = useTheme();
  const isDark = theme.name === 'dark';
  
  const [view, setView] = useState<CalendarView>('heatmap');
  const [hoveredView, setHoveredView] = useState<string | null>(null);
  const [highlightedStat, setHighlightedStat] = useState<string | null>(null);

  const availableYears = useMemo(() => {
      const yearSet = new Set(matches.map(m => parseLocalDate(m.date).getFullYear()));
      return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [matches]);

  const [selectedYear, setSelectedYear] = useState<string>(
      availableYears.length > 0 ? availableYears[0].toString() : new Date().getFullYear().toString()
  );

  const yearToDisplay = useMemo(() => parseInt(selectedYear), [selectedYear]);
  
  const statsByMonth = useMemo(() => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthlyData: { month: string; count: number; matches: Match[] }[] = months.map(m => ({
      month: m, count: 0, matches: []
    }));
    matches.forEach(match => {
      const date = parseLocalDate(match.date);
      if (date.getFullYear() === yearToDisplay) {
        const monthIndex = date.getMonth();
        monthlyData[monthIndex].count++;
        monthlyData[monthIndex].matches.push(match);
      }
    });
    monthlyData.forEach(monthData => {
        monthData.matches.sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());
    });
    return monthlyData;
  }, [matches, yearToDisplay]);

  const maxCountInMonth = useMemo(() => 
    Math.max(1, ...statsByMonth.map(m => m.count)),
  [statsByMonth]);
  
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

  const getButtonViewStyle = (buttonView: string) => {
    const isActive = view === buttonView;
    const isHovered = hoveredView === buttonView;
    const style: React.CSSProperties = { border: '1px solid' };

    if (isDark) {
        if (isHovered) {
            style.backgroundColor = '#414a6b';
            style.color = '#a1a8d6';
            style.borderColor = '#414a6b';
        } else if (isActive) {
            style.backgroundColor = '#a1a8d6';
            style.color = '#1c2237';
            style.borderColor = '#414a6b';
        } else { // Inactive
            style.backgroundColor = '#1c2237';
            style.color = '#a1a8d6';
            style.borderColor = '#414a6b';
        }
    } else { // Light theme
        if (isHovered) {
            style.backgroundColor = '#f5f6fa';
            style.color = '#1c2237';
            style.borderColor = '#f5f6fa';
        } else if (isActive) {
            style.backgroundColor = '#c8cdd7';
            style.color = '#1c2237';
            style.borderColor = '#c7ced8';
        } else { // Inactive
            style.backgroundColor = '#ffffff';
            style.color = '#1c2237';
            style.borderColor = '#c7ced8';
        }
    }
    return style;
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    viewSwitcher: { display: 'flex', width: '100%' },
    viewButton: {
      padding: `${theme.spacing.small} ${theme.spacing.medium}`,
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.8rem',
      flex: 1,
      transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
    },
    viewContainer: { width: '100%', minHeight: '150px' },
    barChartContainer: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    barRow: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium },
    monthLabelBar: { flexBasis: '50px', textAlign: 'right', fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText },
    barWrapper: { flex: 1, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.small, height: '24px' },
    bar: { height: '100%', borderRadius: theme.borderRadius.small, transition: 'width 0.5s ease-out', display: 'flex', alignItems: 'center' },
    listContainer: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large, maxHeight: '400px', overflowY: 'auto', paddingRight: '1rem' },
    monthGroup: {},
    monthHeader: {
        fontSize: theme.typography.fontSize.medium, fontWeight: 700, color: theme.colors.primaryText,
        margin: `0 0 ${theme.spacing.medium} 0`, paddingBottom: theme.spacing.small,
        borderBottom: `2px solid ${theme.colors.border}`,
    },
    matchRow: {
        display: 'flex', alignItems: 'center', gap: theme.spacing.medium,
        padding: `${theme.spacing.small} 0`, borderBottom: `1px solid ${theme.colors.border}`,
    },
    matchDate: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, flexBasis: '80px' },
    matchStats: { display: 'flex', gap: theme.spacing.medium, color: theme.colors.primaryText },
  };
  
  const renderActivityGrid = () => {
    const getResultBlockStyle = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
        const baseStyle = { ...activityGridStyles.matchBlock };
        switch (result) {
            case 'VICTORIA': return { ...baseStyle, backgroundColor: theme.colors.win };
            case 'DERROTA': return { ...baseStyle, backgroundColor: theme.colors.loss };
            case 'EMPATE': return { ...baseStyle, backgroundColor: theme.colors.draw };
        }
    };
    
    const activityGridStyles: { [key: string]: React.CSSProperties } = {
        gridContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.small,
        },
        monthRow: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.medium,
        },
        monthLabel: {
            flexBasis: '40px',
            textAlign: 'right',
            fontSize: theme.typography.fontSize.small,
            color: theme.colors.secondaryText,
            flexShrink: 0,
        },
        matchesContainer: {
            flex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            minHeight: '24px',
            alignItems: 'center',
        },
        matchBlock: {
            width: '20px',
            height: '20px',
            borderRadius: theme.borderRadius.small,
            border: `1px solid ${theme.colors.surface}80`,
        },
        noMatchesText: {
            color: theme.colors.secondaryText,
            fontSize: theme.typography.fontSize.small,
            fontStyle: 'italic',
        }
    };

    return (
        <div style={activityGridStyles.gridContainer}>
            {statsByMonth.map(({ month, matches: monthMatches }) => (
                <div key={month} style={activityGridStyles.monthRow}>
                    <span style={activityGridStyles.monthLabel}>{month.substring(0, 3)}.</span>
                    <div style={activityGridStyles.matchesContainer}>
                        {monthMatches.length > 0 ? (
                            monthMatches.map(match => (
                                <div
                                    key={match.id}
                                    style={getResultBlockStyle(match.result)}
                                    title={`Fecha: ${parseLocalDate(match.date).toLocaleDateString()}\nResultado: ${match.result}`}
                                ></div>
                            ))
                        ) : (
                            <span style={activityGridStyles.noMatchesText}>-</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const renderSummary = () => {
    const stackedBarSegmentStyle: React.CSSProperties = {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colors.textOnAccent,
        fontSize: theme.typography.fontSize.small,
        fontWeight: 700,
        overflow: 'hidden',
        transition: 'transform 0.2s ease-out, flex-grow 0.5s ease-out',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        cursor: 'pointer',
    };
    
    const handleHighlight = (key: string) => {
        setHighlightedStat(key);
        setTimeout(() => setHighlightedStat(null), 500);
    };

    return (
        <div style={styles.barChartContainer}>
        {statsByMonth.map(({ month, count, matches: monthMatches }) => {
            const wins = monthMatches.filter(m => m.result === 'VICTORIA').length;
            const draws = monthMatches.filter(m => m.result === 'EMPATE').length;
            const losses = monthMatches.filter(m => m.result === 'DERROTA').length;

            return (
            <div key={month} style={styles.barRow}>
                <span style={styles.monthLabelBar}>{month.substring(0, 3)}.</span>
                <div style={styles.barWrapper}>
                {count > 0 && (
                    <div style={{ ...styles.bar, width: `${(count / maxCountInMonth) * 100}%` }}>
                        {wins > 0 && (
                            <div 
                                style={{ ...stackedBarSegmentStyle, flexGrow: wins, backgroundColor: theme.colors.win, transform: highlightedStat === `${month}-wins` ? 'scale(1.1)' : 'scale(1)' }}
                                onClick={() => handleHighlight(`${month}-wins`)}
                            >
                                {wins > 0 && wins}
                            </div>
                        )}
                        {draws > 0 && (
                            <div 
                                style={{ ...stackedBarSegmentStyle, flexGrow: draws, backgroundColor: theme.colors.draw, transform: highlightedStat === `${month}-draws` ? 'scale(1.1)' : 'scale(1)' }}
                                onClick={() => handleHighlight(`${month}-draws`)}
                            >
                                {draws > 0 && draws}
                            </div>
                        )}
                        {losses > 0 && (
                            <div 
                                style={{ ...stackedBarSegmentStyle, flexGrow: losses, backgroundColor: theme.colors.loss, transform: highlightedStat === `${month}-losses` ? 'scale(1.1)' : 'scale(1)' }}
                                onClick={() => handleHighlight(`${month}-losses`)}
                            >
                                {losses > 0 && losses}
                            </div>
                        )}
                    </div>
                )}
                </div>
            </div>
            );
        })}
        </div>
    );
  };

  const renderLog = () => (
    <div style={styles.listContainer} className="custom-scrollbar">
      {statsByMonth.filter(m => m.count > 0).reverse().map(({ month, matches: monthMatches }) => (
        <div key={month} style={styles.monthGroup}>
          <h4 style={styles.monthHeader}>{month}</h4>
          {monthMatches.reverse().map(match => (
            <div key={match.id} style={styles.matchRow}>
              <span style={styles.matchDate}>{parseLocalDate(match.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
              <div style={getResultStyle(match.result)}>{match.result.charAt(0)}</div>
              <div style={styles.matchStats}>
                  <span>⚽️ {match.myGoals}</span>
                  <span>👟 {match.myAssists}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const viewButtons: { id: CalendarView, label: string }[] = [
    { id: 'heatmap', label: 'Mapa de calor' },
    { id: 'summary', label: 'Resumen mensual' },
    { id: 'log', label: 'Registro anual' },
  ];

  return (
    <Card title={`Calendario de actividad (${yearToDisplay})`}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div style={styles.container}>
        <div style={{ marginBottom: theme.spacing.medium }}>
            <YearFilter years={availableYears} selectedYear={selectedYear} onSelectYear={(year) => setSelectedYear(year as string)} showAllTime={false} size="small" />
        </div>
        <div style={styles.viewSwitcher}>
           {viewButtons.map((button, index) => {
              const buttonStateStyle = getButtonViewStyle(button.id);
              const buttonPositionStyle: React.CSSProperties = {};
              
              if (index > 0) {
                  buttonPositionStyle.borderLeft = 'none';
              }
              if (index === 0) {
                  buttonPositionStyle.borderRadius = `${theme.borderRadius.medium} 0 0 ${theme.borderRadius.medium}`;
              } else if (index === viewButtons.length - 1) {
                  buttonPositionStyle.borderRadius = `0 ${theme.borderRadius.medium} ${theme.borderRadius.medium} 0`;
              } else {
                  buttonPositionStyle.borderRadius = 0;
              }

              return (
                  <button 
                      key={button.id}
                      onClick={() => setView(button.id)}
                      onMouseEnter={() => setHoveredView(button.id)}
                      onMouseLeave={() => setHoveredView(null)}
                      style={{...styles.viewButton, ...buttonStateStyle, ...buttonPositionStyle}}>
                      {button.label}
                  </button>
              )
           })}
        </div>
        <div style={styles.viewContainer}>
          {view === 'heatmap' && renderActivityGrid()}
          {view === 'summary' && renderSummary()}
          {view === 'log' && renderLog()}
        </div>
      </div>
    </Card>
  );
};

export default ActivityCalendar;
