
import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import QualifiersTable from './QualifiersTable';
import MatchList from '../../components/MatchList';
import Card from '../../components/common/Card';
import { ChevronIcon } from '../../components/icons/ChevronIcon';
import { StarIcon } from '../../components/icons/StarIcon';
import { generateQualifiersStandings, CONFEDERATIONS, parseLocalDate } from '../../utils/analytics';
import Confetti from '../../components/effects/Confetti';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { ClipboardIcon } from '../../components/icons/ClipboardIcon';

const QualificationResultView: React.FC<{ onBackToSelection: () => void }> = ({ onBackToSelection }) => {
    const { theme } = useTheme();
    const { playerProfile, startWorldCupFromQualification, updatePlayerProfile, matches } = useData();
    const { qualifiersProgress } = playerProfile;

    if (!qualifiersProgress || qualifiersProgress.status !== 'completed') {
        return null;
    }
    
    const startDate = parseLocalDate(qualifiersProgress.startDate || new Date().toISOString());
    const campaignMatches = useMemo(() => {
        return matches.filter(m => parseLocalDate(m.date).getTime() >= startDate.getTime());
    }, [matches, startDate]);
    
    const conf = CONFEDERATIONS[qualifiersProgress.confederation];
    const finalStandings = useMemo(() => generateQualifiersStandings(qualifiersProgress, playerProfile.name, campaignMatches), [qualifiersProgress, playerProfile.name, campaignMatches]);
    const finalPosition = finalStandings.find(t => t.name === playerProfile.name)?.position || 0;
    const didQualify = finalPosition <= conf.slots;

    const handlePlayWorldCup = async () => {
        await startWorldCupFromQualification();
    };
    
    const handleResetQualifiers = async () => {
        await updatePlayerProfile({ qualifiersProgress: null, activeWorldCupMode: undefined });
        onBackToSelection();
    };

    const styles: { [key: string]: React.CSSProperties } = {
        container: { textAlign: 'center', padding: theme.spacing.extraLarge, animation: 'fadeIn 1s' },
        title: { fontSize: '3rem', fontWeight: 900, color: didQualify ? theme.colors.win : theme.colors.loss },
        subtitle: { fontSize: '1.2rem', color: theme.colors.primaryText, margin: '1rem 0 2rem 0' },
        button: { padding: '1rem 2rem', borderRadius: theme.borderRadius.medium, fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', border: 'none' },
    };

    return (
        <Card>
            {didQualify && <Confetti />}
            <div style={styles.container}>
                <h1 style={styles.title}>{didQualify ? '¡CLASIFICADO!' : 'Eliminado'}</h1>
                <p style={styles.subtitle}>
                    Terminaste en {finalPosition}° lugar. {didQualify ? 'Has ganado 5 chances para el Mundial.' : 'Mejor suerte la próxima.'}
                </p>
                <button 
                  style={{...styles.button, backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent}} 
                  onClick={didQualify ? handlePlayWorldCup : handleResetQualifiers}
                >
                  {didQualify ? 'Jugar el Mundial' : 'Volver'}
                </button>
            </div>
        </Card>
    );
};

interface QualifiersViewProps {
  onBackToSelection: () => void;
  onShowTutorial: () => void;
  onOpenHistory: () => void;
}

const QualifiersView: React.FC<QualifiersViewProps> = ({ onBackToSelection, onShowTutorial, onOpenHistory }) => {
    const { theme } = useTheme();
    const { playerProfile, abandonQualifiers, matches } = useData();
    const { qualifiersProgress } = playerProfile;
    const [isConfirmAbandonOpen, setIsConfirmAbandonOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 992);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!qualifiersProgress) return null;

    const startDate = parseLocalDate(qualifiersProgress.startDate || new Date().toISOString());
    const conf = CONFEDERATIONS[qualifiersProgress.confederation];

    const campaignMatches = useMemo(() => {
        return matches
            .filter(m => parseLocalDate(m.date).getTime() >= startDate.getTime())
            .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())
            .slice(0, conf.matchesToPlay); 
    }, [matches, startDate, conf.matchesToPlay]);

    const matchesPlayedCount = campaignMatches.length;

    if (qualifiersProgress.status === 'completed') {
        return <QualificationResultView onBackToSelection={onBackToSelection} />;
    }

    const styles: { [key: string]: React.CSSProperties } = {
        headerContainer: { 
            display: 'flex', 
            flexDirection: isDesktop ? 'row' : 'column',
            justifyContent: 'space-between', 
            alignItems: isDesktop ? 'center' : 'flex-start', 
            gap: theme.spacing.medium,
            marginBottom: '2rem' 
        },
        pageTitle: { fontSize: '1.5rem', fontWeight: 700, borderLeft: `4px solid ${theme.colors.accent2}`, paddingLeft: '1rem', margin: 0 },
        actionsContainer: {
            display: 'flex',
            gap: theme.spacing.medium,
            width: isDesktop ? 'auto' : '100%',
        },
        contentGrid: { display: 'grid', gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr', gap: '2rem' },
        sectionTitle: { fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' },
        backButton: { 
            flex: isDesktop ? 'initial' : 1,
            background: 'transparent', 
            border: `1px solid ${theme.colors.borderStrong}`, 
            color: theme.colors.secondaryText, 
            padding: '0.6rem 1rem', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
        },
    };

    return (
        <>
            <div style={styles.headerContainer}>
                <h2 style={styles.pageTitle}>{conf.name} #{qualifiersProgress.campaignNumber}</h2>
                <div style={styles.actionsContainer}>
                    <button onClick={onOpenHistory} style={styles.backButton}>
                        <ClipboardIcon size={16} /> Historial
                    </button>
                    <button onClick={onBackToSelection} style={styles.backButton}>Volver</button>
                    <button onClick={() => setIsConfirmAbandonOpen(true)} style={{...styles.backButton, color: theme.colors.loss, borderColor: theme.colors.loss + '40'}}>Abandonar</button>
                </div>
            </div>
            
            <div style={styles.contentGrid}>
                <div>
                    <h3 style={styles.sectionTitle}>Tabla de Posiciones</h3>
                    <QualifiersTable progress={qualifiersProgress} playerName={playerProfile.name} directSlots={conf.slots} playoffSlots={conf.playoffSlots} campaignMatches={campaignMatches} />
                </div>
                <div>
                     <h3 style={styles.sectionTitle}>Partidos de Eliminatoria ({matchesPlayedCount})</h3>
                     <MatchList matches={campaignMatches} allMatches={campaignMatches} allPlayers={[]} isReadOnly={true} />
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmAbandonOpen}
                onClose={() => setIsConfirmAbandonOpen(false)}
                onConfirm={abandonQualifiers}
                title="Abandonar Eliminatorias"
                message="¿Estás seguro? Se guardará tu progreso actual en el historial."
            />
        </>
    );
};

export default QualifiersView;
