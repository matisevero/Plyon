import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { generateMatchHeadline } from '../../services/geminiService';
import { CloseIcon } from '../icons/CloseIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { Loader } from '../Loader';
import { FootballIcon } from '../icons/FootballIcon';
import { ShareIcon } from '../icons/ShareIcon';
import { parseLocalDate } from '../../utils/analytics';
import type { ShareableMoment } from '../../pages/SocialPage';
import type { Match, PlayerMorale } from '../../types';

// Base component for consistent story styling
const StoryCardBase: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { theme } = useTheme();
    const style: React.CSSProperties = {
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        padding: '1.5rem', 
        color: theme.colors.primaryText, 
        fontFamily: theme.typography.fontFamily,
        background: theme.colors.backgroundGradient,
    };
    return <div style={style}>{children}</div>;
};

// Footer for all cards
const StoryFooter: React.FC = () => {
    const { theme } = useTheme();
    const style: React.CSSProperties = { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '0.5rem', 
        opacity: 0.7 
    };
    return (
        <footer style={style}>
            <FootballIcon size={16} />
            <span style={{fontSize: '0.8rem'}}>FútbolStats</span>
        </footer>
    );
};

// --- Story Card Variants ---

const MatchStoryCard: React.FC<{ moment: ShareableMoment }> = ({ moment }) => {
    const { theme } = useTheme();
    const { addAIInteraction } = useData();
    const match = moment.data as Match;
    const [headline, setHeadline] = useState(moment.title);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const defaultHeadlines = { VICTORIA: "¡Noche de Gloria!", EMPATE: "Punto a Punto", DERROTA: "A Seguir Luchando" };
        setHeadline(defaultHeadlines[match.result]);
    }, [match]);
    
    const handleGenerateHeadline = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsGenerating(true);
        try {
            const generatedHeadline = await generateMatchHeadline(match);
            setHeadline(generatedHeadline);
            addAIInteraction('match_headline', { matchId: match.id, headline: generatedHeadline });
        } catch (err) {
            // Handle error silently or show a small toast
        } finally {
            setIsGenerating(false);
        }
    };

    const resultColors = {
        VICTORIA: { bg: theme.colors.win, text: theme.colors.textOnAccent },
        DERROTA: { bg: theme.colors.loss, text: theme.colors.textOnAccent },
        EMPATE: { bg: theme.colors.draw, text: theme.colors.textOnAccent }
    };

    return (
        <StoryCardBase>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontWeight: 700, fontSize: '0.8rem', backgroundColor: resultColors[match.result].bg, color: resultColors[match.result].text }}>{match.result}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: theme.colors.secondaryText }}>{parseLocalDate(match.date).toLocaleDateString()}</span>
            </header>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>{headline}</h2>
                <button onClick={handleGenerateHeadline} disabled={isGenerating} style={{ background: 'none', border: 'none', color: theme.colors.accent2, cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0.5rem auto 0' }}>
                    {isGenerating ? <Loader/> : <SparklesIcon size={16} />} <span style={{fontSize: '0.8rem'}}>Sugerir titular</span>
                </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}><span style={{ fontSize: '2rem', fontWeight: 700, display: 'block' }}>{match.myGoals}</span><span style={{ fontSize: '0.9rem', color: theme.colors.secondaryText }}>Goles</span></div>
                <div style={{ textAlign: 'center' }}><span style={{ fontSize: '2rem', fontWeight: 700, display: 'block' }}>{match.myAssists}</span><span style={{ fontSize: '0.9rem', color: theme.colors.secondaryText }}>Asist.</span></div>
            </div>
            <StoryFooter />
        </StoryCardBase>
    );
};

const RecentFormStoryCard: React.FC<{ moment: ShareableMoment }> = ({ moment }) => {
    const { theme } = useTheme();
    const results = moment.data as ('VICTORIA' | 'DERROTA' | 'EMPATE')[];
    const resultStyles: Record<string, React.CSSProperties> = {
        VICTORIA: { backgroundColor: theme.colors.win },
        DERROTA: { backgroundColor: theme.colors.loss },
        EMPATE: { backgroundColor: theme.colors.draw },
    };
    return (
        <StoryCardBase>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', margin: 'auto 0' }}>Forma Reciente</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {results.map((result, index) => (
                    <div key={index} style={{ width: '40px', height: '50px', borderRadius: theme.borderRadius.small, ...resultStyles[result] }} title={result} />
                ))}
            </div>
            <StoryFooter />
        </StoryCardBase>
    );
};

const MonthlySummaryStoryCard: React.FC<{ moment: ShareableMoment }> = ({ moment }) => {
    const { theme } = useTheme();
    const summary = moment.data;
    return (
        <StoryCardBase>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, textAlign: 'center', marginTop: '1rem' }}>Resumen de {summary.monthName}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', textAlign: 'center', padding: '0 1rem' }}>
                <div><span style={{ fontSize: '2rem', fontWeight: 700, display: 'block' }}>{summary.matches}</span><span style={{ fontSize: '0.9rem', color: theme.colors.secondaryText }}>Partidos</span></div>
                <div><span style={{ fontSize: '2rem', fontWeight: 700, display: 'block' }}>{`${summary.wins}-${summary.draws}-${summary.losses}`}</span><span style={{ fontSize: '0.9rem', color: theme.colors.secondaryText }}>Récord (V-E-D)</span></div>
                <div><span style={{ fontSize: '2rem', fontWeight: 700, display: 'block' }}>{summary.goals}</span><span style={{ fontSize: '0.9rem', color: theme.colors.secondaryText }}>Goles</span></div>
                <div><span style={{ fontSize: '2rem', fontWeight: 700, display: 'block' }}>{summary.assists}</span><span style={{ fontSize: '0.9rem', color: theme.colors.secondaryText }}>Asistencias</span></div>
            </div>
            <StoryFooter />
        </StoryCardBase>
    );
};

