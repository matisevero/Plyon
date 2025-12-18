
import React, { useMemo, useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { calculatePlayerMorale, parseLocalDate } from '../utils/analytics';
import MomentPreviewCard from '../components/social/MomentPreviewCard';
import ShareMomentModal from '../components/modals/ShareMomentModal';
import { StarIcon } from '../components/icons/StarIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { BrainIcon } from '../components/icons/BrainIcon';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/common/Card';
import { useTutorial } from '../hooks/useTutorial';
import TutorialModal from '../components/modals/TutorialModal';
import { InfoIcon } from '../components/icons/InfoIcon';

export interface ShareableMoment {
  type: 'match' | 'achievement' | 'match_mvp' | 'last_match' | 'recent_form' | 'monthly_summary' | 'morale' | 'yearly_summary';
  title: string;
  date: string;
  data: any;
  icon: React.ReactNode;
}

const SocialPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, isShareMode } = useData();
  const [selectedMoment, setSelectedMoment] = useState<ShareableMoment | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  
  // Tutorial
  const { isTutorialSeen, markTutorialAsSeen } = useTutorial('social');
  const [isTutorialOpen, setIsTutorialOpen] = useState(!isTutorialSeen && !isShareMode);

  const tutorialSteps = [
    {
        title: 'Tus Momentos',
        content: 'Genera tarjetas visuales de tus logros, rachas y partidos para compartir en Instagram o WhatsApp.',
        icon: <StarIcon size={48} />,
    }
  ];

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shareableMoments: ShareableMoment[] = useMemo(() => {
    const moments: ShareableMoment[] = [];
    if (matches.length < 3) return [];

    const sortedMatches = [...matches].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());

    // 1. Last Match
    const lastMatch = sortedMatches[0];
    if (lastMatch) {
      const resultIcons: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = { VICTORIA: '✅', EMPATE: '🤝', DERROTA: '❌' };
      moments.push({
        type: 'last_match',
        title: 'Último partido jugado',
        date: parseLocalDate(lastMatch.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        data: lastMatch,
        icon: <span style={{ fontSize: '1.5rem' }}>{resultIcons[lastMatch.result]}</span>,
      });
    }

    // 2. Recent Form
    const recentFormMatches = sortedMatches.slice(0, 5);
    if (recentFormMatches.length === 5) {
      moments.push({
        type: 'recent_form',
        title: 'Racha de últimos 5 partidos',
        date: 'Forma reciente',
        data: recentFormMatches.map(m => m.result),
        icon: <TrendingUpIcon />,
      });
    }

    // 3. Monthly Summary
    if (sortedMatches.length > 0) {
        const lastMatchDate = parseLocalDate(sortedMatches[0].date);
        const lastActivityMonth = lastMatchDate.getMonth();
        const lastActivityYear = lastMatchDate.getFullYear();

        const lastMonthWithMatches = sortedMatches.filter(m => {
            const d = parseLocalDate(m.date);
            return d.getFullYear() === lastActivityYear && d.getMonth() === lastActivityMonth;
        });

        if (lastMonthWithMatches.length > 0) {
            const wins = lastMonthWithMatches.filter(m => m.result === 'VICTORIA').length;
            const draws = lastMonthWithMatches.filter(m => m.result === 'EMPATE').length;
            const losses = lastMonthWithMatches.length - wins - draws;
            const goals = lastMonthWithMatches.reduce((sum, m) => sum + m.myGoals, 0);
            const assists = lastMonthWithMatches.reduce((sum, m) => sum + m.myAssists, 0);
            const monthName = new Date(lastActivityYear, lastActivityMonth).toLocaleString('es-ES', { month: 'long' });
            
            moments.push({
                type: 'monthly_summary',
                title: `Resumen de ${monthName}`,
                date: 'Estadísticas del mes',
                data: {
                    monthName,
                    matches: lastMonthWithMatches.length,
                    wins, draws, losses, goals, assists
                },
                icon: <CalendarIcon />,
            });
        }
    }
    
    // 4. Player Morale
    const moraleData = calculatePlayerMorale(matches);
    if (moraleData) {
        moments.push({
            type: 'morale',
            title: `Moral: ${moraleData.level}`,
            date: 'Análisis de rendimiento',
            data: moraleData,
            icon: <BrainIcon />,
        });
    }

    // 5. Most Recent Impressive Win
    const recentWin = sortedMatches.find(m => m.result === 'VICTORIA' && (m.myGoals + m.myAssists >= 2));
    if (recentWin) {
      moments.push({
        type: 'match',
        title: 'Última gran victoria',
        date: parseLocalDate(recentWin.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        data: recentWin,
        icon: <StarIcon />,
      });
    }

    return moments;
  }, [matches]);

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.large,
    },
    pageTitle: {
      fontSize: theme.typography.fontSize.extraLarge,
      fontWeight: 700,
      color: theme.colors.primaryText,
      margin: 0,
      borderLeft: `4px solid ${theme.colors.accent1}`,
      paddingLeft: theme.spacing.medium,
    },
    titleContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.medium,
        marginBottom: theme.spacing.medium,
    },
    infoButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
    },
    grid: {
      display: isDesktop ? 'grid' : 'flex',
      flexDirection: 'column',
      gridTemplateColumns: '1fr 1fr',
      gap: theme.spacing.medium,
    },
  };
  
  return (
      <>
        <TutorialModal 
            isOpen={isTutorialOpen}
            onClose={(dontShowAgain) => {
                setIsTutorialOpen(false);
                if(dontShowAgain) markTutorialAsSeen();
            }}
            steps={tutorialSteps}
        />
        
        <main style={styles.container}>
          <div style={styles.titleContainer}>
            <h2 style={{...styles.pageTitle, marginBottom: 0}}>Momentos</h2>
            <button onClick={() => setIsTutorialOpen(true)} style={styles.infoButton} aria-label="Mostrar guía">
                <InfoIcon color={theme.colors.secondaryText}/>
            </button>
          </div>

          <div style={styles.grid}>
            {matches.length < 3 ? (
                <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                    <p style={{color: theme.colors.secondaryText, fontStyle: 'italic'}}>Registra al menos 3 partidos para generar momentos compartibles.</p>
                </Card>
            ) : (
                shareableMoments.map((moment, index) => (
                <MomentPreviewCard
                    key={index}
                    title={moment.title}
                    icon={moment.icon}
                    date={moment.date}
                    onOpen={() => setSelectedMoment(moment)}
                />
                ))
            )}
          </div>

          {selectedMoment && (
            <ShareMomentModal
              moment={selectedMoment}
              onClose={() => setSelectedMoment(null)}
            />
          )}
        </main>
      </>
  );
};

export default SocialPage;
