

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { parseLocalDate } from '../../utils/analytics';
import type { Match } from '../../types';

interface CompactMatchCardProps {
  match: Match;
}

const resultAbbreviations: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = {
  VICTORIA: 'V',
  DERROTA: 'D',
  EMPATE: 'E',
};


const CompactMatchCard: React.FC<CompactMatchCardProps> = ({ match }) => {
  const { theme } = useTheme();

  const getResultBadgeStyle = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
    const baseStyle = {
      width: '24px',
      height: '24px',
      borderRadius: theme.borderRadius.small,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.8rem',
      fontWeight: 700,
      border: '1px solid',
      flexShrink: 0,
    };
    switch (result) {
      case 'VICTORIA':
        return { ...baseStyle, backgroundColor: `${theme.colors.win}26`, color: theme.colors.win, borderColor: `${theme.colors.win}80` };
      case 'DERROTA':
        return { ...baseStyle, backgroundColor: `${theme.colors.loss}26`, color: theme.colors.loss, borderColor: `${theme.colors.loss}80` };
      case 'EMPATE':
        return { ...baseStyle, backgroundColor: `${theme.colors.draw}33`, color: theme.colors.draw, borderColor: `${theme.colors.draw}80` };
    }
  };
  
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.medium,
        padding: theme.spacing.small,
        border: `1px solid ${theme.colors.borderStrong}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing.medium,
    },
    leftContent: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.medium,
        flex: 1,
        minWidth: 0,
    },
    date: {
        fontSize: '0.75rem',
        color: theme.colors.secondaryText,
        fontWeight: 500,
    },
    statsContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.small,
        flexWrap: 'wrap',
    },
    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: theme.colors.primaryText,
        backgroundColor: theme.colors.surface,
        padding: '2px 6px',
        borderRadius: theme.borderRadius.small,
    }
  };

  return (
    <div style={styles.container}>
        <div style={styles.leftContent}>
            <span style={styles.date}>{parseLocalDate(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
            <div style={styles.statsContainer}>
                <span style={styles.statItem}>⚽️ {match.myGoals}</span>
                <span style={styles.statItem}>👟 {match.myAssists}</span>
                {match.goalDifference !== undefined && match.result !== 'EMPATE' && match.goalDifference !== 0 && (
                    <span style={styles.statItem}>
                        {match.goalDifference > 0 ? `+${match.goalDifference}` : match.goalDifference}
                    </span>
                )}
            </div>
        </div>
        <span style={getResultBadgeStyle(match.result)}>{resultAbbreviations[match.result]}</span>
    </div>
  );
};

export default CompactMatchCard;