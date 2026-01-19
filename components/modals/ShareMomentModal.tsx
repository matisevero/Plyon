
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
import { DownloadIcon } from '../icons/DownloadIcon';
import { parseLocalDate, calculateSeasonRating } from '../../utils/analytics';
import type { ShareableMoment } from '../../pages/SocialPage';
import type { Match, PlayerMorale } from '../../types';

// Base component for consistent story styling
const StoryCardBase: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
    const { theme } = useTheme();
    const baseStyle: React.CSSProperties = {
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        padding: '1.5rem', 
        color: theme.colors.primaryText, 
        fontFamily: theme.typography.fontFamily,
        background: theme.colors.backgroundGradient,
        ...style
    };
    return <div style={baseStyle}>{children}</div>;
};

// Footer for all cards
const StoryFooter: React.FC<{ light?: boolean }> = ({ light }) => {
    const { theme } = useTheme();
    const style: React.CSSProperties = { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '0.5rem', 
        opacity: 0.7,
        color: light ? '#fff' : theme.colors.primaryText
    };
    return (
        <footer style={style}>
            <FootballIcon size={16} color={light ? '#fff' : undefined} />
            <span style={{fontSize: '0.8rem', fontWeight: 600}}>Plyon</span>
        </footer>
    );
};

// --- Story Card Variants ---

const PlyrCardStory: React.FC<{ moment: ShareableMoment }> = ({ moment }) => {
    const { theme } = useTheme();
    const { name, photo, ovr, stats } = moment.data;
    
    // Ultimate Team Card Style
    const cardStyle: React.CSSProperties = {
        background: 'linear-gradient(135deg, #d4af37 0%, #f9e587 25%, #d4af37 50%, #aa8524 100%)', // Gold gradient
        borderRadius: '20px',
        padding: '20px',
        color: '#1a1a1a',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
        border: '4px solid #f9e587',
        height: '100%',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
    };

    const photoStyle: React.CSSProperties = {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '4px solid #fff',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
        marginBottom: '10px',
        backgroundColor: '#fff'
    };

    const statsGrid: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px 30px',
        width: '100%',
        marginTop: '15px'
    };

    const statItem: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '1.1rem',
        fontWeight: 700
    };

    return (
        <StoryCardBase>
            <div style={cardStyle}>
                {/* Gloss effect */}
                <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)', pointerEvents: 'none'}} />
                
                <div style={{display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1}}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <span style={{fontSize: '2.5rem', fontWeight: 900, lineHeight: 1}}>{ovr}</span>
                        <span style={{fontSize: '1rem', fontWeight: 700}}>OVR</span>
                    </div>
                    <img src={photo || `https://ui-avatars.com/api/?name=${name}&background=random`} alt={name} style={photoStyle} />
                </div>

                <div style={{textAlign: 'center', width: '100%', zIndex: 1}}>
                    <h2 style={{fontSize: '1.8rem', fontWeight: 900, margin: '5px 0', textTransform: 'uppercase', letterSpacing: '-1px'}}>{name}</h2>
                    <div style={{width: '100%', height: '2px', backgroundColor: '#aa8524', margin: '10px 0'}} />
                    
                    <div style={statsGrid}>
                        <div style={statItem}><span>{stats.PJ}</span> <span style={{fontWeight: 400}}>PJ</span></div>
                        <div style={statItem}><span>{stats.G}</span> <span style={{fontWeight: 400}}>G</span></div>
                        <div style={statItem}><span>{stats.A}</span> <span style={{fontWeight: 400}}>A</span></div>
                        <div style={statItem}><span>{stats.V}%</span> <span style={{fontWeight: 400}}>VIC</span></div>
                        <div style={statItem}><span>{stats.Nvl}</span> <span style={{fontWeight: 400}}>NVL</span></div>
                        <div style={statItem}><span>{stats.Pts}</span> <span style={{fontWeight: 400}}>PTS</span></div>
                    </div>
                </div>
                
                <div style={{marginTop: 'auto', paddingTop: '10px', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600}}>PLYON PLYR</div>
            </div>
        </StoryCardBase>
    );
};

