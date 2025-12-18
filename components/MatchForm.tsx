
import React, { useState, useEffect, useMemo } from 'react';
import type { Match, PlayerPerformance, Tournament } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import AutocompleteInput from './AutocompleteInput';
import StatStepper from './common/StatStepper';
import { TeamIcon } from './icons/TeamIcon';
import CustomDateInput from './common/CustomDateInput';

interface MatchFormProps {
  onAddMatch: (match: Omit<Match, 'id'>) => void;
  onUpdateMatch: (match: Match) => void;
  onCancelEdit: () => void;
  matchToEdit: Match | null;
  allPlayers: string[];
  availableTournaments: string[];
}

const resultAbbreviations: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = {
  VICTORIA: 'V',
  DERROTA: 'D',
  EMPATE: 'E',
};

const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MatchForm: React.FC<MatchFormProps> = ({ onAddMatch, onUpdateMatch, onCancelEdit, matchToEdit, allPlayers, availableTournaments }) => {
  const { theme } = useTheme();
  const { playerProfile } = useData();
  
  const [result, setResult] = useState<'VICTORIA' | 'DERROTA' | 'EMPATE'>('VICTORIA');
  const [myGoals, setMyGoals] = useState(0);
  const [myAssists, setMyAssists] = useState(0);
  const [goalDifference, setGoalDifference] = useState(1);
  const [date, setDate] = useState(getLocalDateString());
  const [notes, setNotes] = useState('');
  const [tournament, setTournament] = useState('');
  const [myTeamPlayers, setMyTeamPlayers] = useState<PlayerPerformance[]>([]);
  const [opponentPlayers, setOpponentPlayers] = useState<PlayerPerformance[]>([]);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!matchToEdit;

  useEffect(() => {
    if (matchToEdit) {
      setResult(matchToEdit.result);
      setMyGoals(matchToEdit.myGoals);
      setMyAssists(matchToEdit.myAssists);
      setDate(matchToEdit.date);
      // ALWAYS load absolute value to the form state to avoid validation issues
      setGoalDifference(Math.abs(matchToEdit.goalDifference ?? 0));
      setNotes(matchToEdit.notes || '');
      setTournament(matchToEdit.tournament || '');
      setMyTeamPlayers(matchToEdit.myTeamPlayers || []);
      setOpponentPlayers(matchToEdit.opponentPlayers || []);
      setShowAdditionalInfo(!!(matchToEdit.notes || matchToEdit.tournament || matchToEdit.myTeamPlayers?.length || matchToEdit.opponentPlayers?.length));
    }
  }, [matchToEdit]);
  
  const handleGoalDifferenceChange = (amount: number) => {
    setGoalDifference(current => Math.max(0, current + amount));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    let finalGoalDiff = Math.abs(goalDifference);

    if (result === 'EMPATE') {
        finalGoalDiff = 0;
    } else if (result === 'DERROTA') {
        finalGoalDiff = -Math.abs(goalDifference);
        if (finalGoalDiff === 0) {
            setError('La diferencia de gol en una derrota debe ser mayor a 0.');
            return;
        }
    } else { // VICTORIA
        if (finalGoalDiff === 0) {
            setError('La diferencia de gol en una victoria debe ser mayor a 0.');
            return;
        }
    }

    const finalTeammates = myTeamPlayers
        .map(p => ({ ...p, name: p.name.trim() }))
        .filter(p => p.name && p.name.toLowerCase() !== playerProfile.name.toLowerCase());
    const finalOpponents = opponentPlayers.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name);

    const matchData = {
      result, myGoals, myAssists, date, goalDifference: finalGoalDiff, notes,
      tournament: tournament || undefined,
      myTeamPlayers: finalTeammates,
      opponentPlayers: finalOpponents,
    };

    if (isEditMode && matchToEdit) {
      onUpdateMatch({ ...matchToEdit, ...matchData });
    } else {
       onAddMatch(matchData);
       resetForm();
    }
  };

  const resetForm = () => {
    setResult('VICTORIA');
    setMyGoals(0);
    setMyAssists(0);
    setGoalDifference(1);
    setNotes('');
    setDate(getLocalDateString());
    setTournament('');
    setMyTeamPlayers([]);
    setOpponentPlayers([]);
    setShowAdditionalInfo(false);
    setError('');
  };

  const styles: { [key: string]: React.CSSProperties } = {
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'flex-end', gap: theme.spacing.medium },
    input: { width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium, outline: 'none' },
    stepper: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, padding: `0 ${theme.spacing.small}`, height: '48px' },
    stepperButton: { background: 'none', border: 'none', color: theme.colors.primaryText, fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', padding: `${theme.spacing.small} ${theme.spacing.medium}` },
    stepperValue: { fontSize: '1.25rem', fontWeight: 600, color: theme.colors.primaryText, minWidth: '30px', textAlign: 'center' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    label: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontWeight: 500, paddingLeft: '0.25rem' },
    radioGroup: { display: 'flex', borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.borderStrong}`, overflow: 'hidden' },
    radioLabel: { flex: 1, textAlign: 'center', padding: theme.spacing.medium, cursor: 'pointer', backgroundColor: 'transparent', color: theme.colors.secondaryText, fontWeight: 600, transition: 'all 0.2s' },
    radioInput: { display: 'none' },
    submitButton: { flex: 1, padding: theme.spacing.medium, borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium, fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent, border: 'none' },
    cancelButton: { flex: 1, padding: theme.spacing.medium, borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium, fontWeight: 'bold', cursor: 'pointer', backgroundColor: 'transparent', color: theme.colors.secondaryText, border: `1px solid ${theme.colors.borderStrong}` },
    errorText: { color: theme.colors.loss, fontSize: theme.typography.fontSize.small, textAlign: 'center' },
    toggleInfoButton: { background: 'none', border: `1px dashed ${theme.colors.borderStrong}`, color: theme.colors.secondaryText, padding: theme.spacing.small, fontSize: theme.typography.fontSize.small, borderRadius: theme.borderRadius.medium, cursor: 'pointer', textAlign: 'center' }
  };

  const getResultRadioStyle = (option: 'VICTORIA' | 'EMPATE' | 'DERROTA'): React.CSSProperties => {
    if (result !== option) return {};
    switch (option) {
      case 'VICTORIA': return { backgroundColor: theme.colors.win, color: theme.colors.textOnAccent };
      case 'EMPATE': return { backgroundColor: theme.colors.draw, color: theme.colors.textOnAccent };
      case 'DERROTA': return { backgroundColor: theme.colors.loss, color: theme.colors.textOnAccent };
      default: return {};
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {error && <p style={styles.errorText}>{error}</p>}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Fecha</label>
        <CustomDateInput value={date} onChange={setDate} />
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Resultado</label>
        <div style={styles.radioGroup}>
          {(['VICTORIA', 'EMPATE', 'DERROTA'] as const).map((option) => (
            <label key={option} style={{...styles.radioLabel, ...getResultRadioStyle(option)}}>
              <input type="radio" name="result" value={option} checked={result === option} onChange={() => setResult(option)} style={styles.radioInput} />
              {resultAbbreviations[option]}
            </label>
          ))}
        </div>
      </div>
      <div style={styles.gridContainer}>
        <div style={styles.fieldGroup}><label style={styles.label}>Goles</label><div style={styles.stepper}><button type="button" onClick={() => setMyGoals(g => Math.max(0, g - 1))} style={styles.stepperButton}>-</button><span style={styles.stepperValue}>{myGoals}</span><button type="button" onClick={() => setMyGoals(g => g + 1)} style={styles.stepperButton}>+</button></div></div>
        <div style={styles.fieldGroup}><label style={styles.label}>Asistencias</label><div style={styles.stepper}><button type="button" onClick={() => setMyAssists(a => Math.max(0, a - 1))} style={styles.stepperButton}>-</button><span style={styles.stepperValue}>{myAssists}</span><button type="button" onClick={() => setMyAssists(a => a + 1)} style={styles.stepperButton}>+</button></div></div>
      </div>
      <div style={styles.gridContainer}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Dif. de Gol</label>
          <div style={styles.stepper}>
            <button type="button" onClick={() => handleGoalDifferenceChange(-1)} style={styles.stepperButton} disabled={result === 'EMPATE'}>-</button>
            <span style={styles.stepperValue}>{result === 'EMPATE' ? 0 : goalDifference}</span>
            <button type="button" onClick={() => handleGoalDifferenceChange(1)} style={styles.stepperButton} disabled={result === 'EMPATE'}>+</button>
          </div>
        </div>
        <button type="button" onClick={() => setShowAdditionalInfo(!showAdditionalInfo)} style={styles.toggleInfoButton}>
          {showAdditionalInfo ? '- INFO EXTRA' : '+ INFO EXTRA'}
        </button>
      </div>
      <div style={{display: 'flex', gap: '1rem'}}>
        {isEditMode && <button type="button" onClick={onCancelEdit} style={styles.cancelButton}>Cancelar</button>}
        <button type="submit" style={styles.submitButton}>{isEditMode ? 'Actualizar' : 'Añadir'}</button>
      </div>
    </form>
  );
};

export default MatchForm;
