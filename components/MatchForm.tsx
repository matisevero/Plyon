
import React, { useState, useEffect, useMemo } from 'react';
import type { Match, PlayerPerformance, PublicProfile } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { searchUsers, savePlayerMapping } from '../services/firebaseService';
import AutocompleteInput from './AutocompleteInput';
import CustomDateInput from './common/CustomDateInput';
import { useAuth } from '../contexts/AuthContext';
import { LinkIcon } from './icons/LinkIcon';
import QuickEntryMenu from './QuickEntryMenu';

interface MatchFormProps {
  onAddMatch: (match: Omit<Match, 'id'>) => void;
  allPlayers: string[];
  availableTournaments: string[];
  initialData?: Partial<Match> | null;
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

// --- PlayerInput Component ---
interface PlayerInputProps {
    value: string;
    onChange: (value: string) => void;
    onTagUser: (name: string, uid: string) => void;
    suggestions: string[];
    placeholder?: string;
    isVerified?: boolean;
}

const PlayerInput: React.FC<PlayerInputProps> = ({ value = '', onChange, onTagUser, suggestions = [], placeholder, isVerified }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [globalResults, setGlobalResults] = useState<PublicProfile[]>([]);
    
    const safeValue = value || '';
    const isTagging = safeValue.startsWith('@');

    useEffect(() => {
        if (isTagging && safeValue.length >= 3 && user) {
            const delayDebounceFn = setTimeout(async () => {
                const results = await searchUsers(safeValue, user.uid);
                setGlobalResults(results);
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setGlobalResults([]);
        }
    }, [isTagging, safeValue, user]);

    const filteredLocalSuggestions = suggestions.filter(
        s => s && String(s).toLowerCase().includes(safeValue.toLowerCase()) && String(s).toLowerCase() !== safeValue.toLowerCase()
    );

    const handleSelect = (newValue: string, uid?: string) => {
        onChange(newValue);
        if (uid) onTagUser(newValue, uid);
        setShowSuggestions(false);
    };

    const styles = useMemo(() => ({
        container: { position: 'relative' as 'relative', width: '100%' },
        inputWrapper: { position: 'relative' as 'relative', display: 'flex', alignItems: 'center' },
        input: {
            width: '100%', boxSizing: 'border-box' as 'border-box', padding: '0.4rem 0.6rem',
            paddingRight: isVerified ? '26px' : '0.6rem',
            backgroundColor: theme.colors.background,
            border: `1px solid ${isTagging ? theme.colors.accent2 : theme.colors.borderStrong}`, 
            borderRadius: theme.borderRadius.medium, color: theme.colors.primaryText,
            fontSize: theme.typography.fontSize.medium,
            height: '32px'
        },
        verifiedIcon: { position: 'absolute' as 'absolute', right: '6px', color: theme.colors.accent2, pointerEvents: 'none' as 'none' },
        suggestionsList: {
            position: 'absolute' as 'absolute', top: '100%', left: 0, right: 0,
            backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.borderStrong}`,
            borderRadius: theme.borderRadius.medium, zIndex: 10,
            listStyle: 'none', margin: `${theme.spacing.extraSmall} 0 0 0`, padding: 0,
            maxHeight: '200px', overflowY: 'auto' as 'auto',
            boxShadow: theme.shadows.large,
        },
        suggestionItem: {
            padding: theme.spacing.small, cursor: 'pointer',
            fontSize: theme.typography.fontSize.small,
            color: theme.colors.primaryText,
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex', alignItems: 'center', gap: '8px'
        },
        globalItem: { backgroundColor: `${theme.colors.accent2}10` },
        avatar: { width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' as 'cover' },
        username: { color: theme.colors.secondaryText, fontSize: '0.75rem', marginLeft: 'auto' }
    }), [theme, isTagging, isVerified]);

    return (
        <div style={styles.container}>
            <div style={styles.inputWrapper}>
                <input
                    type="text"
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={placeholder}
                    style={styles.input}
                    autoComplete="off"
                />
                {isVerified && <div style={styles.verifiedIcon} title="Usuario verificado"><LinkIcon size={14} /></div>}
            </div>
            {showSuggestions && (
                <ul style={styles.suggestionsList}>
                    {isTagging ? (
                        <>
                            {globalResults.map(profile => (
                                <li key={profile.uid} style={{...styles.suggestionItem, ...styles.globalItem}} onMouseDown={() => handleSelect(profile.name, profile.uid)}>
                                    <img src={profile.photo || `https://ui-avatars.com/api/?name=${profile.name}&background=random`} alt="" style={styles.avatar}/>
                                    <span>{profile.name}</span>
                                    <span style={styles.username}>@{profile.username}</span>
                                </li>
                            ))}
                        </>
                    ) : (
                        filteredLocalSuggestions.slice(0, 5).map((s, i) => (
                            <li key={i} style={styles.suggestionItem} onMouseDown={() => handleSelect(s)}>
                                {s}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}

// Special button for Goals and Assists with "pop" animation
const StatControlButton: React.FC<{ value: number; onChange: (v: number) => void; icon: React.ReactNode; color: string }> = ({ value, onChange, icon, color }) => {
    const { theme } = useTheme();
    const isActive = value > 0;
    const [isPopping, setIsPopping] = useState(false);

    const handleClick = (e: React.MouseEvent, newValue: number) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(newValue);
        setIsPopping(true);
        setTimeout(() => setIsPopping(false), 200);
    };

    const styles = useMemo(() => ({
        container: { position: 'relative' as 'relative', display: 'flex', alignItems: 'center', margin: '0 2px' },
        minusButton: {
            position: 'absolute' as 'absolute',
            top: '-6px',
            left: '-6px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: theme.colors.loss,
            color: '#FFF',
            border: '1px solid ' + theme.colors.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 'bold',
            zIndex: 10,
            padding: 0,
            lineHeight: 1,
            boxShadow: theme.shadows.small
        },
        mainButton: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            backgroundColor: isActive ? `${color}20` : 'transparent',
            border: `1px solid ${isActive ? color : theme.colors.borderStrong}`,
            borderRadius: theme.borderRadius.medium,
            padding: '0 6px',
            minWidth: '40px',
            height: '30px',
            cursor: 'pointer',
            transition: 'all 0.2s, transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            color: theme.colors.primaryText,
            position: 'relative' as 'relative',
            transform: isPopping ? 'scale(1.15)' : 'scale(1)', // Pop animation
        },
        icon: { color: isActive ? color : theme.colors.primaryText, display: 'flex', fontSize: '0.9rem' },
        value: { fontWeight: 800, fontSize: '0.85rem', color: color }
    }), [theme, isActive, color, isPopping]);

    return (
        <div style={styles.container}>
            {value > 0 && (
                <button type="button" onClick={(e) => handleClick(e, value - 1)} style={styles.minusButton} title="Restar">
                    -
                </button>
            )}
            <button type="button" onClick={(e) => handleClick(e, value + 1)} style={styles.mainButton}>
                <div style={styles.icon}>{icon}</div>
                {isActive && <span style={styles.value}>{value}</span>}
            </button>
        </div>
    );
};


const MatchForm: React.FC<MatchFormProps> = ({ onAddMatch, allPlayers, availableTournaments, initialData }) => {
  const { theme } = useTheme();
  const { playerProfile, addTournament, matches } = useData();
  const { user } = useAuth();
  
  const [result, setResult] = useState<'VICTORIA' | 'DERROTA' | 'EMPATE' | null>(null);
  const [myGoals, setMyGoals] = useState(0);
  const [myAssists, setMyAssists] = useState(0);
  const [goalDifference, setGoalDifference] = useState(1);
  const [date, setDate] = useState(getLocalDateString());
  const [notes, setNotes] = useState('');
  const [tournament, setTournament] = useState('');
  const [myTeamPlayers, setMyTeamPlayers] = useState<PlayerPerformance[]>([]);
  const [opponentPlayers, setOpponentPlayers] = useState<PlayerPerformance[]>([]);
  
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  
  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [flashColor, setFlashColor] = useState<string | null>(null);

  // Validate Goal Difference Effect
  useEffect(() => {
    const newErrors = { ...errors };
    
    if (result === 'VICTORIA' && goalDifference <= 0) {
        newErrors.goalDifference = 'En victoria, la diferencia debe ser > 0.';
    } else if (result === 'DERROTA' && goalDifference <= 0) {
        // Note: goalDifference state is usually positive magnitude, logic below handles sign
        newErrors.goalDifference = 'En derrota, la diferencia debe ser > 0.';
    } else {
        delete newErrors.goalDifference;
    }
    setErrors(newErrors);
  }, [goalDifference, result]);

  // Effect to populate form when initialData changes
  useEffect(() => {
      if (initialData) {
          if (initialData.result) setResult(initialData.result);
          if (initialData.myGoals !== undefined) setMyGoals(initialData.myGoals);
          if (initialData.myAssists !== undefined) setMyAssists(initialData.myAssists);
          if (initialData.date) setDate(initialData.date);
          if (initialData.notes) setNotes(initialData.notes);
          if (initialData.tournament) {
              setTournament(initialData.tournament);
              setShowAdditionalInfo(true);
          }
          if (initialData.goalDifference) setGoalDifference(Math.abs(initialData.goalDifference));
      }
  }, [initialData]);
  
  const isPlayerVerified = (name: string) => !!playerProfile.playerMappings?.[name];
  
  const handleGoalDifferenceChange = (amount: number) => {
    setGoalDifference(current => Math.max(0, current + amount));
  };

  const handleTagUser = async (playerName: string, friendUid: string) => {
      if (user) {
          try {
              await savePlayerMapping(user.uid, playerName, friendUid);
          } catch (e) { console.error("Error saving mapping", e); }
      }
  };

  const handleQuickEntryData = (data: Partial<Match>) => {
      if (data.result) handleResultChange(data.result);
      if (data.myGoals !== undefined) setMyGoals(data.myGoals);
      if (data.myAssists !== undefined) setMyAssists(data.myAssists);
      if (data.notes) setNotes(data.notes);
      if (data.goalDifference) setGoalDifference(Math.abs(data.goalDifference));
      
      if (data.myTeamPlayers?.length || data.opponentPlayers?.length || data.tournament) {
          setShowAdditionalInfo(true);
          if (data.tournament) setTournament(data.tournament);
          if (data.myTeamPlayers) setMyTeamPlayers(data.myTeamPlayers);
          if (data.opponentPlayers) setOpponentPlayers(data.opponentPlayers);
      }
  };

  const handleResultChange = (newResult: 'VICTORIA' | 'DERROTA' | 'EMPATE') => {
      setResult(newResult);
      // Remove result error if present
      if (errors.result) {
          const newErrors = {...errors};
          delete newErrors.result;
          setErrors(newErrors);
      }

      let color = null;
      if (newResult === 'VICTORIA') color = theme.colors.win;
      else if (newResult === 'DERROTA') color = theme.colors.loss;
      else color = theme.colors.draw;
      
      setFlashColor(color);
      setTimeout(() => setFlashColor(null), 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final Validation Check
    const submitErrors: Record<string, string> = {};
    if (!result) submitErrors.result = 'Selecciona un resultado.';
    if (result !== 'EMPATE' && goalDifference <= 0) submitErrors.goalDifference = 'La diferencia debe ser mayor a 0.';

    if (Object.keys(submitErrors).length > 0) {
        setErrors(submitErrors);
        return;
    }

    let finalGoalDiff = Math.abs(goalDifference);

    if (result === 'EMPATE') {
        finalGoalDiff = 0;
    } else if (result === 'DERROTA') {
        finalGoalDiff = -Math.abs(goalDifference);
    }

    const finalTeammates = myTeamPlayers
        .map(p => ({ ...p, name: p.name.trim() }))
        .filter(p => p.name && p.name.toLowerCase() !== (playerProfile.name || '').toLowerCase());
    const finalOpponents = opponentPlayers.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name);

    const finalTournament = tournament.trim();

    if (finalTournament && !availableTournaments.includes(finalTournament)) {
        addTournament(finalTournament);
    }

    const matchData = {
      result: result!, 
      myGoals, 
      myAssists, 
      date, 
      goalDifference: finalGoalDiff, 
      notes,
      myTeamPlayers: finalTeammates,
      opponentPlayers: finalOpponents,
      tournament: finalTournament, 
    };

    onAddMatch(matchData);
    
    // Reset Form
    setResult(null);
    setMyGoals(0);
    setMyAssists(0);
    setGoalDifference(1);
    setNotes('');
    setTournament('');
    setMyTeamPlayers([]);
    setOpponentPlayers([]);
    setShowAdditionalInfo(false);
    setErrors({});
  };

  const updatePlayerList = (list: PlayerPerformance[], setList: any, index: number, field: keyof PlayerPerformance, value: any, tagData?: { name: string, uid: string }) => {
      const newList = [...list];
      if (tagData) {
          newList[index] = { ...newList[index], name: tagData.name };
          handleTagUser(tagData.name, tagData.uid);
      } else {
          newList[index] = { ...newList[index], [field]: value };
      }
      setList(newList);
  };

  const addPlayer = (setList: any) => setList((prev: any) => [...prev, { name: '', goals: 0, assists: 0 }]);
  const removePlayer = (setList: any, index: number) => setList((prev: any) => prev.filter((_: any, i: number) => i !== index));

  const renderPlayerInputs = (players: PlayerPerformance[], setPlayers: any, label: string) => (
      <div style={styles.fieldGroup}>
          <label style={styles.label}>{label}</label>
          <div style={{display: 'flex', flexDirection: 'column', gap: theme.spacing.small}}>
              {players.map((player, index) => (
                  <div key={index} style={{display: 'flex', gap: theme.spacing.small, alignItems: 'center'}}>
                      <div style={{flex: 1}}>
                        <PlayerInput 
                            value={player.name || ''}
                            onChange={(val) => updatePlayerList(players, setPlayers, index, 'name', val)}
                            onTagUser={(name, uid) => updatePlayerList(players, setPlayers, index, 'name', name, { name, uid })}
                            suggestions={allPlayers}
                            placeholder="Nombre o @usuario"
                            isVerified={isPlayerVerified(player.name || '')}
                        />
                      </div>
                      <StatControlButton 
                        value={player.goals} 
                        onChange={(v) => updatePlayerList(players, setPlayers, index, 'goals', v)} 
                        icon="⚽️"
                        color={theme.colors.win}
                      />
                      <StatControlButton 
                        value={player.assists} 
                        onChange={(v) => updatePlayerList(players, setPlayers, index, 'assists', v)} 
                        icon="👟"
                        color={theme.colors.accent2}
                      />
                      <button type="button" onClick={() => removePlayer(setPlayers, index)} style={styles.removePlayerBtn}>×</button>
                  </div>
              ))}
              <button type="button" onClick={() => addPlayer(setPlayers)} style={styles.addPlayerButton}>+ Añadir Jugador</button>
          </div>
      </div>
  );

  const getResultRadioStyle = (option: 'VICTORIA' | 'EMPATE' | 'DERROTA'): React.CSSProperties => {
    if (result !== option) return {};
    switch (option) {
      case 'VICTORIA': return { backgroundColor: theme.colors.win, color: theme.colors.textOnAccent };
      case 'EMPATE': return { backgroundColor: theme.colors.draw, color: theme.colors.textOnAccent };
      case 'DERROTA': return { backgroundColor: theme.colors.loss, color: theme.colors.textOnAccent };
      default: return {};
    }
  };

  const styles = useMemo(() => ({
    form: { 
        display: 'flex', 
        flexDirection: 'column' as 'column', 
        gap: theme.spacing.large,
        position: 'relative' as 'relative',
        transition: 'background-color 0.4s ease',
        backgroundColor: flashColor ? `${flashColor}15` : 'transparent',
        borderRadius: theme.borderRadius.medium,
    },
    gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'flex-end', gap: theme.spacing.medium },
    stepper: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.background, border: `1px solid ${errors.goalDifference ? theme.colors.loss : theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, padding: `0 ${theme.spacing.small}`, height: '42px' },
    stepperButton: { background: 'none', border: 'none', color: theme.colors.primaryText, fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', padding: `0 ${theme.spacing.small}` },
    stepperValue: { fontSize: '1.1rem', fontWeight: 600, color: theme.colors.primaryText, minWidth: '24px', textAlign: 'center' as 'center' },
    fieldGroup: { display: 'flex', flexDirection: 'column' as 'column', gap: theme.spacing.extraSmall },
    label: { fontSize: '0.8rem', color: theme.colors.secondaryText, fontWeight: 500, paddingLeft: '0.25rem' },
    radioGroup: { display: 'flex', borderRadius: theme.borderRadius.medium, border: `1px solid ${errors.result ? theme.colors.loss : theme.colors.borderStrong}`, overflow: 'hidden', height: '42px' },
    radioLabel: { flex: 1, textAlign: 'center' as 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'transparent', color: theme.colors.secondaryText, fontWeight: 600, transition: 'all 0.2s', fontSize: '0.9rem' },
    submitButton: { flex: 1, padding: theme.spacing.medium, borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium, fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent, border: 'none', transition: 'transform 0.1s ease', marginTop: theme.spacing.small },
    toggleInfoButton: { height: '42px', background: 'none', border: `1px dashed ${theme.colors.borderStrong}`, color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, borderRadius: theme.borderRadius.medium, cursor: 'pointer', textAlign: 'center' as 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    addPlayerButton: { background: 'none', border: `1px dashed ${theme.colors.border}`, color: theme.colors.accent2, padding: theme.spacing.small, borderRadius: theme.borderRadius.medium, cursor: 'pointer', fontSize: '0.8rem', width: '100%'},
    textArea: { width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium, boxSizing: 'border-box' as 'border-box' },
    animatedSection: {
        animation: 'slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        transformOrigin: 'top',
        display: 'flex',
        flexDirection: 'column' as 'column',
        gap: theme.spacing.large
    },
    removePlayerBtn: { background: 'none', border: 'none', color: theme.colors.loss, cursor: 'pointer', padding: '0 4px', fontSize: '1.2rem', height: '30px', width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    validationMsg: { color: theme.colors.loss, fontSize: '0.75rem', marginTop: '2px', marginLeft: '4px' }
  }), [theme, flashColor, errors]);

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <style>{`
        @keyframes slideDownFade {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Fecha</label>
        <CustomDateInput value={date} onChange={setDate} />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Resultado</label>
        <div style={styles.radioGroup}>
          {(['VICTORIA', 'EMPATE', 'DERROTA'] as const).map((option) => (
            <label key={option} style={{...styles.radioLabel, ...getResultRadioStyle(option)}}>
              <input 
                type="radio" 
                name="result" 
                value={option} 
                checked={result === option} 
                onChange={() => handleResultChange(option)} 
                style={{display: 'none'}} 
              />
              {resultAbbreviations[option]}
            </label>
          ))}
        </div>
        {errors.result && <span style={styles.validationMsg}>{errors.result}</span>}
      </div>

      {result && (
          <div style={styles.animatedSection}>
              
              {matches.length >= 20 && (
                  <div style={styles.fieldGroup}>
                      <label style={styles.label}>Registrar usando IA</label>
                      <QuickEntryMenu onDataParsed={handleQuickEntryData} />
                  </div>
              )}

              <div style={styles.gridContainer}>
                <div style={styles.fieldGroup}>
                    <label style={styles.label}>Goles</label>
                    <div style={styles.stepper}>
                        <button type="button" onClick={() => setMyGoals(g => Math.max(0, g - 1))} style={styles.stepperButton}>-</button>
                        <span style={styles.stepperValue}>{myGoals}</span>
                        <button type="button" onClick={() => setMyGoals(g => g + 1)} style={styles.stepperButton}>+</button>
                    </div>
                </div>
                <div style={styles.fieldGroup}>
                    <label style={styles.label}>Asistencias</label>
                    <div style={styles.stepper}>
                        <button type="button" onClick={() => setMyAssists(a => Math.max(0, a - 1))} style={styles.stepperButton}>-</button>
                        <span style={styles.stepperValue}>{myAssists}</span>
                        <button type="button" onClick={() => setMyAssists(a => a + 1)} style={styles.stepperButton}>+</button>
                    </div>
                </div>
              </div>
              
              <div style={styles.gridContainer}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Diferencia resultado</label>
                  <div style={styles.stepper}>
                    <button type="button" onClick={() => handleGoalDifferenceChange(-1)} style={styles.stepperButton} disabled={result === 'EMPATE'}>-</button>
                    <span style={styles.stepperValue}>{result === 'EMPATE' ? 0 : goalDifference}</span>
                    <button type="button" onClick={() => handleGoalDifferenceChange(1)} style={styles.stepperButton} disabled={result === 'EMPATE'}>+</button>
                  </div>
                  {errors.goalDifference && <span style={styles.validationMsg}>{errors.goalDifference}</span>}
                </div>
                <button type="button" onClick={() => setShowAdditionalInfo(!showAdditionalInfo)} style={styles.toggleInfoButton}>
                  {showAdditionalInfo ? '- INFO EXTRA' : '+ INFO EXTRA'}
                </button>
              </div>
              
              {showAdditionalInfo && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: theme.spacing.large, animation: 'slideDownFade 0.3s ease'}}>
                      <div style={styles.fieldGroup}>
                          <label style={styles.label}>Torneo</label>
                          <AutocompleteInput 
                              value={tournament} 
                              onChange={setTournament} 
                              suggestions={availableTournaments} 
                              placeholder="Ej: Liga de los Martes" 
                          />
                      </div>
                      
                      {renderPlayerInputs(myTeamPlayers, setMyTeamPlayers, "Mi Equipo")}
                      {renderPlayerInputs(opponentPlayers, setOpponentPlayers, "Rivales")}

                      <div style={styles.fieldGroup}>
                          <label style={styles.label}>Notas</label>
                          <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{...styles.textArea, minHeight: '80px', fontFamily: 'inherit'}} placeholder="Detalles del partido..." />
                      </div>
                  </div>
              )}

              <button type="submit" style={styles.submitButton}>Confirmar Partido</button>
          </div>
      )}
    </form>
  );
};

export default MatchForm;
