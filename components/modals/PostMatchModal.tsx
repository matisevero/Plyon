
import React, { useEffect, useMemo, useState, useRef, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { useTheme } from '../../contexts/ThemeContext';
import type { Match, PlayerProfileData } from '../../types';
import Card from '../common/Card';
import { parseLocalDate, CONFEDERATIONS } from '../../utils/analytics';
import { ShareIcon } from '../icons/ShareIcon';
import { Loader } from '../Loader';
import { DownloadIcon } from '../icons/DownloadIcon';
import { PlayerIcon } from '../icons/PlayerIcon';
import { FootballIcon } from '../icons/FootballIcon';
import { useData } from '../../contexts/DataContext';

interface PostMatchModalProps {
  match: Match;
  matches: Match[];
  onClose: () => void;
  playerProfile: PlayerProfileData;
}

const resultAbbreviations: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = {
    VICTORIA: 'V',
    DERROTA: 'D',
    EMPATE: 'E',
};

interface ShareableImageCardProps {
  match: Match;
  theme: any;
  campaignContext: { name: string } | null;
  hasActiveStreaks: boolean;
  streaks: any;
  recentForm: Match[];
}

const ShareableImageCard = forwardRef<HTMLDivElement, ShareableImageCardProps>((props, ref) => {
    const { match, theme, campaignContext, hasActiveStreaks, streaks, recentForm } = props;

    const getResultColor = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): string => {
        switch (result) {
            case 'VICTORIA': return theme.colors.win;
            case 'DERROTA': return theme.colors.loss;
            case 'EMPATE': return theme.colors.draw;
        }
    };
    
    const styles: { [key: string]: React.CSSProperties } = {
        container: {
            width: '360px',
            height: '450px',
            backgroundColor: theme.colors.surface,
            fontFamily: theme.typography.fontFamily,
            color: theme.colors.primaryText,
            display: 'flex',
            flexDirection: 'column',
            padding: theme.spacing.large,
        },
        mainContent: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
        },
        header: { textAlign: 'center' },
        title: { fontSize: '1.5rem', fontWeight: 700, margin: `0 0 ${theme.spacing.extraSmall} 0`, background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', },
        subtitle: { fontSize: '0.8rem', color: theme.colors.secondaryText, margin: 0 },
        detailsGrid: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center', padding: `${theme.spacing.small} 0` },
        statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.extraSmall, },
        statValue: { display: 'flex', alignItems: 'center', gap: theme.spacing.small, fontSize: '2rem', fontWeight: 700, lineHeight: 1.1, },
        statLabel: { fontSize: '0.8rem', color: theme.colors.secondaryText, textTransform: 'uppercase' },
        campaignBanner: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: theme.spacing.extraSmall,
            backgroundColor: theme.colors.background,
            padding: `${theme.spacing.small} ${theme.spacing.medium}`,
            borderRadius: theme.borderRadius.medium,
            border: `1px solid ${theme.colors.borderStrong}`,
            marginBottom: theme.spacing.medium,
        },
        campaignTitleContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.small,
        },
        campaignTitle: {
            fontWeight: 700,
            color: theme.colors.primaryText,
            fontSize: '0.9rem',
            margin: 0,
        },
        campaignName: {
            fontWeight: 500,
            color: theme.colors.secondaryText,
            fontSize: '0.8rem',
            margin: 0,
        },
        section: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.small },
        sectionTitle: { fontSize: '0.75rem', fontWeight: 700, color: theme.colors.draw, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'center', },
        streaksContainer: { display: 'flex', justifyContent: 'center', gap: theme.spacing.small, flexWrap: 'wrap', },
        streakItem: { backgroundColor: theme.colors.background, padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`, borderRadius: theme.borderRadius.medium, display: 'flex', alignItems: 'center', gap: theme.spacing.small, fontSize: '0.75rem', color: theme.colors.primaryText, },
        recentFormContainer: { display: 'flex', gap: '4px', justifyContent: 'center', },
        formBlock: { width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.textOnAccent, fontWeight: 'bold', fontSize: '0.8rem' },
        footer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: theme.spacing.small, paddingTop: theme.spacing.medium, opacity: 0.7, },
        footerText: { fontSize: '1rem', fontWeight: 600 },
    };

    return (
        <div ref={ref} style={styles.container}>
            <div style={styles.mainContent}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Informe Post-Partido</h2>
                    <p style={styles.subtitle}>{parseLocalDate(match.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div style={styles.detailsGrid}>
                    <div style={styles.statItem}><span style={{...styles.statValue, color: getResultColor(match.result)}}>{match.result}</span><span style={styles.statLabel}>Resultado</span></div>
                    <div style={styles.statItem}><span style={{...styles.statValue, color: theme.colors.primaryText}}><span style={{fontSize: '1.5rem'}}>⚽️</span> {match.myGoals}</span><span style={styles.statLabel}>Goles</span></div>
                    <div style={styles.statItem}><span style={{...styles.statValue, color: theme.colors.primaryText}}><span style={{fontSize: '1.5rem'}}>👟</span> {match.myAssists}</span><span style={styles.statLabel}>Asistencias</span></div>
                </div>
                {campaignContext && (
                    <div style={styles.campaignBanner}>
                        <div style={styles.campaignTitleContainer}>
                            <PlayerIcon size={20} color={theme.colors.accent1} />
                            <h4 style={styles.campaignTitle}>MODO CARRERA</h4>
                        </div>
                        <p style={styles.campaignName}>{campaignContext.name}</p>
                    </div>
                )}
                {hasActiveStreaks && <div style={styles.section}><h4 style={styles.sectionTitle}>Rachas actuales</h4><div style={styles.streaksContainer}>{streaks.resultStreak.count >= 2 && <div style={styles.streakItem}>{streaks.resultStreak.type === 'VICTORIA' ? '✅' : streaks.resultStreak.type === 'DERROTA' ? '❌' : '🤝'}<span><strong style={{marginRight: '0.25rem'}}>{streaks.resultStreak.count}</strong>{streaks.resultStreak.type.toLowerCase()}s</span></div>}{streaks.goalStreak >= 2 && <div style={styles.streakItem}>⚽️<span><strong style={{marginRight: '0.25rem'}}>{streaks.goalStreak}</strong> partidos marcando</span></div>}{streaks.assistStreak >= 2 && <div style={styles.streakItem}>👟<span><strong style={{marginRight: '0.25rem'}}>{streaks.assistStreak}</strong> partidos asistiendo</span></div>}</div></div>}
                <div style={styles.section}><h4 style={styles.sectionTitle}>Forma reciente</h4><div style={styles.recentFormContainer}>{recentForm.map(m => <div key={m.id} style={{...styles.formBlock, backgroundColor: getResultColor(m.result)}} title={parseLocalDate(m.date).toLocaleDateString()}>{resultAbbreviations[m.result]}</div>)}</div></div>
            </div>
            <footer style={styles.footer}>
                <FootballIcon size={24} color={theme.colors.primaryText} />
                <span style={styles.footerText}>Plyon</span>
            </footer>
        </div>
    );
});


const PostMatchModal: React.FC<PostMatchModalProps> = ({ match, matches, onClose, playerProfile }) => {
  const { theme } = useTheme();
  const shareableCardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        document.body.style.overflow = 'auto';
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const effectiveMatches = useMemo(() => {
      const isMatchInList = matches.some(m => m.id === match.id);
      return isMatchInList ? matches : [...matches, match];
  }, [matches, match]);

  const streaks = useMemo(() => {
    const sortedMatches = [...effectiveMatches].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
    if (sortedMatches.length === 0) {
      return { resultStreak: { type: 'NONE' as const, count: 0 }, goalStreak: 0, assistStreak: 0 };
    }

    let resultStreak: { type: 'VICTORIA' | 'DERROTA' | 'EMPATE' | 'NONE', count: number } = { type: 'NONE', count: 0 };
    if (sortedMatches.length > 0) {
        const lastResult = sortedMatches[0].result;
        let streakCount = 0;
        for (const m of sortedMatches) {
            if (m.result === lastResult) streakCount++;
            else break;
        }
        if (streakCount >= 2) resultStreak = { type: lastResult, count: streakCount };
    }

    let goalStreak = 0;
    for (const m of sortedMatches) {
        if (m.myGoals > 0) goalStreak++;
        else break;
    }
    
    let assistStreak = 0;
    for (const m of sortedMatches) {
        if (m.myAssists > 0) assistStreak++;
        else break;
    }

    return { resultStreak, goalStreak, assistStreak };
  }, [effectiveMatches]);

  const hasActiveStreaks = useMemo(() => {
    return streaks.resultStreak.count >= 2 || streaks.goalStreak >= 2 || streaks.assistStreak >= 2;
  }, [streaks]);

  const recentForm = useMemo(() => {
      return effectiveMatches
        .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())
        .slice(0, 10);
  }, [effectiveMatches]);

  const getResultColor = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): string => {
    switch (result) {
      case 'VICTORIA': return theme.colors.win;
      case 'DERROTA': return theme.colors.loss;
      case 'EMPATE': return theme.colors.draw;
    }
  };

  const { activeWorldCupMode, qualifiersProgress, worldCupProgress } = playerProfile;
  let campaignContext = null;
  if (activeWorldCupMode === 'qualifiers' && qualifiersProgress) {
      const conf = CONFEDERATIONS[qualifiersProgress.confederation];
      campaignContext = { name: `${conf.name} #${qualifiersProgress.campaignNumber}` };
  } else if (activeWorldCupMode === 'campaign' && worldCupProgress) {
      campaignContext = { name: `Mundial #${worldCupProgress.campaignNumber}` };
  }

  const handleAction = async (action: 'download' | 'share') => {
    if (!shareableCardRef.current) return;
    setIsGeneratingImage(true);
    setError(null);
    try {
        const dataUrl = await toPng(shareableCardRef.current, { 
            cacheBust: true,
            width: 360,
            height: 450,
            pixelRatio: 3,
        });

        if (action === 'download') {
            const link = document.createElement('a');
            link.download = `plyon-partido.png`;
            link.href = dataUrl;
            link.click();
        } else { // share
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `plyon-partido.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Informe de Partido - Plyon`,
                }).catch((error) => {
                  if (error.name !== 'AbortError') {
                    throw error;
                  }
                });
            } else {
                setError('La función de compartir no está disponible en este navegador. Intenta descargar la imagen.');
            }
        }
    } catch (err) {
      console.error("Failed to generate image:", err);
      if ((err as Error).name !== 'AbortError') {
        setError('Error al generar la imagen.');
      }
    } finally {
        setIsGeneratingImage(false);
    }
  };


  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000,
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.medium,
      animation: 'fadeIn 0.3s ease-out',
    },
    modalContent: {
      width: '100%', maxWidth: '500px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      animation: 'scaleUp 0.3s ease-out',
    },
    cardWrapper: {
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        padding: 0,
    },
    cardContent: {
        overflowY: 'auto',
    },
    shareableContent: {
        padding: theme.spacing.large,
        backgroundColor: theme.colors.surface
    },
    campaignBanner: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing.extraSmall,
        backgroundColor: theme.colors.background,
        padding: `${theme.spacing.small} ${theme.spacing.medium}`,
        borderRadius: theme.borderRadius.medium,
        marginTop: theme.spacing.large,
        marginBottom: theme.spacing.medium,
        border: `1px solid ${theme.colors.borderStrong}`,
    },
    campaignTitleContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.medium,
    },
    campaignTitle: {
        fontWeight: 700,
        color: theme.colors.primaryText,
        fontSize: theme.typography.fontSize.medium,
        margin: 0,
    },
    campaignName: {
        fontWeight: 600,
        color: theme.colors.secondaryText,
        fontSize: theme.typography.fontSize.small,
        margin: 0,
    },
    header: { textAlign: 'center', marginBottom: theme.spacing.medium },
    title: {
        fontSize: '1.75rem', fontWeight: 700, color: theme.colors.primaryText,
        margin: `0 0 ${theme.spacing.extraSmall} 0`,
        background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    subtitle: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, margin: 0 },
    section: { marginBottom: theme.spacing.large },
    sectionTitle: {
      fontSize: theme.typography.fontSize.extraSmall, fontWeight: 700, color: theme.colors.draw,
      textTransform: 'uppercase', letterSpacing: '0.05em', margin: `0 0 ${theme.spacing.medium} 0`,
      textAlign: 'center',
    },
    detailsGrid: {
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        textAlign: 'center',
        padding: theme.spacing.medium,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.medium,
    },
    statItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing.extraSmall,
    },
    statValue: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.small,
        fontSize: '1.75rem',
        fontWeight: 700,
        lineHeight: 1.1,
    },
    statLabel: {
        fontSize: theme.typography.fontSize.extraSmall,
        color: theme.colors.secondaryText,
        textTransform: 'uppercase',
    },
    streaksContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: theme.spacing.medium,
        flexWrap: 'wrap',
    },
    streakItem: {
        backgroundColor: theme.colors.background,
        padding: `${theme.spacing.small} ${theme.spacing.medium}`,
        borderRadius: theme.borderRadius.medium,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.small,
        fontSize: theme.typography.fontSize.small,
        color: theme.colors.primaryText,
    },
    streakValue: {
        fontWeight: 700,
        marginRight: '0.25rem',
    },
    recentFormContainer: {
        display: 'flex', gap: '4px', justifyContent: 'center',
        backgroundColor: theme.colors.background, padding: theme.spacing.medium,
        borderRadius: theme.borderRadius.medium,
    },
    formBlock: {
        width: '24px', height: '24px', borderRadius: '4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: theme.colors.textOnAccent, fontWeight: 'bold', fontSize: '0.8rem'
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.medium,
        padding: theme.spacing.large,
        paddingTop: theme.spacing.medium,
        borderTop: `1px solid ${theme.colors.border}`,
    },
    button: {
        padding: theme.spacing.medium,
        borderRadius: theme.borderRadius.medium,
        fontSize: theme.typography.fontSize.medium, fontWeight: 'bold', cursor: 'pointer',
        transition: 'filter 0.2s, background-color 0.2s',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.small,
    },
    iconButton: {
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      cursor: 'pointer',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '48px',
      height: '48px',
      transition: 'background-color 0.2s, filter 0.2s',
    },
    errorText: {
        textAlign: 'center',
        fontSize: theme.typography.fontSize.small,
        color: theme.colors.loss,
        marginTop: theme.spacing.small,
        height: '1em',
    }
  };

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .modal-scroll::-webkit-scrollbar { width: 6px; }
        .modal-scroll::-webkit-scrollbar-thumb { background-color: ${theme.colors.border}; border-radius: 3px; }
      `}</style>
      <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '1px', height: '1px', overflow: 'hidden' }}>
        <ShareableImageCard
            ref={shareableCardRef}
            match={match}
            theme={theme}
            campaignContext={campaignContext}
            hasActiveStreaks={hasActiveStreaks}
            streaks={streaks}
            recentForm={recentForm}
        />
      </div>
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <Card style={styles.cardWrapper}>
            <div style={styles.cardContent} className="modal-scroll">
              <div>
                <div style={styles.shareableContent}>
                    <div style={styles.header}>
                      <h2 style={styles.title}>Informe Post-Partido</h2>
                      <p style={styles.subtitle}>{parseLocalDate(match.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    
                    <div style={styles.detailsGrid}>
                        <div style={styles.statItem}>
                            <span style={{...styles.statValue, color: getResultColor(match.result)}}>{match.result}</span>
                            <span style={styles.statLabel}>Resultado</span>
                        </div>
                        <div style={styles.statItem}>
                            <span style={{...styles.statValue, color: theme.colors.primaryText}}>
                                <span style={{fontSize: '1.5rem'}}>⚽️</span> {match.myGoals}
                            </span>
                            <span style={styles.statLabel}>Goles</span>
                        </div>
                        <div style={styles.statItem}>
                            <span style={{...styles.statValue, color: theme.colors.primaryText}}>
                                <span style={{fontSize: '1.5rem'}}>👟</span> {match.myAssists}
                            </span>
                            <span style={styles.statLabel}>Asistencias</span>
                        </div>
                    </div>

                    {campaignContext && (
                        <div style={styles.campaignBanner}>
                            <div style={styles.campaignTitleContainer}>
                                <PlayerIcon size={20} color={theme.colors.accent1} />
                                <h4 style={styles.campaignTitle}>MODO CARRERA</h4>
                            </div>
                            <p style={styles.campaignName}>{campaignContext.name}</p>
                        </div>
                    )}

                    {hasActiveStreaks && (
                      <div style={styles.section}>
                          <h4 style={styles.sectionTitle}>Rachas actuales</h4>
                          <div style={styles.streaksContainer}>
                              {streaks.resultStreak.count >= 2 && (
                                  <div style={styles.streakItem}>
                                      {streaks.resultStreak.type === 'VICTORIA' && <span>✅</span>}
                                      {streaks.resultStreak.type === 'DERROTA' && <span>❌</span>}
                                      {streaks.resultStreak.type === 'EMPATE' && <span>🤝</span>}
                                      <span><span style={styles.streakValue}>{streaks.resultStreak.count}</span>{streaks.resultStreak.type === 'VICTORIA' ? 'victorias' : (streaks.resultStreak.type === 'EMPATE' ? 'empates' : 'derrotas')}</span>
                                  </div>
                              )}
                              {streaks.goalStreak >= 2 && (
                                  <div style={styles.streakItem}>
                                      <span style={{fontSize: '1rem'}}>⚽️</span>
                                      <span><span style={styles.streakValue}>{streaks.goalStreak}</span> partidos marcando</span>
                                  </div>
                              )}
                              {streaks.assistStreak >= 2 && (
                                  <div style={styles.streakItem}>
                                      <span style={{fontSize: '1rem'}}>👟</span>
                                      <span><span style={styles.streakValue}>{streaks.assistStreak}</span> partidos asistiendo</span>
                                  </div>
                              )}
                          </div>
                      </div>
                    )}

                    <div style={styles.section}>
                        <h4 style={styles.sectionTitle}>Forma reciente (Últimos 10)</h4>
                        <div style={styles.recentFormContainer}>
                            {recentForm.map(m => (
                                <div key={m.id} style={{...styles.formBlock, backgroundColor: getResultColor(m.result)}} title={parseLocalDate(m.date).toLocaleDateString()}>
                                    {resultAbbreviations[m.result]}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
              
              <div style={styles.actions}>
                <button 
                    style={{ ...styles.button, flex: 1, backgroundColor: theme.colors.borderStrong, color: theme.colors.primaryText }} 
                    onClick={onClose}
                >
                    Entendido
                </button>
                <button
                    style={{ ...styles.iconButton, backgroundColor: theme.colors.accent2, color: theme.colors.textOnAccent }}
                    onClick={() => handleAction('download')}
                    disabled={isGeneratingImage}
                    aria-label="Descargar imagen"
                >
                    {isGeneratingImage ? <Loader /> : <DownloadIcon size={20}/>}
                </button>
                <button
                    style={{ ...styles.iconButton, backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent }}
                    onClick={() => handleAction('share')}
                    disabled={isGeneratingImage}
                    aria-label="Compartir imagen"
                >
                    {isGeneratingImage ? <Loader /> : <ShareIcon size={20} />}
                </button>
              </div>
              {error && <div style={{padding: `0 ${theme.spacing.large} ${theme.spacing.small}`}}><p style={styles.errorText}>{error}</p></div>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
  
  return createPortal(modalJSX, document.body);
};

export default PostMatchModal;
