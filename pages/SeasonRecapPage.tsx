
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { Loader } from '../components/Loader';
import { ShareIcon } from '../components/icons/ShareIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { FootballIcon } from '../components/icons/FootballIcon';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronIcon } from '../components/icons/ChevronIcon';
import SegmentedControl from '../components/common/SegmentedControl';
import { getLeaguesForYear, calculateProjectedPoints } from '../utils/simulationData';
import { InfoIcon } from '../components/icons/InfoIcon';

// --- COMPONENTES VISUALES ---
const StoryFooter: React.FC<{ light?: boolean }> = ({ light }) => {
    const { theme } = useTheme();
    return (
        <footer style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: 0.7, color: light ? '#fff' : theme.colors.primaryText, marginTop: 'auto' }}>
            <FootballIcon size={16} color={light ? '#fff' : undefined} />
            <span style={{fontSize: '0.8rem', fontWeight: 600}}>Plyon</span>
        </footer>
    );
};

const SeasonWrappedCard: React.FC<{ data: any }> = ({ data }) => {
    const { year, archetype, primeMonth, stats } = data;

    const containerStyle: React.CSSProperties = {
        background: 'linear-gradient(180deg, #121212 0%, #1e1e2f 100%)',
        color: '#ffffff',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        width: '100%', 
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box'
    };

    const gradientOrb: React.CSSProperties = {
        position: 'absolute', width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(29,185,84,0.4) 0%, rgba(0,0,0,0) 70%)',
        top: '-100px', right: '-100px', filter: 'blur(40px)', zIndex: 0
    };
    
    const gradientOrb2: React.CSSProperties = {
        position: 'absolute', width: '250px', height: '250px',
        background: 'radial-gradient(circle, rgba(130,87,229,0.4) 0%, rgba(0,0,0,0) 70%)',
        bottom: '-50px', left: '-50px', filter: 'blur(40px)', zIndex: 0
    };

    return (
        <div style={containerStyle}>
            <div style={gradientOrb} />
            <div style={gradientOrb2} />
            <div style={{position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between'}}>
                <div>
                    <div style={{fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, fontWeight: 600, marginBottom: '0.2rem'}}>TU AÑO EN FÚTBOL</div>
                    <div style={{fontSize: '4rem', fontWeight: 900, lineHeight: 0.8, letterSpacing: '-2px', background: 'linear-gradient(90deg, #fff, #ccc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem'}}>{year}</div>
                </div>
                <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, fontWeight: 600, marginBottom: '0.2rem'}}>TU MEJOR VERSIÓN FUE EN</div>
                    <div style={{fontSize: '2.5rem', fontWeight: 800, color: '#1DB954', textShadow: '0 0 20px rgba(29,185,84,0.3)', marginBottom: '1rem'}}>{primeMonth}</div>
                    <div style={{display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px'}}>
                        <div style={{textAlign: 'center'}}><div style={{fontSize: '1.5rem', fontWeight: 700}}>{stats.totalGoals}</div><div style={{fontSize: '0.7rem', opacity: 0.7}}>GOLES</div></div>
                        <div style={{textAlign: 'center'}}><div style={{fontSize: '1.5rem', fontWeight: 700}}>{stats.totalAssists}</div><div style={{fontSize: '0.7rem', opacity: 0.7}}>ASIST</div></div>
                        <div style={{textAlign: 'center'}}><div style={{fontSize: '1.5rem', fontWeight: 700}}>{stats.totalMatches}</div><div style={{fontSize: '0.7rem', opacity: 0.7}}>PARTIDOS</div></div>
                    </div>
                </div>
                <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, fontWeight: 600, marginBottom: '0.2rem'}}>TU ESTILO FUE</div>
                    <div style={{fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem', padding: '0.5rem 1rem', border: '2px solid #fff', display: 'inline-block', borderRadius: '50px'}}>{archetype}</div>
                </div>
                <StoryFooter light={true} />
            </div>
        </div>
    );
};

const SeasonRecapPage: React.FC = () => {
    const { theme } = useTheme();
    const { playerProfile, activeRecapData, setCurrentPage } = useData();
    const [activeTab, setActiveTab] = useState<'card' | 'sim'>('card');
    
    const [selectedLeagueId, setSelectedLeagueId] = useState('laliga');
    const [isLeagueSelectorOpen, setIsLeagueSelectorOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const storyRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirigir si no hay datos (ej. recarga de página)
    if (!activeRecapData) {
        setCurrentPage('stats');
        return null;
    }

    const data = activeRecapData;

    // Lógica del Simulador
    const availableLeagues = getLeaguesForYear(data.year);
    const selectedLeague = availableLeagues.find(l => l.id === selectedLeagueId) || availableLeagues[0];
    const projectedPoints = calculateProjectedPoints(data.stats.totalMatches, data.stats.totalPoints);
    const hasEnoughMatches = data.stats.totalMatches >= 17;

    const simulationTable = useMemo(() => {
        if (!hasEnoughMatches) return [];
        const table = [...selectedLeague.table];
        table.push({ pos: 0, team: playerProfile.name || 'Tú', pts: projectedPoints, status: undefined });
        table.sort((a, b) => b.pts - a.pts);
        return table.map((row, index) => ({ ...row, pos: index + 1 }));
    }, [selectedLeague, projectedPoints, playerProfile.name, hasEnoughMatches]);

    const userRank = simulationTable.find(row => row.team === (playerProfile.name || 'Tú'))?.pos || 0;

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsLeagueSelectorOpen(false);
            }
        };
        if (isLeagueSelectorOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isLeagueSelectorOpen]);

    const handleAction = async (action: 'download' | 'share') => {
        if (!storyRef.current) return;
        setIsGenerating(true);
        setError(null);
        try {
            const dataUrl = await toPng(storyRef.current, { cacheBust: true, pixelRatio: 2 });
            if (action === 'download') {
                const link = document.createElement('a');
                link.download = `plyon-recap-${data.year}.png`;
                link.href = dataUrl;
                link.click();
            } else {
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], `plyon-recap-${data.year}.png`, { type: 'image/png' });
                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: `Resumen ${data.year}` });
                } else {
                    setError('Tu navegador no soporta compartir.');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Error al generar imagen.');
        } finally {
            setIsGenerating(false);
        }
    };

    const getRowStyle = (row: any, isMe: boolean) => {
        const baseStyle: React.CSSProperties = {
            display: 'flex', 
            alignItems: 'center', 
            padding: '12px 16px', 
            borderBottom: `1px solid ${theme.colors.border}`, 
            fontSize: '0.95rem',
            transition: 'background-color 0.2s',
            borderLeft: '4px solid transparent' // Placeholder for status color
        };

        if (isMe) {
            baseStyle.backgroundColor = `${theme.colors.accent2}20`; // More visible user highlight
            baseStyle.fontWeight = 700;
            baseStyle.borderLeft = `4px solid ${theme.colors.accent2}`;
        } else if (row.pos === 1) { // Champion
            baseStyle.backgroundColor = `rgba(255, 215, 0, 0.1)`; // Gold Tint
            baseStyle.borderLeft = `4px solid #FFD700`;
        } else if (row.status === 'ucl') {
            baseStyle.backgroundColor = `${theme.colors.win}15`; // Green/Blue Tint
            baseStyle.borderLeft = `4px solid ${theme.colors.win}`;
        } else if (row.status === 'uel') {
            baseStyle.backgroundColor = `rgba(255, 165, 0, 0.1)`; // Orange Tint
            baseStyle.borderLeft = `4px solid orange`;
        } else if (row.status === 'rel') {
            baseStyle.backgroundColor = `${theme.colors.loss}15`; // Red Tint
            baseStyle.borderLeft = `4px solid ${theme.colors.loss}`;
        }

        return baseStyle;
    };

    const styles: { [key: string]: React.CSSProperties } = {
        container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
        header: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium, marginBottom: theme.spacing.large },
        backButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: theme.colors.primaryText },
        pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0 },
        
        contentWrapper: { 
            display: 'flex', flexDirection: 'column', gap: theme.spacing.extraLarge, alignItems: 'center' 
        },
        tabContainer: { width: '100%', maxWidth: '400px' },
        
        // Card Tab
        cardContainer: {
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.medium, width: '100%'
        },
        cardPreview: { 
            aspectRatio: '9/16', width: '100%', maxWidth: '350px',
            borderRadius: theme.borderRadius.large, overflow: 'hidden',
            boxShadow: theme.shadows.large,
            border: `1px solid ${theme.colors.border}`
        },
        actions: { display: 'flex', gap: theme.spacing.medium, justifyContent: 'center', marginTop: theme.spacing.medium },
        actionBtn: {
            padding: '12px 24px', borderRadius: theme.borderRadius.medium,
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'transform 0.1s'
        },

        // Simulator Tab
        simContainer: { width: '100%', maxWidth: '600px', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, padding: theme.spacing.large, border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows.medium },
        simHeader: { textAlign: 'center', marginBottom: theme.spacing.large },
        simResult: {
            textAlign: 'center', padding: '1.5rem', 
            backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.medium,
            marginBottom: theme.spacing.large,
            border: `1px solid ${theme.colors.borderStrong}`
        },
        
        // Custom Dropdown Styles
        leagueDropdownContainer: { position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto 20px auto', zIndex: 10 },
        dropdownTrigger: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '12px 16px',
            backgroundColor: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.medium,
            cursor: 'pointer',
            color: theme.colors.primaryText,
            fontSize: '0.95rem',
            fontWeight: 600,
        },
        dropdownMenu: {
            position: 'absolute', top: '100%', left: 0, right: 0,
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.medium,
            boxShadow: theme.shadows.medium,
            marginTop: '8px',
            zIndex: 100,
            overflow: 'hidden'
        },
        dropdownItem: {
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 16px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            borderBottom: `1px solid ${theme.colors.border}`,
            color: theme.colors.primaryText,
            fontSize: '0.9rem'
        },
        activeDropdownItem: {
            backgroundColor: `${theme.colors.accent2}15`,
            color: theme.colors.accent2
        },
        leagueLogo: { width: '24px', height: '24px', objectFit: 'contain' as 'contain' },

        tableContainer: { 
            border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.medium,
            overflow: 'hidden',
            backgroundColor: theme.colors.background
        },
        posCell: { width: '40px', textAlign: 'center', fontWeight: 'bold' },
        teamCell: { flex: 1, paddingLeft: '12px', whiteSpace: 'nowrap' as 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
        ptsCell: { width: '50px', textAlign: 'center', fontWeight: 'bold' },
        
        emptyStateContainer: {
            textAlign: 'center', padding: '3rem 1rem',
            color: theme.colors.secondaryText
        },
        emptyStateIcon: {
            marginBottom: '1rem',
            opacity: 0.5
        }
    };

    return (
        <main style={styles.container}>
            <div style={styles.header}>
                <button onClick={() => setCurrentPage('stats')} style={styles.backButton}>
                    <ChevronLeftIcon size={24} />
                </button>
                <h2 style={styles.pageTitle}>Cierre de Temporada {data.year}</h2>
            </div>

            <div style={styles.contentWrapper}>
                <div style={styles.tabContainer}>
                    <SegmentedControl 
                        options={[{ label: 'La Carta', value: 'card' }, { label: 'Realidad Virtual', value: 'sim' }]}
                        selectedValue={activeTab}
                        onSelect={v => setActiveTab(v as any)}
                    />
                </div>

                {activeTab === 'card' && (
                    <div style={styles.cardContainer}>
                        <div style={styles.cardPreview}>
                            <div style={{width: '100%', height: '100%'}} ref={storyRef}>
                                <SeasonWrappedCard data={data} />
                            </div>
                        </div>
                        <div style={styles.actions}>
                            <button style={{...styles.actionBtn, backgroundColor: theme.colors.borderStrong, color: theme.colors.primaryText}} onClick={() => handleAction('download')}>
                                {isGenerating ? <Loader/> : <DownloadIcon size={20}/>} Descargar
                            </button>
                            <button style={{...styles.actionBtn, backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent}} onClick={() => handleAction('share')}>
                                {isGenerating ? <Loader/> : <ShareIcon size={20}/>} Compartir
                            </button>
                        </div>
                        {error && <p style={{color: theme.colors.loss, textAlign: 'center', fontSize: '0.9rem'}}>{error}</p>}
                    </div>
                )}

                {activeTab === 'sim' && (
                    <div style={styles.simContainer}>
                        {hasEnoughMatches ? (
                            <>
                                <div style={styles.simHeader}>
                                    <h3 style={{margin: `0 0 ${theme.spacing.small} 0`, fontSize: '1.2rem', color: theme.colors.primaryText}}>Simulador de Contexto</h3>
                                    <p style={{margin: 0, color: theme.colors.secondaryText, fontSize: '0.95rem', lineHeight: 1.5}}>
                                        Si jugaras profesionalmente con tu ritmo actual ({data.stats.totalPoints} pts en {data.stats.totalMatches} PJ),
                                        así terminarías tras 38 jornadas. (Datos históricos de {data.year - 1}/{data.year})
                                    </p>
                                </div>

                                <div style={styles.simResult}>
                                    <div style={{fontSize: '0.85rem', color: theme.colors.secondaryText, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px'}}>PROYECCIÓN FINAL</div>
                                    <div style={{fontSize: '3rem', fontWeight: 900, color: theme.colors.accent2, lineHeight: 1}}>{projectedPoints} PTS</div>
                                    <div style={{fontSize: '1.1rem', fontWeight: 600, marginTop: '8px', color: theme.colors.primaryText}}>Puesto #{userRank} en {selectedLeague.name}</div>
                                </div>

                                {/* Custom Dropdown for League Selection */}
                                <div style={styles.leagueDropdownContainer} ref={dropdownRef}>
                                    <div 
                                        style={styles.dropdownTrigger} 
                                        onClick={() => setIsLeagueSelectorOpen(!isLeagueSelectorOpen)}
                                    >
                                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                            <img src={selectedLeague.logo} alt={selectedLeague.name} style={styles.leagueLogo} />
                                            <span>{selectedLeague.name} ({selectedLeague.countryCode})</span>
                                        </div>
                                        <ChevronIcon isExpanded={isLeagueSelectorOpen} size={20} />
                                    </div>
                                    
                                    {isLeagueSelectorOpen && (
                                        <div style={styles.dropdownMenu}>
                                            {availableLeagues.map(l => (
                                                <div 
                                                    key={l.id} 
                                                    style={{
                                                        ...styles.dropdownItem,
                                                        ...(selectedLeagueId === l.id ? styles.activeDropdownItem : {})
                                                    }}
                                                    onClick={() => {
                                                        setSelectedLeagueId(l.id);
                                                        setIsLeagueSelectorOpen(false);
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.border}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedLeagueId === l.id ? `${theme.colors.accent2}15` : 'transparent'}
                                                >
                                                    <img src={l.logo} alt={l.name} style={styles.leagueLogo} />
                                                    <span>{l.name} ({l.countryCode})</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={styles.tableContainer}>
                                    <div style={{display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `2px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface, fontWeight: 700, color: theme.colors.secondaryText, fontSize: '0.95rem'}}>
                                        <span style={styles.posCell}>#</span>
                                        <span style={styles.teamCell}>Equipo</span>
                                        <span style={styles.ptsCell}>Pts</span>
                                    </div>
                                    <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                                        {simulationTable.map((row, i) => {
                                            const isMe = row.team === (playerProfile.name || 'Tú');
                                            const rowStyle = getRowStyle(row, isMe);
                                            // Check if champion (position 1)
                                            const isChampion = row.pos === 1;

                                            return (
                                                <div key={i} style={rowStyle}>
                                                    <span style={styles.posCell}>{row.pos}</span>
                                                    <span style={styles.teamCell}>
                                                        {row.team} {isMe && '(Tú)'} {isChampion && <span title="Campeón" style={{marginLeft: '4px'}}>👑</span>}
                                                    </span>
                                                    <span style={styles.ptsCell}>{row.pts}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                
                                <div style={{display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '15px', fontSize: '0.75rem', color: theme.colors.secondaryText}}>
                                    <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><span style={{width: 8, height: 8, background: '#FFD700', borderRadius: '50%'}}></span> Campeón</span>
                                    <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><span style={{width: 8, height: 8, background: theme.colors.win, borderRadius: '50%'}}></span> Champions</span>
                                    <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><span style={{width: 8, height: 8, background: 'orange', borderRadius: '50%'}}></span> Europa</span>
                                    <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><span style={{width: 8, height: 8, background: theme.colors.loss, borderRadius: '50%'}}></span> Descenso</span>
                                </div>
                            </>
                        ) : (
                            <div style={styles.emptyStateContainer}>
                                <div style={styles.emptyStateIcon}>
                                    <InfoIcon size={48} />
                                </div>
                                <h3 style={{margin: '0 0 10px 0', color: theme.colors.primaryText}}>Datos Insuficientes</h3>
                                <p style={{margin: 0, lineHeight: 1.5}}>
                                    Necesitas jugar al menos <strong>17 partidos</strong> (media temporada) para que el simulador pueda proyectar tu rendimiento en una liga profesional con precisión.
                                </p>
                                <p style={{fontSize: '0.85rem', marginTop: '1rem', fontStyle: 'italic'}}>
                                    Actualmente tienes {data.stats.totalMatches} partidos registrados en {data.year}.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
};

export default SeasonRecapPage;
