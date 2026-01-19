
import React, { useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Match } from '../../types';
import Card from '../../components/common/Card';
import MomentumChart from './MomentumChart';
import YearFilter from '../../components/YearFilter';
import { parseLocalDate } from '../../utils/analytics';
import SectionHelp from '../../components/common/SectionHelp';
import { ActivityIcon } from '../../components/icons/ActivityIcon';
import { TrendingUpIcon } from '../../components/icons/TrendingUpIcon';

interface MomentumWidgetProps {
  matches: Match[];
}

const MomentumWidget: React.FC<MomentumWidgetProps> = ({ matches }) => {
  const { theme } = useTheme();

  const availableYears = useMemo(() => {
      const yearSet = new Set(matches.map(m => parseLocalDate(m.date).getFullYear()));
      return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [matches]);
  
  const [selectedYear, setSelectedYear] = useState<string | 'all'>(availableYears.length > 0 ? availableYears[0].toString() : 'all');

  const displayYear = useMemo(() => {
    if (selectedYear !== 'all') return selectedYear;
    if (matches.length > 0) {
        const latestYear = Math.max(...matches.map(m => parseLocalDate(m.date).getFullYear()));
        return isFinite(latestYear) ? latestYear.toString() : new Date().getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  }, [selectedYear, matches]);

  const momentumGuide = [
    { title: "Momentum", content: "Visualiza tu racha actual y pasada. Cada barra representa un partido: Verde (Victoria), Azul (Empate), Rojo (Derrota).", icon: <ActivityIcon size={48} /> },
    { title: "Consistencia", content: "La línea superpuesta es tu Índice de Consistencia. Una línea alta y estable significa que rindes siempre al mismo nivel.", icon: <TrendingUpIcon size={48} /> }
  ];

  return (
    <Card title={<>Momentum de Temporada ({displayYear}) <SectionHelp steps={momentumGuide} /></>}>
        <div style={{ marginBottom: theme.spacing.medium }}>
            <YearFilter years={availableYears} selectedYear={selectedYear} onSelectYear={setSelectedYear} size="small" allTimeLabel="General" />
        </div>
        <div style={{marginTop: theme.spacing.small}}>
            <MomentumChart matches={matches} year={displayYear} />
        </div>
    </Card>
  );
};

export default MomentumWidget;
