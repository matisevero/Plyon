
import React, { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { QualifiersProgress, Match } from '../../types';
import { generateQualifiersStandings } from '../../utils/analytics';

interface QualifiersTableProps {
  progress: QualifiersProgress;
  playerName: string;
  directSlots: number;
  playoffSlots: number;
  campaignMatches?: Match[];
}

const QualifiersTable: React.FC<QualifiersTableProps> = ({ progress, playerName, directSlots, playoffSlots, campaignMatches }) => {
  const { theme } = useTheme();

  const standings = useMemo(() => {
    // Priority: use explicit matches (date-filtered from parent), fallback to internal list
    const matchesToUse = campaignMatches || progress.completedMatches || [];
    return generateQualifiersStandings(progress, playerName, matchesToUse);
  }, [progress, playerName, campaignMatches]);
  
  const getRowStyle = (name: string): React.CSSProperties => {
      const baseStyle: React.CSSProperties = {
          borderBottom: `1px solid ${theme.colors.border}`,
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          padding: `0.6rem ${theme.spacing.small}`,
      };
      if (name === playerName) {
          baseStyle.backgroundColor = `${theme.colors.accent2}20`;
          baseStyle.fontWeight = 'bold';
      }
      return baseStyle;
  }

  const getPositionCellStyle = (position: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
        textAlign: 'center',
        padding: `${theme.spacing.extraSmall} 0`,
        borderRadius: theme.borderRadius.small,
        lineHeight: 1.5,
        width: '32px',
    };
    if (position <= directSlots) {
        baseStyle.backgroundColor = `${theme.colors.win}33`;
        baseStyle.color = theme.colors.win;
        baseStyle.fontWeight = 'bold';
    } else if (position <= directSlots + playoffSlots) {
        baseStyle.backgroundColor = `${theme.colors.accent3}33`;
        baseStyle.color = theme.colors.accent3;
        baseStyle.fontWeight = 'bold';
    }
    return baseStyle;
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.large,
        border: `1px solid ${theme.colors.border}`,
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        padding: `0.6rem ${theme.spacing.small}`,
        fontSize: theme.typography.fontSize.small,
        color: theme.colors.secondaryText,
        fontWeight: 600,
        borderBottom: `2px solid ${theme.colors.borderStrong}`,
    },
    cell: {
        whiteSpace: 'nowrap',
    },
    teamCellContent: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.small,
        overflow: 'hidden',
    },
    teamName: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
    }
  };

  const statCellStyles: React.CSSProperties = { ...styles.cell, textAlign: 'right' };

  return (
    <div style={styles.container}>
        <div style={styles.header}>
            <span style={{...styles.cell, width: '32px', textAlign: 'center', paddingRight: theme.spacing.small}}>#</span>
            <span style={{...styles.cell, flex: 1}}>Equipo</span>
            <span style={{...statCellStyles, width: '40px'}}>Pts</span>
            <span style={{...statCellStyles, width: '40px'}}>PJ</span>
            <span style={{...statCellStyles, width: '30px'}}>V</span>
            <span style={{...statCellStyles, width: '30px'}}>E</span>
            <span style={{...statCellStyles, width: '30px'}}>D</span>
        </div>
        <div>
            {standings.map((team, index) => (
                <div key={team.name} style={{...getRowStyle(team.name), ...(index === standings.length - 1 && { borderBottom: 'none' })}}>
                    <span style={{...styles.cell, ...getPositionCellStyle(team.position)}}>
                        {team.position}
                    </span>
                    <span style={{...styles.cell, flex: 1, paddingLeft: theme.spacing.small, ...styles.teamCellContent}}>
                        <span style={styles.teamName}>
                            {team.name}
                        </span>
                    </span>
                    <span style={{...statCellStyles, width: '40px', fontWeight: 'bold'}}>{team.points}</span>
                    <span style={{...statCellStyles, width: '40px'}}>{team.played}</span>
                    <span style={{...statCellStyles, width: '30px'}}>{team.wins}</span>
                    <span style={{...statCellStyles, width: '30px'}}>{team.draws}</span>
                    <span style={{...statCellStyles, width: '30px'}}>{team.losses}</span>
                </div>
            ))}
        </div>
    </div>
  );
};

export default QualifiersTable;
