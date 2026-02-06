
import React, { useState, useEffect, useMemo } from 'react';
import type { Match, MatchSortByType, TutorialStep } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import MatchForm from '../components/MatchForm';
import MatchList from '../components/MatchList';
import MatchListControls from '../components/MatchListControls';
import PostMatchModal from '../components/modals/PostMatchModal';
import EditMatchModal from '../components/modals/EditMatchModal';
import ProfileSetupModal from '../components/modals/ProfileSetupModal';
import { parseLocalDate } from '../utils/analytics';
import { useTutorial } from '../hooks/useTutorial';
import TutorialModal from '../components/modals/TutorialModal';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';
import { TableIcon } from '../components/icons/TableIcon';
import { InfoIcon } from '../components/icons/InfoIcon';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { TargetIcon } from '../components/icons/TargetIcon';
import SectionHelp from '../components/common/SectionHelp';
import { MILESTONES } from '../data/milestones';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { useHaptics } from '../hooks/useHaptics';

const RecorderPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, addMatch, updateMatch, deleteMatch, playerProfile, updatePlayerProfile, availableTournaments, addQualifiersMatch, addWorldCupMatch, setCurrentPage } = useData();
  const { isTutorialSeen, markTutorialAsSeen } = useTutorial('recorder');
  const haptics = useHaptics();
  
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const [lastAddedMatch, setLastAddedMatch] = useState<Match | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(!isTutorialSeen);
  
  // Sync tutorial state: if profile loads and says seen, close it immediately
  useEffect(() => {
      if (isTutorialSeen) setIsTutorialOpen(false);
  }, [isTutorialSeen]);
  
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
  const [isProfileSetupOpen, setIsProfileSetupOpen] = useState(false);
  const [pendingMatchData, setPendingMatchData] = useState<Omit<Match, 'id'> | null>(null);
  
  // Milestone State
  const [milestoneSteps, setMilestoneSteps] = useState<TutorialStep[] | null>(null);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);

  const [resultFilter, setResultFilter] = useState<'ALL' | 'VICTORIA' | 'DERROTA' | 'EMPATE'>('ALL');
  const [tournamentFilter, setTournamentFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<MatchSortByType>('date_desc');

  const availableYears = useMemo(() => {
      const yearSet = new Set(matches.map(m => parseLocalDate(m.date).getFullYear()));
      return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [matches]);

  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');

  const tutorialSteps = [
    {
        title: 'Tu carrera empieza hoy',
        content: 'Plyon es la base de datos de tu legado deportivo. Cada partido cuenta para tus estadísticas, récords y rankings.',
        icon: <ClipboardIcon size={48} />,
    },
    {
        title: 'Entrada Rápida',
        content: 'Usa los botones de Voz 🎙️ o Foto 📸 dentro del formulario para registrar el partido automáticamente sin escribir nada.',
        icon: <TrendingUpIcon size={48} />,
    },
    {
        title: 'Tus partidos, tu historial',
        content: 'Úsalo para zanjar discusiones sobre resultados pasados o revivir tus mejores momentos.',
        icon: <TableIcon size={48} />,
    }
  ];

  const formGuide = [
      { title: 'Registrar Partido', content: 'Ingresa la fecha, el resultado y tus números personales (goles y asistencias).', icon: <ClipboardIcon size={48} /> },
      { title: 'Registro con IA', content: 'No pierdas tiempo escribiendo. Toca "Voz" para dictar el partido o "Foto" para escanear una planilla. La IA llenará todos los campos.', icon: <SparklesIcon size={48} /> },
      { title: 'Info Extra', content: 'Despliega "+ INFO EXTRA" para añadir el torneo, notas y lo más importante: ¡Alineaciones!', icon: <UsersIcon size={48} /> },
      { title: 'Alineaciones', content: 'Agrega a tus compañeros y rivales por nombre. Esto desbloqueará la sección de "Duelos" para ver con quién juegas mejor.', icon: <UsersIcon size={48} /> }
  ];

  const historyGuide = [
      { title: 'Tu Historial', content: 'Aquí verás todos los partidos que has cargado. Es tu hoja de vida deportiva.', icon: <TableIcon size={48} /> },
      { title: 'Filtros y Edición', content: 'Usa los controles superiores para filtrar por año, resultado o torneo. Toca cualquier tarjeta para editar o borrar un partido.', icon: <TargetIcon size={48} /> }
  ];

  const allPlayers = useMemo(() => {
    const players = new Set<string>();
    matches.forEach(match => {
      match.myTeamPlayers?.forEach(p => {
        if (p && p.name.trim() && p.name.toLowerCase() !== (playerProfile.name || '').toLowerCase()) {
          players.add(p.name.trim());
        }
      });
      match.opponentPlayers?.forEach(p => {
        if (p && p.name.trim()) {
          players.add(p.name.trim());
        }
      });
    });
    return Array.from(players).sort();
  }, [matches, playerProfile.name]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const filteredAndSortedMatches = useMemo(() => {
    let processedMatches = [...matches];
    if (selectedYear !== 'all') {
        processedMatches = processedMatches.filter(m => parseLocalDate(m.date).getFullYear().toString() === selectedYear);
    }
    if (resultFilter !== 'ALL') {
      processedMatches = processedMatches.filter(m => m.result === resultFilter);
    }
    if (tournamentFilter !== 'ALL') {
        if (tournamentFilter === 'NONE') {
            processedMatches = processedMatches.filter(m => !m.tournament || m.tournament === "");
        } else {
            processedMatches = processedMatches.filter(m => m.tournament === tournamentFilter);
        }
    }
    processedMatches.sort((a, b) => {
      switch (sortBy) {
        case 'goals_desc': return b.myGoals - a.myGoals;
        case 'goals_asc': return a.myGoals - b.myGoals;
        case 'assists_desc': return b.myAssists - a.myAssists;
        case 'assists_asc': return a.myAssists - b.myAssists;
        case 'date_asc': return parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime();
        case 'date_desc': default: return parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime();
      }
    });
    return processedMatches;
  }, [matches, resultFilter, sortBy, tournamentFilter, selectedYear]);

  const checkMilestones = (newTotalMatches: number) => {
      const seen = playerProfile.tutorialsSeen || {};
      const milestone = MILESTONES[newTotalMatches];
      
      if (milestone && !seen[milestone.id]) {
          haptics.success(); // Vibrate on milestone!
          setActiveMilestoneId(milestone.id);
          setMilestoneSteps(milestone.steps);
          return true;
      }
      return false;
  };

  const handleMilestoneClose = () => {
      if (activeMilestoneId) {
          updatePlayerProfile({ tutorialsSeen: { ...(playerProfile.tutorialsSeen || {}), [activeMilestoneId]: true } });
      }
      setMilestoneSteps(null);
      setActiveMilestoneId(null);
  };

  const processMatchAddition = async (data: Omit<Match, 'id'>) => {
      try {
        setError(null);
        let newMatch: Match;
        const { activeWorldCupMode } = playerProfile;
        if (activeWorldCupMode === 'qualifiers' && addQualifiersMatch) {
            newMatch = await addQualifiersMatch(data);
        } else if (activeWorldCupMode === 'campaign' && addWorldCupMatch) {
            newMatch = await addWorldCupMatch(data);
        } else {
            newMatch = await addMatch(data);
        }
        
        haptics.success(); // Haptic feedback on success
        
        const hitMilestone = checkMilestones(matches.length + 1);
        
        if (!hitMilestone) {
            setTimeout(() => { setLastAddedMatch(newMatch); }, 0);
        }
      } catch (e) {
        haptics.error(); // Haptic feedback on error
        console.error("Failed to add match:", e);
        const errorMessage = e instanceof Error ? e.message : "No se pudo registrar el partido.";
        setError(errorMessage);
      }
  };

  const handleAddMatch = async (newMatchData: Omit<Match, 'id'>) => {
    if (!playerProfile.username || playerProfile.name === 'Jugador') {
        setPendingMatchData(newMatchData);
        setIsProfileSetupOpen(true);
        return;
    }
    await processMatchAddition(newMatchData);
  };
  
  const handleProfileSetupComplete = async () => {
      setIsProfileSetupOpen(false);
      if (pendingMatchData) {
          await processMatchAddition(pendingMatchData);
          setPendingMatchData(null);
      }
  };
  
  const handleEditMatch = (matchId: string) => {
      haptics.medium();
      const match = matches.find(m => m.id === matchId);
      if (match) setMatchToEdit(match);
  };

  const handleSaveEdit = (updatedMatch: Match) => {
      haptics.success();
      updateMatch(updatedMatch);
      setMatchToEdit(null);
  };

  const handleDeleteMatchClick = (matchId: string) => { 
      haptics.light();
      setMatchToDelete(matchId); 
  };

  const confirmDeleteMatch = async () => {
    if (matchToDelete) {
      haptics.heavy(); // Haptic feedback on delete
      await deleteMatch(matchToDelete);
      setMatchToDelete(null);
    }
  };

  const handleCloseModal = () => { setLastAddedMatch(null); };

  const handleImportClick = () => { setCurrentPage('settings'); };

  // Styles optimized with useMemo
  const styles = useMemo(() => ({
    mainContent: { 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, 
        display: 'grid', 
        gap: theme.spacing.extraLarge, 
        gridTemplateColumns: isDesktop ? '380px minmax(0, 1fr)' : 'minmax(0, 1fr)'
    },
    formContainer: { backgroundColor: theme.colors.surface, padding: theme.spacing.large, borderRadius: theme.borderRadius.large, boxShadow: theme.shadows.large, border: `1px solid ${theme.colors.border}`, alignSelf: 'start' as 'start', transition: 'background-color 0.3s, border-color 0.3s', ...(isDesktop && { position: 'sticky' as 'sticky', top: `calc(65px + ${theme.spacing.extraLarge})` }) },
    listContainer: { minWidth: 0 },
    sectionTitle: { fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent1}`, paddingLeft: theme.spacing.medium, display: 'flex', alignItems: 'center' },
    errorText: { color: theme.colors.loss, textAlign: 'center' as 'center', backgroundColor: `${theme.colors.loss}1A`, padding: theme.spacing.medium, borderRadius: theme.borderRadius.medium },
    controlsContainer: { marginBottom: theme.spacing.medium },
    infoButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  }), [theme, isDesktop]);

  return (
    <>
      <TutorialModal isOpen={isTutorialOpen} onClose={(dontShowAgain) => { setIsTutorialOpen(false); if(dontShowAgain) markTutorialAsSeen(); }} steps={tutorialSteps} />
      {milestoneSteps && ( <TutorialModal isOpen={true} onClose={handleMilestoneClose} steps={milestoneSteps} /> )}
      <main style={styles.mainContent}>
        <div style={styles.formContainer}>
          <div style={{display:'flex', alignItems:'center', gap: theme.spacing.small, marginBottom: theme.spacing.medium}}>
            <h2 style={styles.sectionTitle}>
                Registrar partido
                <SectionHelp steps={formGuide} />
            </h2>
            <button onClick={() => setIsTutorialOpen(true)} style={styles.infoButton} aria-label="Mostrar guía"><InfoIcon color={theme.colors.secondaryText} /></button>
          </div>
          
          <MatchForm 
            onAddMatch={handleAddMatch} 
            allPlayers={allPlayers} 
            availableTournaments={availableTournaments} 
          />
        </div>
        <div style={styles.listContainer}>
          {error && <p style={styles.errorText} role="alert">{error}</p>}
          <div style={{display:'flex', alignItems:'center', gap: theme.spacing.small, marginBottom: theme.spacing.large}}>
            <h2 style={styles.sectionTitle}>
                Historial de partidos
                <SectionHelp steps={historyGuide} />
            </h2>
            <button onClick={() => setIsTutorialOpen(true)} style={styles.infoButton} aria-label="Mostrar guía"><InfoIcon color={theme.colors.secondaryText} /></button>
          </div>
          <div style={styles.controlsContainer}>
            <MatchListControls resultFilter={resultFilter} setResultFilter={setResultFilter} sortBy={sortBy} setSortBy={setSortBy} isDesktop={isDesktop} availableTournaments={availableTournaments} tournamentFilter={tournamentFilter} setTournamentFilter={setTournamentFilter} years={availableYears} selectedYear={selectedYear} onSelectYear={setSelectedYear} />
          </div>
          <MatchList matches={filteredAndSortedMatches} allMatches={matches} allPlayers={allPlayers} onDeleteMatch={handleDeleteMatchClick} onEditMatch={handleEditMatch} sortBy={sortBy} isReadOnly={false} onImportClick={handleImportClick} />
        </div>
      </main>
      {lastAddedMatch && ( <PostMatchModal match={lastAddedMatch} matches={matches} onClose={handleCloseModal} playerProfile={playerProfile} /> )}
      {matchToEdit && ( <EditMatchModal isOpen={!!matchToEdit} onClose={() => setMatchToEdit(null)} onSave={handleSaveEdit} match={matchToEdit} allPlayers={allPlayers} availableTournaments={availableTournaments} /> )}
      <ConfirmationModal isOpen={!!matchToDelete} onClose={() => setMatchToDelete(null)} onConfirm={confirmDeleteMatch} title="Eliminar partido" message="¿Estás seguro de que quieres eliminar este partido? Esta acción no se puede deshacer y afectará a tus estadísticas." />
      <ProfileSetupModal isOpen={isProfileSetupOpen} onClose={() => { setIsProfileSetupOpen(false); setPendingMatchData(null); }} onComplete={handleProfileSetupComplete} />
    </>
  );
};

export default RecorderPage;
