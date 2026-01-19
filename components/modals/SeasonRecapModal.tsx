
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { CloseIcon } from '../icons/CloseIcon';
import { Loader } from '../Loader';
import { ShareIcon } from '../icons/ShareIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { FootballIcon } from '../icons/FootballIcon';
import SegmentedControl from '../common/SegmentedControl';
import { LEAGUES_DATA, calculateProjectedPoints } from '../../utils/simulationData';

// --- DISEÑO ORIGINAL DE LA CARTA (INTACTO) ---
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

    // ESTE ES EL ESTILO ORIGINAL QUE TE GUSTA
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

// --- MODAL PRINCIPAL ---

interface SeasonRecapModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
}

const SeasonRecapModal: React.FC<SeasonRecapModalProps> = ({ isOpen, onClose, data }) => {
    const { theme } = useTheme();
    const { playerProfile } = useData();
    const [activeTab, setActiveTab] = useState<'card' | 'sim'>('card');
    const [selectedLeagueId, setSelectedLeagueId] = useState('laliga');
    const storyRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!isOpen || !data) return null;

    const projectedPoints = calculateProjectedPoints(data.stats.totalMatches, data.stats.totalPoints);
    const selectedLeague = LEAGUES_DATA.find(l => l.id === selectedLeagueId) || LEAGUES_DATA[0];

    const simulationTable = useMemo(() => {
        const table = [...selectedLeague.table];
        // Insert user
        table.push({ pos: 0, team: playerProfile.name || 'Tú', pts: projectedPoints, status: undefined });
        // Sort
        table.sort((a, b) => b.pts - a.pts);
        // Recalculate positions
        return table.map((row, index) => ({ ...row, pos: index + 1 }));
    }, [selectedLeague, projectedPoints, playerProfile.name]);

    const userRank = simulationTable.find(row => row.team === (playerProfile.name || 'Tú'))?.pos || 0;

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

    const styles: { [key: string]: React.CSSProperties } = {
        backdrop: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease'
        },
        modal: {
            backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
            width: '100%', maxWidth: '500px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            border: `1px solid ${theme.colors.border}`,
            overflow: 'hidden'
        },
        header: {
            padding: theme.spacing.medium, borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        },
        title: { margin: 0, fontWeight: 700, color: theme.colors.primaryText },
        content: { padding: theme.spacing.large, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
        
        // Card Tab
        cardPreview: { 
            aspectRatio: '9/16', width: '100%', maxWidth: '300px', margin: '0 auto',
            borderRadius: theme.borderRadius.medium, overflow: 'hidden',
            boxShadow: theme.shadows.large
        },
        actions: { display: 'flex', gap: theme.spacing.medium, justifyContent: 'center' },
        actionBtn: {
            flex: 1, padding: '10px', borderRadius: theme.borderRadius.medium,
            border: 'none', cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
        },

        // Simulator Tab
        simHeader: { textAlign: 'center', marginBottom: theme.spacing.medium },
        leagueSelector: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: theme.spacing.large },
        leagueBtn: {
            background: theme.colors.background, border: `1px solid ${theme.colors.border}`,
            borderRadius: '12px', padding: '8px 12px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            transition: 'all 0.2s', width: '80px'
        },
        activeLeagueBtn: { borderColor: theme.colors.accent2, backgroundColor: `${theme.colors.accent2}10` },
        tableContainer: { 
            border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.medium,
            overflow: 'hidden'
        },
        tableRow: { display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '0.9rem' },
        userRow: { backgroundColor: `${theme.colors.accent1}20`, fontWeight: 700 },
        posCell: { width: '30px', textAlign: 'center', fontWeight: 'bold' },
        teamCell: { flex: 1, paddingLeft: '10px' },
        ptsCell: { width: '40px', textAlign: 'center', fontWeight: 'bold' },
        simResult: {
            textAlign: 'center', padding: '1rem', 
            backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.medium,
            marginBottom: theme.spacing.medium
        }
    };

    return createPortal(
        <div style={styles.backdrop} onClick={onClose}>
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>Cierre de Temporada</h3>
                    <button onClick={onClose} style={{background: 'none', border: 'none', cursor: 'pointer'}}><CloseIcon color={theme.colors.primaryText}/></button>
                </div>
                
                <div style={{padding: `0 ${theme.spacing.large}`}}>
                    <SegmentedControl 
                        options={[{ label: 'La Carta', value: 'card' }, { label: 'Realidad Virtual', value: 'sim' }]}
                        selectedValue={activeTab}
                        onSelect={v => setActiveTab(v as any)}
                    />
                </div>

                <div style={styles.content}>
                    {activeTab === 'card' && (
                        <>
                            <div style={styles.cardPreview}>
                                <div style={{width: '100%', height: '100%'}} ref={storyRef}>
                                    <SeasonWrappedCard data={data} />
                                </div>
                            </div>
                            <div style={styles.actions}>
                                <button style={{...styles.actionBtn, backgroundColor: theme.colors.borderStrong, color: theme.colors.primaryText}} onClick={() => handleAction('download')}>
                                    {isGenerating ? <Loader/> : <DownloadIcon size={18}/>} Descargar
                                </button>
                                <button style={{...styles.actionBtn, backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent}} onClick={() => handleAction('share')}>
                                    {isGenerating ? <Loader/> : <ShareIcon size={18}/>} Compartir
                                </button>
                            </div>
                            {error && <p style={{color: theme.colors.loss, textAlign: 'center', fontSize: '0.8rem'}}>{error}</p>}
                        </>
                    )}

                    {activeTab === 'sim' && (
                        <>
                            <div style={styles.simHeader}>
                                <p style={{margin: 0, color: theme.colors.secondaryText, fontSize: '0.9rem'}}>
                                    Basado en tu ritmo actual ({data.stats.totalPoints} pts en {data.stats.totalMatches} PJ),
                                    así terminarías en una liga profesional tras 38 jornadas.
                                </p>
                            </div>

                            <div style={styles.simResult}>
                                <div style={{fontSize: '0.8rem', color: theme.colors.secondaryText}}>PROYECCIÓN (38 PJ)</div>
                                <div style={{fontSize: '2rem', fontWeight: 900, color: theme.colors.accent2}}>{projectedPoints} PUNTOS</div>
                                <div style={{fontSize: '1rem', fontWeight: 600}}>Puesto #{userRank} en {selectedLeague.name}</div>
                            </div>

                            <div style={styles.leagueSelector}>
                                {LEAGUES_DATA.map(l => (
                                    <div 
                                        key={l.id} 
                                        style={{...styles.leagueBtn, ...(selectedLeagueId === l.id ? styles.activeLeagueBtn : {})}}
                                        onClick={() => setSelectedLeagueId(l.id)}
                                    >
                                        <span style={{fontSize: '1.5rem'}}>{l.logo}</span>
                                        <span style={{fontSize: '0.7rem', fontWeight: 600, color: theme.colors.primaryText}}>{l.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.tableContainer}>
                                <div style={{...styles.tableRow, backgroundColor: theme.colors.background, fontWeight: 700, color: theme.colors.secondaryText, borderBottom: `2px solid ${theme.colors.border}`}}>
                                    <span style={styles.posCell}>#</span>
                                    <span style={styles.teamCell}>Equipo</span>
                                    <span style={styles.ptsCell}>Pts</span>
                                </div>
                                <div style={{maxHeight: '250px', overflowY: 'auto'}}>
                                    {simulationTable.map((row, i) => {
                                        const isMe = row.team === (playerProfile.name || 'Tú');
                                        return (
                                            <div key={i} style={{...styles.tableRow, ...(isMe ? styles.userRow : {})}}>
                                                <span style={{...styles.posCell, color: row.status === 'ucl' ? theme.colors.win : row.status === 'rel' ? theme.colors.loss : 'inherit'}}>{row.pos}</span>
                                                <span style={styles.teamCell}>{row.team}</span>
                                                <span style={styles.ptsCell}>{row.pts}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SeasonRecapModal;
