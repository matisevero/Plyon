
import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Match } from '../../types';
import Card from '../../components/common/Card';
import StatCard from '../../components/StatCard';
import YearFilter from '../../components/YearFilter';
import { parseLocalDate } from '../../utils/analytics';

interface SummaryWidgetProps {
  matches: Match[];
}

const SummaryWidget: React.FC<SummaryWidgetProps> = ({ matches }) => {
  const { theme } = useTheme();
  const [resultDisplayMode, setResultDisplayMode] = useState<'count' | 'percentage'>('count');

  const availableYears = useMemo(() => {
    const yearSet = new Set(matches.map(m => parseLocalDate(m.date).getFullYear()));
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [matches]);
  
  const [selectedYear, setSelectedYear] = useState<string | 'all'>(availableYears.length > 0 ? availableYears[0].toString() : 'all');

  const filteredMatches = useMemo(() => {
    if (selectedYear === 'all') {
      return matches;
    }
    return matches.filter(m => parseLocalDate(m.date).getFullYear().toString() === selectedYear);
  }, [matches, selectedYear]);

  const stats = useMemo(() => {
    const totalMatches = filteredMatches.length;
    if (totalMatches === 0) {
      return { 
        winsCount: 0, drawsCount: 0, lossesCount: 0, 
        totalGoals: 0, totalAssists: 0, totalMatches: 0, 
        totalPoints: 0, efectividad: '0.0', 
        winPercentage: '0.0', drawPercentage: '0.0', lossPercentage: '0.0' 
      };
    }
    const winsCount = filteredMatches.filter(m => m.result === 'VICTORIA').length;
    const drawsCount = filteredMatches.filter(m => m.result === 'EMPATE').length;
    const lossesCount = filteredMatches.filter(m => m.result === 'DERROTA').length;
    const totalGoals = filteredMatches.reduce((sum, match) => sum + match.myGoals, 0);
    const totalAssists = filteredMatches.reduce((sum, match) => sum + match.myAssists, 0);
    const totalPoints = (winsCount * 3) + drawsCount;
    const efectividad = totalMatches > 0 ? ((totalPoints / (totalMatches * 3)) * 100).toFixed(1) : '0.0';
    const winPercentage = totalMatches > 0 ? ((winsCount / totalMatches) * 100).toFixed(1) : '0.0';
    const drawPercentage = totalMatches > 0 ? ((drawsCount / totalMatches) * 100).toFixed(1) : '0.0';
    const lossPercentage = totalMatches > 0 ? ((lossesCount / totalMatches) * 100).toFixed(1) : '0.0';
    
    return { 
        winsCount, drawsCount, lossesCount, totalGoals, totalAssists, 
        totalMatches, totalPoints, efectividad, 
        winPercentage, drawPercentage, lossPercentage 
    };
  }, [filteredMatches]);
  
  const iconStyle: React.CSSProperties = { fontSize: '1.25rem' };
  
  const toggleResultDisplay = () => {
    setResultDisplayMode(prev => prev === 'count' ? 'percentage' : 'count');
  };

  const clickableCardStyle: React.CSSProperties = {
    cursor: 'pointer',
    transition: 'transform 0.2s ease-in-out',
    userSelect: 'none',
  };

  return (
    <Card title={`Resumen general`}>
      <div style={{ marginBottom: theme.spacing.medium }}>
        <YearFilter years={availableYears} selectedYear={selectedYear} onSelectYear={setSelectedYear} size="small" allTimeLabel="General" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.large, marginTop: theme.spacing.small }}>
        <StatCard label="Partidos (PJ)" value={stats.totalMatches} icon={<span style={iconStyle}>🗓️</span>} />
        <StatCard label="Puntos" value={stats.totalPoints} icon={<span style={iconStyle}>🏆</span>} />
        
        <div onClick={toggleResultDisplay} style={clickableCardStyle} title="Click para cambiar vista">
            <StatCard 
                label={resultDisplayMode === 'count' ? "Victorias" : "% Victorias"} 
                value={resultDisplayMode === 'count' ? stats.winsCount : `${stats.winPercentage}%`} 
                icon={<span style={iconStyle}>✅</span>} 
            />
        </div>
        <div onClick={toggleResultDisplay} style={clickableCardStyle} title="Click para cambiar vista">
            <StatCard 
                label={resultDisplayMode === 'count' ? "Empates" : "% Empates"} 
                value={resultDisplayMode === 'count' ? stats.drawsCount : `${stats.drawPercentage}%`} 
                icon={<span style={iconStyle}>🤝</span>} 
            />
        </div>
        <div onClick={toggleResultDisplay} style={clickableCardStyle} title="Click para cambiar vista">
            <StatCard 
                label={resultDisplayMode === 'count' ? "Derrotas" : "% Derrotas"} 
                value={resultDisplayMode === 'count' ? stats.lossesCount : `${stats.lossPercentage}%`} 
                icon={<span style={iconStyle}>❌</span>} 
            />
        </div>
        
        <StatCard label="% Efectividad" value={`${stats.efectividad}%`} />

        <StatCard label="Goles" value={stats.totalGoals} icon={<span style={iconStyle}>⚽️</span>} />
        <StatCard label="Asistencias" value={stats.totalAssists} icon={<span style={iconStyle}>👟</span>} />
      </div>
    </Card>
  );
};

export default SummaryWidget;
