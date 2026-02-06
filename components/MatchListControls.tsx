import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MatchSortByType } from '../types';
import SegmentedControl from './common/SegmentedControl';
import YearFilter from './YearFilter';
import s from './MatchListControls.module.css';

interface MatchListControlsProps {
  resultFilter: 'ALL' | 'VICTORIA' | 'DERROTA' | 'EMPATE';
  setResultFilter: (filter: 'ALL' | 'VICTORIA' | 'DERROTA' | 'EMPATE') => void;
  sortBy: MatchSortByType;
  setSortBy: (sort: MatchSortByType) => void;
  isDesktop: boolean;
  availableTournaments: string[];
  tournamentFilter: string;
  setTournamentFilter: (filter: string) => void;
  years: (string | number)[];
  selectedYear: string | 'all';
  onSelectYear: (year: string | 'all') => void;
}

const MatchListControls: React.FC<MatchListControlsProps> = ({
  resultFilter,
  setResultFilter,
  sortBy,
  setSortBy,
  isDesktop,
  availableTournaments,
  tournamentFilter,
  setTournamentFilter,
  years,
  selectedYear,
  onSelectYear
}) => {
  const { theme } = useTheme();

  // Themed select arrow
  const arrowColor = encodeURIComponent(theme.colors.secondaryText);
  const selectArrow = `url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22${arrowColor}%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`;

  const resultFilterOptions = [
    { label: 'Todos', value: 'ALL' },
    { label: 'V', value: 'VICTORIA' },
    { label: 'E', value: 'EMPATE' },
    { label: 'D', value: 'DERROTA' },
  ];

  return (
    <div className={s.container}>
      {/* Row 1: Year Filter */}
      <div className={s.yearFilterWrapper}>
        <YearFilter 
            years={years} 
            selectedYear={selectedYear} 
            onSelectYear={onSelectYear} 
            size="small" 
            allTimeLabel="Todo el historial" 
        />
      </div>

      {/* Row 2: Result Filter */}
      <div className={s.resultFilterGroup}>
        <SegmentedControl
          options={resultFilterOptions}
          selectedValue={resultFilter}
          onSelect={(value) => setResultFilter(value as 'ALL' | 'VICTORIA' | 'DERROTA' | 'EMPATE')}
        />
      </div>

      {/* Row 3: Dropdowns side-by-side */}
      <div className={s.dropdownsContainer}>
        <div className={s.filterGroup}>
            {isDesktop && <span className={s.label}>Torneo:</span>}
            <select value={tournamentFilter} onChange={e => setTournamentFilter(e.target.value)} className={s.select} style={{ backgroundImage: selectArrow }}>
                <option value="ALL">Todos los torneos</option>
                <option value="NONE">Sin torneo</option>
                {availableTournaments.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        <div className={s.filterGroup}>
            {isDesktop && <span className={s.label}>Orden:</span>}
            <select value={sortBy} onChange={e => setSortBy(e.target.value as MatchSortByType)} className={s.select} style={{ backgroundImage: selectArrow }}>
                <option value="date_desc">{'Más recientes'}</option>
                <option value="date_asc">{'Más antiguos'}</option>
                <option value="goals_desc">{'Más goles'}</option>
                <option value="goals_asc">Menos goles</option>
                <option value="assists_desc">{'Más asistencias'}</option>
                <option value="assists_asc">Menos asistencias</option>
            </select>
        </div>
      </div>
    </div>
  );
};

export default MatchListControls;
