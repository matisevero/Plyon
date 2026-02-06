
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
import s from './MatchForm.module.css';

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
        ss => ss && String(ss).toLowerCase().includes(safeValue.toLowerCase()) && String(ss).toLowerCase() !== safeValue.toLowerCase()
    );

    const handleSelect = (newValue: string, uid?: string) => {
        onChange(newValue);
        if (uid) onTagUser(newValue, uid);
        setShowSuggestions(false);
    };

    const inputClasses = [
        s.playerInput,
        isTagging ? s.playerInputTagging : '',
        isVerified ? s.playerInputWithIcon : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={s.playerInputContainer}>
            <div className={s.playerInputWrapper}>
                <input
                    type="text"
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={placeholder}
                    className={inputClasses}
                    autoComplete="off"
                />
                {isVerified && <div className={s.verifiedIcon} title="Usuario verificado"><LinkIcon size={14} /></div>}
            </div>
            {showSuggestions && (
                <ul className={s.suggestionsList}>
                    {isTagging ? (
                        <>
                            {globalResults.map(profile => (
                                <li key={profile.uid} className={`${s.suggestionItem} ${s.globalItem}`} onMouseDown={() => handleSelect(profile.name, profile.uid)}>
                                    <img src={profile.photo || `https://ui-avatars.com/api/?name=${profile.name}&background=random`} alt="" className={s.avatar}/>
                                    <span>{profile.name}</span>
                                    <span className={s.username}>@{profile.username}</span>
                                </li>
                            ))}
                        </>
                    ) : (
                        filteredLocalSuggestions.slice(0, 5).map((suggestion, i) => (
                            <li key={i} className={s.suggestionItem} onMouseDown={() => handleSelect(suggestion)}>
                                {suggestion}
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
    const isActive = value > 0;
    const [isPopping, setIsPopping] = useState(false);

    const handleClick = (e: React.MouseEvent, newValue: number) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(newValue);
        setIsPopping(true);
        setTimeout(() => setIsPopping(false), 200);
    };

    return (
        <div className={s.statControlContainer}>
            {value > 0 && (
                <button type="button" onClick={(e) => handleClick(e, value - 1)} className={s.statControlMinus} title="Restar">
                    -
                </button>
            )}
            <button 
                type="button" 
                onClick={(e) => handleClick(e, value + 1)} 
                className={s.statControlMain}
                style={{
                    backgroundColor: isActive ? `${color}20` : 'transparent',
                    borderColor: isActive ? color : undefined,
                    transform: isPopping ? 'scale(1.15)' : 'scale(1)',
                }}
            >
                <div className={s.statControlIcon} style={{ color: isActive ? color : undefined }}>{icon}</div>
                {isActive && <span className={s.statControlValue} style={{ color }}>{value}</span>}
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [flashColor, setFlashColor] = useState<string | null>(null);

  useEffect(() => {
    const newErrors = { ...errors };
    if (result === 'VICTORIA' && goalDifference <= 0) {
        newErrors.goalDifference = 'En victoria, la diferencia debe ser > 0.';
    } else if (result === 'DERROTA' && goalDifference <= 0) {
        newErrors.goalDifference = 'En derrota, la diferencia debe ser > 0.';
    } else {
        delete newErrors.goalDifference;
    }
    setErrors(newErrors);
  }, [goalDifference, result]);

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
      <div className={s.fieldGroup}>
          <label className={s.label}>{label}</label>
          <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)'}}>
              {players.map((player, index) => (
                  <div key={index} style={{display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center'}}>
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
                      <button type="button" onClick={() => removePlayer(setPlayers, index)} className={s.removePlayerBtn}>{'×'}</button>
                  </div>
              ))}
              <button type="button" onClick={() => addPlayer(setPlayers)} className={s.addPlayerButton}>+ Añadir Jugador</button>
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

  return (
    <form onSubmit={handleSubmit} className={s.form} style={{ backgroundColor: flashColor ? `${flashColor}15` : 'transparent' }}>
      <div className={s.fieldGroup}>
        <label className={s.label}>Fecha</label>
        <CustomDateInput value={date} onChange={setDate} />
      </div>

      <div className={s.fieldGroup}>
        <label className={s.label}>Resultado</label>
        <div className={`${s.radioGroup} ${errors.result ? s.radioGroupError : ''}`}>
          {(['VICTORIA', 'EMPATE', 'DERROTA'] as const).map((option) => (
            <label key={option} className={s.radioLabel} style={getResultRadioStyle(option)}>
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
        {errors.result && <span className={s.validationMsg}>{errors.result}</span>}
      </div>

      {result && (
          <div className={s.animatedSection}>
              
              {matches.length >= 20 && (
                  <div className={s.fieldGroup}>
                      <label className={s.label}>Registrar usando IA</label>
                      <QuickEntryMenu onDataParsed={handleQuickEntryData} />
                  </div>
              )}

              <div className={s.gridContainer}>
                <div className={s.fieldGroup}>
                    <label className={s.label}>Goles</label>
                    <div className={s.stepper}>
                        <button type="button" onClick={() => setMyGoals(g => Math.max(0, g - 1))} className={s.stepperButton}>-</button>
                        <span className={s.stepperValue}>{myGoals}</span>
                        <button type="button" onClick={() => setMyGoals(g => g + 1)} className={s.stepperButton}>+</button>
                    </div>
                </div>
                <div className={s.fieldGroup}>
                    <label className={s.label}>Asistencias</label>
                    <div className={s.stepper}>
                        <button type="button" onClick={() => setMyAssists(a => Math.max(0, a - 1))} className={s.stepperButton}>-</button>
                        <span className={s.stepperValue}>{myAssists}</span>
                        <button type="button" onClick={() => setMyAssists(a => a + 1)} className={s.stepperButton}>+</button>
                    </div>
                </div>
              </div>
              
              <div className={s.gridContainer}>
                <div className={s.fieldGroup}>
                  <label className={s.label}>Diferencia resultado</label>
                  <div className={`${s.stepper} ${errors.goalDifference ? s.stepperError : ''}`}>
                    <button type="button" onClick={() => handleGoalDifferenceChange(-1)} className={s.stepperButton} disabled={result === 'EMPATE'}>-</button>
                    <span className={s.stepperValue}>{result === 'EMPATE' ? 0 : goalDifference}</span>
                    <button type="button" onClick={() => handleGoalDifferenceChange(1)} className={s.stepperButton} disabled={result === 'EMPATE'}>+</button>
                  </div>
                  {errors.goalDifference && <span className={s.validationMsg}>{errors.goalDifference}</span>}
                </div>
                <button type="button" onClick={() => setShowAdditionalInfo(!showAdditionalInfo)} className={s.toggleInfoButton}>
                  {showAdditionalInfo ? '- INFO EXTRA' : '+ INFO EXTRA'}
                </button>
              </div>
              
              {showAdditionalInfo && (
                  <div className={s.animatedSection}>
                      <div className={s.fieldGroup}>
                          <label className={s.label}>Torneo</label>
                          <AutocompleteInput 
                              value={tournament} 
                              onChange={setTournament} 
                              suggestions={availableTournaments} 
                              placeholder="Ej: Liga de los Martes" 
                          />
                      </div>
                      
                      {renderPlayerInputs(myTeamPlayers, setMyTeamPlayers, "Mi Equipo")}
                      {renderPlayerInputs(opponentPlayers, setOpponentPlayers, "Rivales")}

                      <div className={s.fieldGroup}>
                          <label className={s.label}>Notas</label>
                          <textarea value={notes} onChange={e => setNotes(e.target.value)} className={s.textArea} style={{ minHeight: '80px' }} placeholder="Detalles del partido..." />
                      </div>
                  </div>
              )}

              <button type="submit" className={s.submitButton}>Confirmar Partido</button>
          </div>
      )}
    </form>
  );
};

export default MatchForm;
