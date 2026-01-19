
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { CheckIcon } from '../../components/icons/CheckIcon';
import { LockIcon } from '../../components/icons/LockIcon';
import type { Match } from '../../types';
import CompactMatchCard from '../../components/worldcup/CompactMatchCard';

interface StageItemProps {
  label: string;
  status: 'current' | 'completed' | 'locked';
  match?: Match;
}

const StageItem: React.FC<StageItemProps> = ({ label, status, match }) => {
  const { theme } = useTheme();
  const { playerProfile } = useData();
  const isElite = playerProfile.worldCupProgress?.isQualified;

  const getContainerStyle = (): React.CSSProperties => {
      const baseStyle: React.CSSProperties = {
          display: 'flex', flexDirection: 'column', gap: theme.spacing.medium,
          padding: theme.spacing.medium,
          borderRadius: theme.borderRadius.large,
          border: '2px solid',
          width: '100%',
          maxWidth: '350px',
          transition: 'all 0.3s ease',
      };
      switch(status) {
          case 'completed':
              return { ...baseStyle, borderColor: theme.colors.win, backgroundColor: `${theme.colors.win}20`, opacity: 0.7 };
          case 'current':
              return { ...baseStyle, borderColor: isElite ? theme.colors.accent1 : theme.colors.accent2, backgroundColor: theme.colors.surface, transform: 'scale(1.05)', boxShadow: isElite ? `0 0 15px ${theme.colors.accent1}40` : theme.shadows.medium };
          case 'locked':
              return { ...baseStyle, borderColor: theme.colors.border, backgroundColor: theme.colors.background, opacity: 0.5 };
      }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.medium
    },
    label: { fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    icon: { display: 'flex', alignItems: 'center' },
    eliteBadge: {
        fontSize: '0.65rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: theme.colors.accent1,
        letterSpacing: '0.1em',
        marginBottom: '4px'
    }
  };

  return (
    <div style={getContainerStyle()}>
        {status === 'current' && isElite && <div style={styles.eliteBadge}>Torneo de Élite (Puntos x10)</div>}
        <div style={styles.header}>
            <span style={styles.label}>{label}</span>
            <div style={styles.icon}>
                {status === 'completed' && <CheckIcon color={theme.colors.win} />}
                {status === 'locked' && <LockIcon color={theme.colors.secondaryText} />}
            </div>
        </div>
        {match && (
            <div style={{ paddingTop: theme.spacing.small, borderTop: `1px solid ${theme.colors.border}` }}>
                <CompactMatchCard match={match} />
            </div>
        )}
    </div>
  );
};

export default StageItem;
