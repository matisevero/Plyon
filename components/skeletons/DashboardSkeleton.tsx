
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Skeleton from '../common/Skeleton';

const DashboardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const isDesktop = window.innerWidth >= 992;

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      maxWidth: '1600px',
      margin: '0 auto',
      padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.large,
      width: '100%',
      boxSizing: 'border-box',
    },
    header: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      marginBottom: '1rem'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr',
      gap: theme.spacing.large,
    },
    column: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.large,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      border: `1px solid ${theme.colors.border}`,
      padding: theme.spacing.large,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    statGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem'
    }
  };

  return (
    <div style={styles.container}>
      {/* Fake Header */}
      <div style={styles.header}>
         <Skeleton width="200px" height="32px" />
         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <Skeleton width="150px" height="24px" />
            <Skeleton width="100px" height="40px" style={{borderRadius: '50px'}} />
         </div>
      </div>

      <div style={styles.grid}>
        {/* Column 1: Summary & Streaks */}
        <div style={styles.column}>
            <div style={styles.card}>
                <Skeleton width="40%" height="20px" style={{marginBottom: '10px'}} />
                <div style={styles.statGrid}>
                    <Skeleton height="80px" />
                    <Skeleton height="80px" />
                    <Skeleton height="80px" />
                    <Skeleton height="80px" />
                </div>
            </div>
            <div style={styles.card}>
                <Skeleton width="50%" height="20px" style={{marginBottom: '10px'}} />
                <div style={styles.statGrid}>
                    <Skeleton height="60px" />
                    <Skeleton height="60px" />
                </div>
            </div>
        </div>

        {/* Column 2: Metrics */}
        <div style={styles.column}>
            <div style={styles.card}>
                <Skeleton width="60%" height="20px" style={{marginBottom: '10px'}} />
                <div style={styles.statGrid}>
                    <Skeleton height="80px" />
                    <Skeleton height="80px" />
                </div>
                <Skeleton height="200px" style={{marginTop: '10px'}} />
            </div>
        </div>

        {/* Column 3: Calendar */}
        <div style={styles.column}>
             <div style={styles.card}>
                <Skeleton width="70%" height="20px" style={{marginBottom: '10px'}} />
                <Skeleton height="40px" style={{marginBottom: '10px'}} />
                <Skeleton height="150px" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
