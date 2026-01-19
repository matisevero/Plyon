
import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Confetti from '../../components/effects/Confetti';
import { WORLD_CUP_LOGO } from '../../utils/analytics';
import { TrophyIcon } from '../../components/icons/TrophyIcon';

interface ChampionCelebrationProps {
  onNextCampaign: () => void;
}

const ChampionCelebration: React.FC<ChampionCelebrationProps> = ({ onNextCampaign }) => {
  const { theme } = useTheme();
  const [imgError, setImgError] = useState(false);

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 65px)',
      textAlign: 'center',
      padding: theme.spacing.large,
      animation: 'fadeIn 1s ease-out',
    },
    trophyContainer: {
      animation: 'trophyBounce 2s ease-in-out infinite',
      marginBottom: theme.spacing.large,
    },
    title: {
      fontSize: '3rem',
      fontWeight: 900,
      margin: 0,
      color: '#FFD700',
      textShadow: '0 0 10px #FFD700, 0 0 20px #FFD700, 0 0 30px #000',
    },
    subtitle: {
      fontSize: '1.2rem',
      color: theme.colors.primaryText,
      margin: `${theme.spacing.small} 0 ${theme.spacing.extraLarge} 0`,
    },
    button: {
      padding: `${theme.spacing.medium} ${theme.spacing.extraLarge}`,
      borderRadius: theme.borderRadius.medium,
      fontSize: theme.typography.fontSize.large,
      fontWeight: 'bold',
      cursor: 'pointer',
      backgroundColor: theme.colors.accent1,
      color: theme.colors.textOnAccent,
      border: 'none',
      transition: 'transform 0.2s',
    },
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes trophyBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
      <Confetti />
      <div style={styles.container}>
        <div style={styles.trophyContainer}>
          {!imgError ? (
              <img 
                src={WORLD_CUP_LOGO[theme.name]} 
                alt="Logo de la Copa del Mundo 2026" 
                style={{ width: '150px', height: 'auto', objectFit: 'contain' }} 
                onError={() => setImgError(true)}
              />
          ) : (
              <TrophyIcon size={150} color="#FFD700" />
          )}
        </div>
        <h1 style={styles.title}>¡CAMPEÓN DEL MUNDO!</h1>
        <p style={styles.subtitle}>Has conquistado la gloria. La copa es tuya.</p>
        <button
          style={styles.button}
          onClick={onNextCampaign}
        >
          Defender el Título
        </button>
      </div>
    </>
  );
};

export default ChampionCelebration;
