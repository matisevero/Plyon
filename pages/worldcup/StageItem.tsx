
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
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
              return { ...baseStyle, borderColor: theme.colors.accent2, backgroundColor: theme.colors.surface, transform: 'scale(1.05)' };
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
    label: { fontSize: theme.typography.fontSize.large, fontWeight: 600, color: theme.colors.primaryText },
    icon: { display: 'flex', alignItems: 'center' }
  };

  return (
    <div style={getContainerStyle()}>
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
