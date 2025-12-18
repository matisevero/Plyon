import React from 'react';
import type { Match, PlayerPerformance } from '../types';
import { MatchSortByType } from '../types';
import MatchCard from './MatchCard';
import { FootballIcon } from './icons/FootballIcon';
import { useTheme } from '../contexts/ThemeContext';

interface MatchListProps {
  matches: Match[];
  allMatches: Match[];
  allPlayers: string[];
  onDeleteMatch?: (matchId: string) => void;
  onEditMatch?: (matchId: string) => void;
  isReadOnly?: boolean;
  sortBy?: MatchSortByType;
  onImportClick?: () => void;
}

const MatchList: React.FC<MatchListProps> = ({ matches, allMatches, allPlayers, onDeleteMatch, onEditMatch, isReadOnly = false, sortBy, onImportClick }) => {
  const { theme } = useTheme();

  const styles: { [key: string]: React.CSSProperties } = {
    list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    emptyState: {
      textAlign: 'center', padding: '3rem 2rem', backgroundColor: theme.colors.surface,
      borderRadius: '12px', border: `1px dashed ${theme.colors.border}`, color: theme.colors.secondaryText,
    },
    emptyStateIcon: { marginBottom: '1rem' },
    emptyStateTitle: { margin: '0 0 0.5rem 0', color: theme.colors.primaryText, fontSize: '1.25rem' },
    emptyStateText: { margin: 0, fontSize: '0.9rem' },
    importButton: {
      marginTop: '1.5rem',
      padding: '0.75rem 1.5rem',
      border: `1px solid ${theme.colors.accent2}`,
      borderRadius: theme.borderRadius.medium,
      fontSize: theme.typography.fontSize.small,
      fontWeight: 'bold',
      cursor: 'pointer',
      backgroundColor: 'transparent',
      color: theme.colors.accent2,
      transition: 'background-color 0.2s, color 0.2s',
    }
  };
  
  if (allMatches.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyStateIcon}><FootballIcon color={theme.colors.secondaryText} /></div>
        <h3 style={styles.emptyStateTitle}>No hay partidos registrados</h3>
        <p style={styles.emptyStateText}>Añade tu primer partido o importa tu historial existente.</p>
        {onImportClick && (
          <button 
            onClick={onImportClick} 
            style={styles.importButton}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.colors.accent2; e.currentTarget.style.color = theme.colors.textOnAccent; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.colors.accent2; }}
          >
            Importar Datos
          </button>
        )}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyStateIcon}><FootballIcon color={theme.colors.secondaryText} /></div>
        <h3 style={styles.emptyStateTitle}>No se encontraron partidos</h3>
        <p style={styles.emptyStateText}>Prueba de cambiar los filtros o añade un nuevo partido para empezar.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .match-card-enter {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0; /* Start hidden */
        }
      `}</style>
      <div style={styles.list}>
        {matches.map((match, index) => (
          <div 
            key={match.id} 
            className="match-card-enter" 
            style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
          >
            <MatchCard 
              match={match} 
              allMatches={allMatches}
              allPlayers={allPlayers}
              onDelete={onDeleteMatch ? () => onDeleteMatch(match.id) : undefined}
              onEdit={onEditMatch ? () => onEditMatch(match.id) : undefined}
              isReadOnly={isReadOnly}
              sortBy={sortBy}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default MatchList;
