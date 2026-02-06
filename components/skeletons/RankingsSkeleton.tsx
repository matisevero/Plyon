
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Skeleton from '../common/Skeleton';

const RankingsSkeleton: React.FC = () => {
  const { theme } = useTheme();

  const styles: { [key: string]: React.CSSProperties } = {
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.medium,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      border: `1px solid ${theme.colors.border}`,
      marginBottom: theme.spacing.small,
    },
    rankBox: {
        width: '28px',
        display: 'flex',
        justifyContent: 'center'
    },
    info: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    }
  };

  return (
    <div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={styles.item}>
            <div style={styles.rankBox}>
                 <Skeleton width="15px" height="20px" />
            </div>
            <Skeleton width="40px" height="40px" variant="circle" />
            <div style={styles.info}>
                <Skeleton width="140px" height="16px" />
                <Skeleton width="80px" height="12px" />
            </div>
            <Skeleton width="50px" height="20px" />
        </div>
      ))}
    </div>
  );
};

export default RankingsSkeleton;