const MatchStoryCard: React.FC<{ moment: ShareableMoment }> = ({ moment }) => {
    const { theme } = useTheme();
    const { addAIInteraction, checkAILimit } = useData();
    const match = moment.data as Match;
    const [headline, setHeadline] = useState(moment.title);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const defaultHeadlines = { VICTORIA: "¡Noche de Gloria!", EMPATE: "Punto a Punto", DERROTA: "A Seguir Luchando" };
        setHeadline(defaultHeadlines[match.result]);
    }, [match]);
    
    const handleGenerateHeadline = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        try {
            checkAILimit();
        } catch (e: any) {
            alert(e.message);
            return;
        }

        setIsGenerating(true);
        try {
            const generatedHeadline = await generateMatchHeadline(match);
            setHeadline(generatedHeadline);
            await addAIInteraction('match_headline', { matchId: match.id, headline: generatedHeadline });
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

const YearlySummaryStoryCard: React.FC<{ moment: ShareableMoment }> = ({ moment }) => {
    const { theme } = useTheme();
    const data = moment.data;
    const { year, totalMatches, wins, draws, losses, goals, assists, matches } = data;

    // Use the matches to calculate the Season Rating
    const seasonRating = calculateSeasonRating(matches || []);

    const styles: { [key: string]: React.CSSProperties } = {
        grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center', marginTop: '1rem' },
        statBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
        bigNumber: { fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 },
        label: { fontSize: '0.75rem', color: theme.colors.secondaryText, textTransform: 'uppercase' },
        ratingContainer: { 
            marginTop: '1.5rem', 
            padding: '1rem',
            backgroundColor: `${theme.colors.accent2}10`,
            border: `1px solid ${theme.colors.accent2}40`,
            borderRadius: theme.borderRadius.medium,
            textAlign: 'center'
        },
        ratingTitle: { margin: 0, fontSize: '0.9rem', color: theme.colors.accent2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
        ratingValue: { fontSize: '1.8rem', fontWeight: 900, color: theme.colors.primaryText, margin: '5px 0' },
        badgeContainer: {
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1rem',
        },
        yearBadge: {
            backgroundColor: theme.colors.primaryText,
            color: theme.colors.surface,
            padding: '4px 12px',
            borderRadius: '20px',
            fontWeight: 800,
            fontSize: '1rem'
        }
    };

    return (
        <StoryCardBase>
            <div style={{ textAlign: 'center' }}>
                <div style={styles.badgeContainer}>
                    <span style={styles.yearBadge}>{year}</span>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, color: theme.colors.primaryText, lineHeight: 1 }}>RESUMEN</h2>
            </div>

            <div style={styles.grid}>
                <div style={styles.statBlock}><span style={styles.bigNumber}>{totalMatches}</span><span style={styles.label}>PJ</span></div>
                <div style={styles.statBlock}><span style={styles.bigNumber}>{`${wins}-${draws}-${losses}`}</span><span style={styles.label}>Récord</span></div>
                <div style={styles.statBlock}><span style={{...styles.bigNumber, color: theme.colors.accent1}}>{goals}</span><span style={styles.label}>Goles</span></div>
                <div style={styles.statBlock}><span style={{...styles.bigNumber, color: theme.colors.accent2}}>{assists}</span><span style={styles.label}>Asist.</span></div>
            </div>

            <div style={styles.ratingContainer}>
                <h4 style={styles.ratingTitle}>Nivel de Temporada</h4>
                <div style={styles.ratingValue}>{seasonRating.tierName}</div>
            </div>
            
            <StoryFooter />
        </StoryCardBase>
    );
};

