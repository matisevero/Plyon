
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MatchSortByType } from '../types';
import SegmentedControl from './common/SegmentedControl';
import YearFilter from './YearFilter';

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

  // Flecha personalizada para el select que cambie de color según el tema
  const arrowColor = encodeURIComponent(theme.colors.secondaryText);
  const selectArrow = `url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22${arrowColor}%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`;

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      flexDirection: 'column', // Stack vertically: Year > Results > Dropdowns
      gap: theme.spacing.medium,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.small,
      border: `1px solid ${theme.colors.border}`,
      maxWidth: '100%', // Ensure container respects parent width
      boxSizing: 'border-box',
    },
    // Styles for the Result Filter (Segmented Control)
    resultFilterGroup: {
      width: '100%',
    },
    // Container for the two dropdowns (Tournament + Sort)
    dropdownsContainer: {
        display: 'flex',
        gap: theme.spacing.medium,
        width: '100%',
        flexWrap: 'nowrap', // Force side-by-side on mobile
    },
    // Styles for each dropdown group (Label + Select)
    filterGroup: {
      display: 'flex',
      gap: theme.spacing.small,
      alignItems: 'center',
      flex: 1, // Distribute space equally
      minWidth: 0, // Allow shrinking
    },
    label: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.secondaryText,
      fontWeight: 500,
      flexShrink: 0,
      display: isDesktop ? 'block' : 'none', // Hide label on mobile to save space if needed, or keep short
    },
    select: {
      appearance: 'none',
      WebkitAppearance: 'none',
      backgroundColor: theme.colors.background,
      color: theme.colors.primaryText,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium,
      padding: `${theme.spacing.small} 2rem ${theme.spacing.small} ${theme.spacing.small}`,
      fontSize: theme.typography.fontSize.small,
      fontWeight: 600,
      cursor: 'pointer',
      width: '100%', // Take full width of parent flex item
      backgroundImage: selectArrow,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 10px center',
      backgroundSize: '10px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    yearFilterWrapper: {
        paddingBottom: theme.spacing.small,
        borderBottom: `1px solid ${theme.colors.border}`,
        marginBottom: '-4px', // Pull closer to the next element visually
        maxWidth: '100%', // Fix: Prevent expansion beyond container
        overflow: 'hidden' // Fix: Ensure scrollable child is contained
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
      {/* Row 1: Year Filter */}
      <div style={styles.yearFilterWrapper}>
        <YearFilter 
            years={years} 
            selectedYear={selectedYear} 
            onSelectYear={onSelectYear} 
            size="small" 
            allTimeLabel="Todo el historial" 
        />
      </div>

      {/* Row 2: Result Filter */}
      <div style={styles.resultFilterGroup}>
        <SegmentedControl
          options={resultFilterOptions}
          selectedValue={resultFilter}
          onSelect={(value) => setResultFilter(value as 'ALL' | 'VICTORIA' | 'DERROTA' | 'EMPATE')}
        />
      </div>

      {/* Row 3: Dropdowns side-by-side */}
      <div style={styles.dropdownsContainer}>
        <div style={styles.filterGroup}>
            {isDesktop && <span style={styles.label}>Torneo:</span>}
            <select value={tournamentFilter} onChange={e => setTournamentFilter(e.target.value)} style={styles.select}>
                <option value="ALL">Todos los torneos</option>
                <option value="NONE">Sin torneo</option>
                {availableTournaments.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        <div style={styles.filterGroup}>
            {isDesktop && <span style={styles.label}>Orden:</span>}
            <select value={sortBy} onChange={e => setSortBy(e.target.value as MatchSortByType)} style={styles.select}>
                <option value="date_desc">Más recientes</option>
                <option value="date_asc">Más antiguos</option>
                <option value="goals_desc">Más goles</option>
                <option value="goals_asc">Menos goles</option>
                <option value="assists_desc">Más asistencias</option>
                <option value="assists_asc">Menos asistencias</option>
            </select>
        </div>
      </div>
    </div>
  );
};

export default MatchListControls;