const MoraleStoryCard: React.FC<{ moment: ShareableMoment }> = ({ moment }) => {
    const { theme } = useTheme();
    const morale = moment.data as PlayerMorale;
    return (
        <StoryCardBase>
            <div style={{ textAlign: 'center', margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0 }}>{morale.level}</h2>
                <p style={{ fontSize: '1rem', color: theme.colors.secondaryText, fontStyle: 'italic', margin: '0 auto', maxWidth: '80%' }}>"{morale.description}"</p>
                <div style={{ height: '8px', background: `linear-gradient(to right, ${theme.colors.loss}, ${theme.colors.draw}, ${theme.colors.win})`, borderRadius: '4px', position: 'relative', width: '80%', margin: '0 auto' }}>
                    <div style={{ position: 'absolute', top: '-4px', left: `${morale.score}%`, width: '16px', height: '16px', backgroundColor: theme.colors.surface, border: `2px solid ${theme.colors.primaryText}`, borderRadius: '50%', transform: 'translateX(-50%)' }}/>
                </div>
            </div>
            <StoryFooter />
        </StoryCardBase>
    );
};

// ... Add more card types if needed in future

interface ShareMomentModalProps {
  moment: ShareableMoment;
  onClose: () => void;
}

const ShareMomentModal: React.FC<ShareMomentModalProps> = ({ moment, onClose }) => {
    const { theme } = useTheme();
    const storyRef = useRef<HTMLDivElement>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const handleAction = async (action: 'download' | 'share') => {
        if (!storyRef.current) return;
        setIsGeneratingImage(true);
        setError(null);
        try {
            const dataUrl = await toPng(storyRef.current, { cacheBust: true, pixelRatio: 2 });
            if (action === 'download') {
                const link = document.createElement('a');
                link.download = `futbolstats-${moment.type}-${moment.date}.png`;
                link.href = dataUrl;
                link.click();
            } else { // share
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], `futbolstats-${moment.type}-${moment.date}.png`, { type: 'image/png' });
                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Informe de FútbolStats' });
                } else {
                    setError('La API para compartir no está disponible en este navegador.');
                }
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              setError('Error al generar la imagen.');
            }
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const renderCardContent = () => {
        switch (moment.type) {
          case 'last_match':
          case 'match':
          case 'match_mvp':
            return <MatchStoryCard moment={moment} />;
          case 'recent_form':
            return <RecentFormStoryCard moment={moment} />;
          case 'monthly_summary':
            return <MonthlySummaryStoryCard moment={moment} />;
          case 'morale':
            return <MoraleStoryCard moment={moment} />;
          // Yearly and Achievement cards would go here
          default:
            return <StoryCardBase><div><h2 style={{textAlign: 'center', margin: 'auto'}}>{moment.title}</h2><p style={{textAlign: 'center'}}>Próximamente...</p><StoryFooter/></div></StoryCardBase>;
        }
    };
    
    const styles: { [key: string]: React.CSSProperties } = {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.medium, animation: 'fadeIn 0.3s' },
        modal: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, width: '100%', maxWidth: '400px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s', border: `1px solid ${theme.colors.border}` },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderBottom: `1px solid ${theme.colors.border}` },
        title: { margin: 0, fontSize: '1.1rem', fontWeight: 600, color: theme.colors.primaryText },
        content: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large, padding: theme.spacing.large, overflowY: 'auto' },
        storyPreview: { aspectRatio: '9 / 16', width: '100%', borderRadius: theme.borderRadius.medium, overflow: 'hidden', boxShadow: theme.shadows.large },
        actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium, marginTop: theme.spacing.medium },
        actionButton: { padding: '0.875rem 1.25rem', border: 'none', borderRadius: theme.borderRadius.medium, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.small },
        downloadButton: { backgroundColor: theme.colors.borderStrong, color: theme.colors.primaryText },
        shareButton: { backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent },
        error: { color: theme.colors.loss, fontSize: '0.8rem', textAlign: 'center', margin: 0 },
    };

    const modalJSX = (
        <>
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
            <div style={styles.backdrop} onClick={onClose}>
                <div style={styles.modal} onClick={e => e.stopPropagation()}>
                    <header style={styles.header}>
                        <h3 style={styles.title}>{moment.title}</h3>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose} aria-label="Cerrar"><CloseIcon color={theme.colors.primaryText} /></button>
                    </header>
                    <div style={styles.content}>
                        <div style={styles.storyPreview}>
                            <div ref={storyRef}>{renderCardContent()}</div>
                        </div>
                        <div style={styles.actions}>
                            <button onClick={() => handleAction('download')} disabled={isGeneratingImage} style={styles.downloadButton}>{isGeneratingImage ? <Loader /> : 'Descargar'}</button>
                            <button onClick={() => handleAction('share')} disabled={isGeneratingImage} style={styles.shareButton}><ShareIcon /> {isGeneratingImage ? '' : 'Compartir'}</button>
                        </div>
                        {error && <p style={styles.error}>{error}</p>}
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(modalJSX, document.body);
};

export default ShareMomentModal;