const SeasonWrappedCard: React.FC<{ moment: ShareableMoment }> = ({ moment }) => {
    const { year, archetype, primeMonth, stats } = moment.data;

    // Spotify Wrapped / Apple Music Replay Vibe
    // Dark, vibrant gradients, bold typography.
    const containerStyle: React.CSSProperties = {
        background: 'linear-gradient(180deg, #121212 0%, #1e1e2f 100%)',
        color: '#ffffff',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden'
    };

    const gradientOrb: React.CSSProperties = {
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(29,185,84,0.4) 0%, rgba(0,0,0,0) 70%)', // Spotify Green-ish
        top: '-100px',
        right: '-100px',
        filter: 'blur(40px)',
        zIndex: 0
    };
    
    const gradientOrb2: React.CSSProperties = {
        position: 'absolute',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(130,87,229,0.4) 0%, rgba(0,0,0,0) 70%)', // Purple
        bottom: '-50px',
        left: '-50px',
        filter: 'blur(40px)',
        zIndex: 0
    };

    const contentStyle: React.CSSProperties = {
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between'
    };

    const bigYear: React.CSSProperties = {
        fontSize: '4rem',
        fontWeight: 900,
        lineHeight: 0.8,
        letterSpacing: '-2px',
        background: 'linear-gradient(90deg, #fff, #ccc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.5rem'
    };

    const label: React.CSSProperties = {
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        opacity: 0.7,
        fontWeight: 600,
        marginBottom: '0.2rem'
    };

    const primeMonthText: React.CSSProperties = {
        fontSize: '2.5rem',
        fontWeight: 800,
        color: '#1DB954', // Green pop
        textShadow: '0 0 20px rgba(29,185,84,0.3)',
        marginBottom: '1rem'
    };

    const archetypeText: React.CSSProperties = {
        fontSize: '1.8rem',
        fontWeight: 900,
        color: '#fff',
        marginBottom: '0.5rem',
        padding: '0.5rem 1rem',
        border: '2px solid #fff',
        display: 'inline-block',
        borderRadius: '50px'
    };

    return (
        <div style={containerStyle}>
            <div style={gradientOrb} />
            <div style={gradientOrb2} />
            
            <div style={contentStyle}>
                <div>
                    <div style={label}>TU AÑO EN FÚTBOL</div>
                    <div style={bigYear}>{year}</div>
                </div>

                <div style={{textAlign: 'center'}}>
                    <div style={label}>TU MEJOR VERSIÓN FUE EN</div>
                    <div style={primeMonthText}>{primeMonth}</div>
                    
                    <div style={{display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px'}}>
                        <div style={{textAlign: 'center'}}>
                            <div style={{fontSize: '1.5rem', fontWeight: 700}}>{stats.totalGoals}</div>
                            <div style={{fontSize: '0.7rem', opacity: 0.7}}>GOLES</div>
                        </div>
                        <div style={{textAlign: 'center'}}>
                            <div style={{fontSize: '1.5rem', fontWeight: 700}}>{stats.totalAssists}</div>
                            <div style={{fontSize: '0.7rem', opacity: 0.7}}>ASIST</div>
                        </div>
                        <div style={{textAlign: 'center'}}>
                            <div style={{fontSize: '1.5rem', fontWeight: 700}}>{stats.totalMatches}</div>
                            <div style={{fontSize: '0.7rem', opacity: 0.7}}>PARTIDOS</div>
                        </div>
                    </div>
                </div>

                <div style={{textAlign: 'center'}}>
                    <div style={label}>TU ESTILO FUE</div>
                    <div style={archetypeText}>{archetype}</div>
                </div>

                <StoryFooter light={true} />
            </div>
        </div>
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
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);

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
                link.download = `plyon-${moment.type}-${moment.date}.png`;
                link.href = dataUrl;
                link.click();
            } else { // share
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], `plyon-${moment.type}-${moment.date}.png`, { type: 'image/png' });
                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Informe de Plyon' });
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
          case 'yearly_summary':
            return <YearlySummaryStoryCard moment={moment} />;
          case 'plyr_card':
            return <PlyrCardStory moment={moment} />;
          case 'season_recap':
            return <SeasonWrappedCard moment={moment} />;
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
        actions: { 
            display: 'flex', 
            gap: theme.spacing.medium, 
            marginTop: theme.spacing.medium,
            justifyContent: 'center'
        },
        actionButton: { 
            flex: 1,
            padding: '12px 20px', 
            border: 'none', 
            borderRadius: theme.borderRadius.medium, 
            fontSize: '1rem', 
            fontWeight: 700, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: theme.shadows.small
        },
        downloadButton: { 
            backgroundColor: theme.colors.surface, 
            color: theme.colors.primaryText,
            border: `1px solid ${theme.colors.borderStrong}`,
        },
        shareButton: { 
            background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`, 
            color: theme.colors.textOnAccent,
        },
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
                            <button 
                                onClick={() => handleAction('download')} 
                                disabled={isGeneratingImage} 
                                style={{
                                    ...styles.actionButton, 
                                    ...styles.downloadButton,
                                    backgroundColor: hoveredButton === 'download' ? theme.colors.border : theme.colors.surface,
                                    transform: hoveredButton === 'download' ? 'translateY(-2px)' : 'none'
                                }}
                                onMouseEnter={() => setHoveredButton('download')}
                                onMouseLeave={() => setHoveredButton(null)}
                            >
                                {isGeneratingImage ? <Loader /> : <DownloadIcon size={20} />} 
                                <span>Guardar</span>
                            </button>
                            <button 
                                onClick={() => handleAction('share')} 
                                disabled={isGeneratingImage} 
                                style={{
                                    ...styles.actionButton, 
                                    ...styles.shareButton,
                                    filter: hoveredButton === 'share' ? 'brightness(1.1)' : 'none',
                                    transform: hoveredButton === 'share' ? 'translateY(-2px)' : 'none',
                                    boxShadow: hoveredButton === 'share' ? theme.shadows.medium : theme.shadows.small
                                }}
                                onMouseEnter={() => setHoveredButton('share')}
                                onMouseLeave={() => setHoveredButton(null)}
                            >
                                <ShareIcon size={20} /> 
                                <span>{isGeneratingImage ? 'Procesando...' : 'Compartir'}</span>
                            </button>
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
