
import React, { useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Match } from '../../types';
import Card from '../../components/common/Card';
import StatCard from '../../components/StatCard';
import ContributionByResultChart from '../../components/ContributionByResultChart';
import YearFilter from '../../components/YearFilter';
import { parseLocalDate } from '../../utils/analytics';
import SectionHelp from '../../components/common/SectionHelp';
import { TargetIcon } from '../../components/icons/TargetIcon';
import { BarChartIcon } from '../../components/icons/BarChartIcon';

interface ContributionMetricsWidgetProps {
  matches: Match[];
}

const ContributionMetricsWidget: React.FC<ContributionMetricsWidgetProps> = ({ matches }) => {
  const { theme } = useTheme();

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

  // Calculate stats for current selection
  const keyMetrics = useMemo(() => {
    const totalMatches = filteredMatches.length;
    if (totalMatches === 0) return { gpm: 0, apm: 0 };
    const totalGoals = filteredMatches.reduce((sum, m) => sum + m.myGoals, 0);
    const totalAssists = filteredMatches.reduce((sum, m) => sum + m.myAssists, 0);
    return { gpm: totalGoals / totalMatches, apm: totalAssists / totalMatches };
  }, [filteredMatches]);

  // Calculate stats for PREVIOUS year (for trend comparison)
  const previousMetrics = useMemo(() => {
      if (selectedYear === 'all') return null;
      const prevYear = parseInt(selectedYear) - 1;
      const prevMatches = matches.filter(m => parseLocalDate(m.date).getFullYear() === prevYear);
      
      const totalMatches = prevMatches.length;
      if (totalMatches === 0) return null; // No history to compare

      const totalGoals = prevMatches.reduce((sum, m) => sum + m.myGoals, 0);
      const totalAssists = prevMatches.reduce((sum, m) => sum + m.myAssists, 0);
      
      return { gpm: totalGoals / totalMatches, apm: totalAssists / totalMatches };
  }, [matches, selectedYear]);

  const getTrend = (current: number, previous: number | undefined): 'up' | 'down' | 'neutral' => {
      if (previous === undefined || previous === null) return 'neutral';
      // Use a small epsilon for float comparison to avoid noise
      if (Math.abs(current - previous) < 0.01) return 'neutral';
      if (current > previous) return 'up';
      return 'down';
  };

  const contributionByResultData = useMemo(() => {
    const data = {
        VICTORIA: { goals: 0, assists: 0, count: 0 },
        EMPATE: { goals: 0, assists: 0, count: 0 },
        DERROTA: { goals: 0, assists: 0, count: 0 },
    };
    filteredMatches.forEach(m => {
        data[m.result].goals += m.myGoals;
        data[m.result].assists += m.myAssists;
        data[m.result].count++;
    });
    return [
        { result: 'Victorias', goals: data.VICTORIA.count > 0 ? data.VICTORIA.goals / data.VICTORIA.count : 0, assists: data.VICTORIA.count > 0 ? data.VICTORIA.assists / data.VICTORIA.count : 0 },
        { result: 'Empates', goals: data.EMPATE.count > 0 ? data.EMPATE.goals / data.EMPATE.count : 0, assists: data.EMPATE.count > 0 ? data.EMPATE.assists / data.EMPATE.count : 0 },
        { result: 'Derrotas', goals: data.DERROTA.count > 0 ? data.DERROTA.goals / data.DERROTA.count : 0, assists: data.DERROTA.count > 0 ? data.DERROTA.assists / data.DERROTA.count : 0 },
    ].filter(d => (d.goals + d.assists) > 0);
  }, [filteredMatches]);

  const contributionGuide = [
    { title: "Impacto Ofensivo", content: "Analiza tu producción de Goles y Asistencias en relación a los partidos jugados (G/P y A/P).", icon: <TargetIcon size={48} /> },
    { title: "Influencia en Resultados", content: "El gráfico desglosa tus aportes según el resultado del partido. ¿Anotas más cuando el equipo gana?", icon: <BarChartIcon size={48} /> }
  ];

  return (
    <Card title={<>Impacto ofensivo <SectionHelp steps={contributionGuide} /></>}>
        <div style={{ marginBottom: theme.spacing.large }}>
          <YearFilter years={availableYears} selectedYear={selectedYear} onSelectYear={setSelectedYear} size="small" allTimeLabel="General" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.medium, marginTop: theme.spacing.small }}>
            <StatCard 
                label="Goles p/partido" 
                value={keyMetrics.gpm.toFixed(2)} 
                trend={previousMetrics ? getTrend(keyMetrics.gpm, previousMetrics.gpm) : undefined}
            />
            <StatCard 
                label="Asist. p/partido" 
                value={keyMetrics.apm.toFixed(2)} 
                trend={previousMetrics ? getTrend(keyMetrics.apm, previousMetrics.apm) : undefined}
            />
        </div>
        {contributionByResultData.length > 0 ? (
            <ContributionByResultChart data={contributionByResultData} />
        ) : (
            <p style={{ color: theme.colors.secondaryText, textAlign: 'center', marginTop: theme.spacing.large }}>
                No hay suficientes datos para el período seleccionado.
            </p>
        )}
    </Card>
  );
};

export default ContributionMetricsWidget;
