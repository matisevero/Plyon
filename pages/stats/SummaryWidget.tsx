
import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import type { Match } from '../../types';
import Card from '../../components/common/Card';
import StatCard from '../../components/StatCard';
import YearFilter from '../../components/YearFilter';
import { parseLocalDate } from '../../utils/analytics';
import SectionHelp from '../../components/common/SectionHelp';
import { ClipboardIcon } from '../../components/icons/ClipboardIcon';
import { TrendingUpIcon } from '../../components/icons/TrendingUpIcon';
import { InfoIcon } from '../../components/icons/InfoIcon';
import { SparklesIcon } from '../../components/icons/SparklesIcon';

interface SummaryWidgetProps {
  matches: Match[];
}

const SummaryWidget: React.FC<SummaryWidgetProps> = ({ matches }) => {
  const { theme } = useTheme();
  const { openSeasonRecap } = useData();
  const [resultDisplayMode, setResultDisplayMode] = useState<'count' | 'percentage'>('count');

  const availableYears = useMemo(() => {
    const yearSet = new Set(matches.map(m => parseLocalDate(m.date).getFullYear()));
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [matches]);
  
  const [selectedYear, setSelectedYear] = useState<string | 'all'>(availableYears.length > 0 ? availableYears[0].toString() : 'all');

  // Mostrar el botón solo si hay un año seleccionado Y ese año NO es el actual
  const currentSystemYear = new Date().getFullYear().toString();
  const showRecapButton = selectedYear !== 'all' && selectedYear !== currentSystemYear;

  // Helper to calculate stats for a given set of matches
  const calculateStats = (matchList: Match[]) => {
      const totalMatches = matchList.length;
      if (totalMatches === 0) {
        return { 
          winsCount: 0, drawsCount: 0, lossesCount: 0, 
          totalGoals: 0, totalAssists: 0, totalMatches: 0, 
          totalPoints: 0, efectividad: 0, 
          winPercentage: 0, drawPercentage: 0, lossPercentage: 0
        };
      }
      const winsCount = matchList.filter(m => m.result === 'VICTORIA').length;
      const drawsCount = matchList.filter(m => m.result === 'EMPATE').length;
      const lossesCount = matchList.filter(m => m.result === 'DERROTA').length;
      const totalGoals = matchList.reduce((sum, match) => sum + match.myGoals, 0);
      const totalAssists = matchList.reduce((sum, match) => sum + match.myAssists, 0);
      const totalPoints = (winsCount * 3) + drawsCount;
      const efectividad = (totalPoints / (totalMatches * 3)) * 100;
      const winPercentage = (winsCount / totalMatches) * 100;
      const drawPercentage = (drawsCount / totalMatches) * 100;
      const lossPercentage = (lossesCount / totalMatches) * 100;
      
      return { 
          winsCount, drawsCount, lossesCount, totalGoals, totalAssists, 
          totalMatches, totalPoints, efectividad, 
          winPercentage, drawPercentage, lossPercentage 
      };
  };

  const handleOpenRecap = () => {
      if (selectedYear === 'all') return;
      const year = parseInt(selectedYear);
      const yearMatches = matches.filter(m => parseLocalDate(m.date).getFullYear() === year);
      
      // Calculate Stats
      const stats = calculateStats(yearMatches);
      
      // Determine Archetype
      let archetype = 'EQUILIBRADO';
      const gpm = stats.totalMatches > 0 ? stats.totalGoals / stats.totalMatches : 0;
      const apm = stats.totalMatches > 0 ? stats.totalAssists / stats.totalMatches : 0;
      const winRate = stats.winPercentage;

      if (gpm > 1.5) archetype = 'DEPREDADOR';
      else if (apm > 1) archetype = 'MAESTRO';
      else if (winRate > 70) archetype = 'TALISMÁN';
      else if (gpm + apm > 2) archetype = 'MVP TOTAL';
      else if (stats.totalMatches > 30) archetype = 'IRON MAN';

      // Find Prime Month
      const monthCounts: Record<string, number> = {};
      yearMatches.forEach(m => {
          const month = parseLocalDate(m.date).toLocaleString('es-ES', { month: 'long' });
          const key = month.toUpperCase();
          // Score matches based on performance
          let score = 1;
          if (m.result === 'VICTORIA') score += 2;
          score += m.myGoals + m.myAssists;
          monthCounts[key] = (monthCounts[key] || 0) + score;
      });
      
      let primeMonth = 'TODO EL AÑO';
      let maxScore = 0;
      Object.entries(monthCounts).forEach(([m, s]) => {
          if (s > maxScore) {
              maxScore = s;
              primeMonth = m;
          }
      });

      const recap = {
          year,
          archetype,
          primeMonth,
          stats: {
              totalMatches: stats.totalMatches,
              totalGoals: stats.totalGoals,
              totalAssists: stats.totalAssists,
              totalPoints: stats.totalPoints,
              winRate,
              efectividad: stats.efectividad,
              wins: stats.winsCount,
              draws: stats.drawsCount,
              losses: stats.lossesCount
          }
      };
      
      // Usar DataContext para cambiar de página
      openSeasonRecap(recap);
  };

  // Determine which matches to show based on selected year
  const currentStats = useMemo(() => {
    let filteredMatches = matches;
    if (selectedYear !== 'all') {
        filteredMatches = matches.filter(m => parseLocalDate(m.date).getFullYear().toString() === selectedYear);
    }
    return calculateStats(filteredMatches);
  }, [matches, selectedYear]);

  // Previous Stats (Comparison) - Re-adding logic for comparison
  const comparisonStats = useMemo(() => {
      if (selectedYear === 'all') return null;
      const currentYearInt = parseInt(selectedYear);
      const prevYearInt = currentYearInt - 1;
      if (!availableYears.includes(prevYearInt)) return null;
      const prevMatches = matches.filter(m => parseLocalDate(m.date).getFullYear() === prevYearInt);
      return calculateStats(prevMatches);
  }, [matches, selectedYear, availableYears]);

  const getTrend = (current: number, previous: number | undefined): 'up' | 'down' | 'neutral' => {
      if (previous === undefined || previous === null) return 'neutral';
      if (current > previous) return 'up';
      if (current < previous) return 'down';
      return 'neutral';
  };

  const summaryGuide = [
      { title: "Resumen General", content: "Visión rápida de tu temporada o historial completo. Toca los porcentajes para alternar entre cantidad y %.", icon: <ClipboardIcon size={48} /> },
      { title: "Efectividad", content: "Porcentaje de puntos obtenidos sobre el total posible. (3 pts por victoria, 1 por empate).", icon: <TrendingUpIcon size={48} /> }
  ];

  const iconStyle: React.CSSProperties = { fontSize: '1.25rem' };
  
  const toggleResultDisplay = () => {
    setResultDisplayMode(prev => prev === 'count' ? 'percentage' : 'count');
  };

  const clickableCardStyle: React.CSSProperties = {
    cursor: 'pointer',
    transition: 'transform 0.2s ease-in-out',
    userSelect: 'none',
  };

  const recapButtonStyle: React.CSSProperties = {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      width: '100%', padding: '12px', marginTop: theme.spacing.large,
      borderRadius: theme.borderRadius.medium, border: 'none',
      background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`,
      color: theme.name === 'dark' ? '#121829' : '#fff',
      fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
      boxShadow: theme.shadows.medium, transition: 'transform 0.2s'
  };

  return (
    <>
        <Card title={<>Resumen general <SectionHelp steps={summaryGuide} /></>}>
        <div style={{ marginBottom: theme.spacing.medium }}>
            <YearFilter years={availableYears} selectedYear={selectedYear} onSelectYear={setSelectedYear} size="small" allTimeLabel="General" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.large, marginTop: theme.spacing.small }}>
            <StatCard 
                label="Partidos (PJ)" 
                value={currentStats.totalMatches} 
                icon={<span style={iconStyle}>🗓️</span>} 
                trend={comparisonStats ? getTrend(currentStats.totalMatches, comparisonStats.totalMatches) : undefined}
            />
            <StatCard 
                label="Puntos" 
                value={currentStats.totalPoints} 
                icon={<span style={iconStyle}>🏆</span>} 
                trend={comparisonStats ? getTrend(currentStats.totalPoints, comparisonStats.totalPoints) : undefined}
            />
            
            <div onClick={toggleResultDisplay} style={clickableCardStyle} title="Click para cambiar vista">
                <StatCard 
                    label={resultDisplayMode === 'count' ? "Victorias" : "% Victorias"} 
                    value={resultDisplayMode === 'count' ? currentStats.winsCount : `${currentStats.winPercentage.toFixed(1)}%`} 
                    icon={<span style={iconStyle}>✅</span>} 
                    trend={comparisonStats ? getTrend(currentStats.winsCount, comparisonStats.winsCount) : undefined}
                />
            </div>
            <div onClick={toggleResultDisplay} style={clickableCardStyle} title="Click para cambiar vista">
                <StatCard 
                    label={resultDisplayMode === 'count' ? "Empates" : "% Empates"} 
                    value={resultDisplayMode === 'count' ? currentStats.drawsCount : `${currentStats.drawPercentage.toFixed(1)}%`} 
                    icon={<span style={iconStyle}>🤝</span>} 
                    trend={comparisonStats ? getTrend(currentStats.drawsCount, comparisonStats.drawsCount) : undefined}
                />
            </div>
            <div onClick={toggleResultDisplay} style={clickableCardStyle} title="Click para cambiar vista">
                <StatCard 
                    label={resultDisplayMode === 'count' ? "Derrotas" : "% Derrotas"} 
                    value={resultDisplayMode === 'count' ? currentStats.lossesCount : `${currentStats.lossPercentage.toFixed(1)}%`} 
                    icon={<span style={iconStyle}>❌</span>} 
                    trend={comparisonStats ? getTrend(currentStats.lossesCount, comparisonStats.lossesCount) : undefined}
                    reverseTrendColor={true} 
                />
            </div>
            
            <StatCard 
                label="% Efectividad" 
                value={`${currentStats.efectividad.toFixed(1)}%`} 
                trend={comparisonStats ? getTrend(currentStats.efectividad, comparisonStats.efectividad) : undefined}
            />

            <StatCard 
                label="Goles" 
                value={currentStats.totalGoals} 
                icon={<span style={iconStyle}>⚽️</span>} 
                trend={comparisonStats ? getTrend(currentStats.totalGoals, comparisonStats.totalGoals) : undefined}
            />
            <StatCard 
                label="Asistencias" 
                value={currentStats.totalAssists} 
                icon={<span style={iconStyle}>👟</span>} 
                trend={comparisonStats ? getTrend(currentStats.totalAssists, comparisonStats.totalAssists) : undefined}
            />
        </div>

        {showRecapButton && (
            <button 
                onClick={handleOpenRecap}
                style={recapButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <SparklesIcon size={20} /> Resumen de Temporada {selectedYear}
            </button>
        )}
        </Card>
    </>
  );
};

export default SummaryWidget;
