
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MatchSortByType } from '../types';
import SegmentedControl from './common/SegmentedControl';

interface MatchListControlsProps {
  resultFilter: 'ALL' | 'VICTORIA' | 'DERROTA' | 'EMPATE';
  setResultFilter: (filter: 'ALL' | 'VICTORIA' | 'DERROTA' | 'EMPATE') => void;
  sortBy: MatchSortByType;
  setSortBy: (sort: MatchSortByType) => void;
  isDesktop: boolean;
  availableTournaments: string[];
  tournamentFilter: string;
  setTournamentFilter: (filter: string) => void;
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
}) => {
  const { theme } = useTheme();

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.medium,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.small,
      border: `1px solid ${theme.colors.border}`,
      flexDirection: isDesktop ? 'row' : 'column',
      flexWrap: 'wrap',
    },
    filterGroup: {
      display: 'flex',
      gap: theme.spacing.small,
      alignItems: 'center',
      width: isDesktop ? 'auto' : '100%',
      flexGrow: isDesktop ? 1 : 0,
      flexBasis: isDesktop ? 'auto' : '100%',
    },
    label: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.secondaryText,
      fontWeight: 500,
      flexShrink: 0,
    },
    select: {
      backgroundColor: theme.colors.background,
      color: theme.colors.primaryText,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.small,
      fontSize: theme.typography.fontSize.small,
      fontWeight: 600,
      cursor: 'pointer',
      flex: 1,
      minWidth: '120px',
    }
  };
  
  const resultFilterOptions = [
    { label: 'Todos', value: 'ALL' },
    { label: 'V', value: 'VICTORIA' },
    { label: 'E', value: 'EMPATE' },
    { label: 'D', value: 'DERROTA' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.filterGroup}>
        <span style={styles.label}>Filtrar:</span>
        <SegmentedControl
          options={resultFilterOptions}
          selectedValue={resultFilter}
          onSelect={(value) => setResultFilter(value as 'ALL' | 'VICTORIA' | 'DERROTA' | 'EMPATE')}
        />
      </div>
       <div style={styles.filterGroup}>
        <span style={styles.label}>Torneo:</span>
        <select value={tournamentFilter} onChange={e => setTournamentFilter(e.target.value)} style={styles.select}>
            <option value="ALL">Todos</option>
            <option value="NONE">Vacío (Sin nombre)</option>
            {availableTournaments.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={styles.filterGroup}>
        <span style={styles.label}>Ordenar por:</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as MatchSortByType)} style={styles.select}>
            <option value="date_desc">Más RECIENTES</option>
            <option value="date_asc">Más ANTIGUOS</option>
            <option value="goals_desc">Más GOLES</option>
            <option value="goals_asc">Menos GOLES</option>
            <option value="assists_desc">Más ASISTENCIAS</option>
            <option value="assists_asc">Menos ASISTENCIAS</option>
        </select>
      </div>
    </div>
  );
};

export default MatchListControls;
