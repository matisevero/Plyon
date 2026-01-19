
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { searchUsers, savePlayerMapping } from '../../services/firebaseService';
import type { Match, PlayerPerformance, PublicProfile } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';
import { GoalIcon } from '../icons/GoalIcon';
import { AssistIcon } from '../icons/AssistIcon';
import { LinkIcon } from '../icons/LinkIcon';
import CustomDateInput from '../common/CustomDateInput';
import AutocompleteInput from '../AutocompleteInput';

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (match: Match) => void;
  match: Match;
  allPlayers: string[];
  availableTournaments: string[];
}

const resultAbbreviations: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = {
  VICTORIA: 'V',
  DERROTA: 'D',
  EMPATE: 'E',
};

// --- Internal Components (Replicated for isolation) ---

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

    const styles: { [key: string]: React.CSSProperties } = {
        container: { position: 'relative', width: '100%' },
        inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
        input: {
            width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.6rem',
            paddingRight: isVerified ? '26px' : '0.6rem',
            backgroundColor: theme.colors.background,
            border: `1px solid ${isTagging ? theme.colors.accent2 : theme.colors.borderStrong}`, 
            borderRadius: theme.borderRadius.medium, color: theme.colors.primaryText,
            fontSize: theme.typography.fontSize.medium,
            height: '32px'
        },
        verifiedIcon: { position: 'absolute', right: '6px', color: theme.colors.accent2, pointerEvents: 'none' },
        suggestionsList: {
            position: 'absolute', top: '100%', left: 0, right: 0,
            backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.borderStrong}`,
            borderRadius: theme.borderRadius.medium, zIndex: 5000,
            listStyle: 'none', margin: `${theme.spacing.extraSmall} 0 0 0`, padding: 0,
            maxHeight: '200px', overflowY: 'auto',
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
        avatar: { width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' },
        username: { color: theme.colors.secondaryText, fontSize: '0.75rem', marginLeft: 'auto' }
    };

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

// Special button for Goals and Assists with the "pop-out" minus button
const StatControlButton: React.FC<{ value: number; onChange: (v: number) => void; icon: React.ReactNode; color: string }> = ({ value, onChange, icon, color }) => {
    const { theme } = useTheme();
    const isActive = value > 0;

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: '0 2px' }}>
            {value > 0 && (
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(value - 1); }}
                    style={{
                        position: 'absolute',
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
                    }}
                    title="Restar"
                >
                    -
                </button>
            )}
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); onChange(value + 1); }}
                style={{
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
                    transition: 'all 0.2s',
                    color: theme.colors.primaryText,
                    position: 'relative'
                }}
            >
                <div style={{color: isActive ? color : theme.colors.primaryText, display: 'flex', fontSize: '0.9rem' }}>{icon}</div>
                {isActive && <span style={{ fontWeight: 800, fontSize: '0.85rem', color: color }}>{value}</span>}
            </button>
        </div>
    );
};

const EditMatchModal: React.FC<EditMatchModalProps> = ({ isOpen, onClose, onSave, match, allPlayers, availableTournaments }) => {
    const { theme } = useTheme();
    const { playerProfile } = useData();
    const { user } = useAuth();

    // State initialized from props with defensive defaults
    const [result, setResult] = useState<'VICTORIA' | 'DERROTA' | 'EMPATE'>(match.result);
    const [myGoals, setMyGoals] = useState(match.myGoals ?? 0);
    const [myAssists, setMyAssists] = useState(match.myAssists ?? 0);
    const [goalDifference, setGoalDifference] = useState(Math.abs(match.goalDifference ?? 1));
    const [date, setDate] = useState(match.date);
    const [notes, setNotes] = useState(match.notes || '');
    const [tournament, setTournament] = useState(match.tournament || '');
    const [myTeamPlayers, setMyTeamPlayers] = useState<PlayerPerformance[]>(match.myTeamPlayers ? JSON.parse(JSON.stringify(match.myTeamPlayers)) : []);
    const [opponentPlayers, setOpponentPlayers] = useState<PlayerPerformance[]>(match.opponentPlayers ? JSON.parse(JSON.stringify(match.opponentPlayers)) : []);
    const [error, setError] = useState('');

    // Re-initialize state when match changes or modal opens
    useEffect(() => {
        if (isOpen && match) {
            setResult(match.result);
            setMyGoals(match.myGoals ?? 0);
            setMyAssists(match.myAssists ?? 0);
            setGoalDifference(Math.abs(match.goalDifference ?? 1));
            setDate(match.date);
            setNotes(match.notes || '');
            setTournament(match.tournament || '');
            setMyTeamPlayers(match.myTeamPlayers ? JSON.parse(JSON.stringify(match.myTeamPlayers)) : []);
            setOpponentPlayers(match.opponentPlayers ? JSON.parse(JSON.stringify(match.opponentPlayers)) : []);
            setError('');
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, match]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalGoalDiff = Math.abs(goalDifference);
        if (result === 'EMPATE') finalGoalDiff = 0;
        else if (result === 'DERROTA') {
            finalGoalDiff = -Math.abs(goalDifference);
            if (finalGoalDiff === 0) { setError('Diferencia de gol en derrota debe ser > 0'); return; }
        } else {
            if (finalGoalDiff === 0) { setError('Diferencia de gol en victoria debe ser > 0'); return; }
        }

        const finalTeammates = myTeamPlayers
            .map(p => ({ ...p, name: p.name.trim() }))
            .filter(p => p.name && p.name.toLowerCase() !== (playerProfile.name || '').toLowerCase());
        
        const finalOpponents = opponentPlayers.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name);

        const updatedMatch: Match = {
            ...match,
            result,
            myGoals,
            myAssists,
            date,
            goalDifference: finalGoalDiff,
            notes,
            tournament: tournament.trim(),
            myTeamPlayers: finalTeammates,
            opponentPlayers: finalOpponents,
        };

        onSave(updatedMatch);
    };

    // Helper functions for players
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
    const isPlayerVerified = (name: string) => !!playerProfile.playerMappings?.[name];

    const renderPlayerInputs = (players: PlayerPerformance[], setPlayers: any, label: string) => (
        <div style={{marginBottom: theme.spacing.medium}}>
            <label style={styles.label}>{label}</label>
            <div style={{display: 'flex', flexDirection: 'column', gap: theme.spacing.small}}>
                {players.map((player, index) => (
                    <div key={index} style={{display: 'flex', gap: theme.spacing.small, alignItems: 'center'}}>
                        <div style={{flex: 1}}>
                            <PlayerInput value={player.name || ''} onChange={(val) => updatePlayerList(players, setPlayers, index, 'name', val)} onTagUser={(name, uid) => updatePlayerList(players, setPlayers, index, 'name', name, { name, uid })} suggestions={allPlayers} placeholder="Nombre o @usuario" isVerified={isPlayerVerified(player.name || '')} />
                        </div>
                        <StatControlButton value={player.goals} onChange={(v) => updatePlayerList(players, setPlayers, index, 'goals', v)} icon="⚽️" color={theme.colors.win} />
                        <StatControlButton value={player.assists} onChange={(v) => updatePlayerList(players, setPlayers, index, 'assists', v)} icon="👟" color={theme.colors.accent2} />
                        <button type="button" onClick={() => removePlayer(setPlayers, index)} style={{background: 'none', border: 'none', color: theme.colors.loss, cursor: 'pointer', padding: '0 4px', fontSize: '1.2rem', height: '30px', width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>×</button>
                    </div>
                ))}
                <button type="button" onClick={() => addPlayer(setPlayers)} style={styles.addPlayerButton}>+ Añadir Jugador</button>
            </div>
        </div>
    );

    const styles: { [key: string]: React.CSSProperties } = {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: theme.spacing.medium },
        modal: { backgroundColor: theme.colors.surface, width: '100%', maxWidth: '600px', maxHeight: '90vh', borderRadius: theme.borderRadius.large, display: 'flex', flexDirection: 'column', border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows.large, animation: 'scaleUp 0.3s ease' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.large, borderBottom: `1px solid ${theme.colors.border}` },
        title: { fontSize: '1.2rem', fontWeight: 700, margin: 0, color: theme.colors.primaryText },
        content: { padding: theme.spacing.large, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
        footer: { padding: theme.spacing.large, borderTop: `1px solid ${theme.colors.border}`, display: 'flex', gap: theme.spacing.medium, justifyContent: 'flex-end' },
        label: { fontSize: '0.8rem', color: theme.colors.secondaryText, fontWeight: 600, marginBottom: '0.25rem', display: 'block' },
        fieldGroup: { display: 'flex', flexDirection: 'column' },
        gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium, alignItems: 'flex-end' },
        stepper: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, padding: `0 ${theme.spacing.small}`, height: '42px' },
        stepperButton: { background: 'none', border: 'none', color: theme.colors.primaryText, fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' },
        stepperValue: { fontSize: '1.1rem', fontWeight: 600, color: theme.colors.primaryText },
        radioGroup: { display: 'flex', borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.borderStrong}`, overflow: 'hidden', height: '42px' },
        radioLabel: { flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' },
        textArea: { width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium, boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '80px' },
        addPlayerButton: { background: 'none', border: `1px dashed ${theme.colors.border}`, color: theme.colors.accent2, padding: theme.spacing.small, borderRadius: theme.borderRadius.medium, cursor: 'pointer', fontSize: '0.8rem', width: '100%' },
        button: { padding: '0.8rem 1.5rem', borderRadius: theme.borderRadius.medium, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', border: 'none' },
        saveButton: { backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent },
        cancelButton: { backgroundColor: 'transparent', border: `1px solid ${theme.colors.borderStrong}`, color: theme.colors.secondaryText },
        error: { color: theme.colors.loss, textAlign: 'center', fontSize: '0.9rem', marginBottom: theme.spacing.medium }
    };

    const getResultRadioStyle = (option: 'VICTORIA' | 'EMPATE' | 'DERROTA'): React.CSSProperties => {
        if (result !== option) return { backgroundColor: 'transparent', color: theme.colors.secondaryText };
        switch (option) {
            case 'VICTORIA': return { backgroundColor: theme.colors.win, color: theme.colors.textOnAccent };
            case 'EMPATE': return { backgroundColor: theme.colors.draw, color: theme.colors.textOnAccent };
            case 'DERROTA': return { backgroundColor: theme.colors.loss, color: theme.colors.textOnAccent };
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div style={styles.backdrop} onClick={onClose}>
            <style>{`@keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Editar Partido</h2>
                    <button onClick={onClose} style={{background: 'none', border: 'none', cursor: 'pointer'}}><CloseIcon color={theme.colors.primaryText}/></button>
                </div>
                <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1}}>
                    <div style={styles.content}>
                        {error && <p style={styles.error}>{error}</p>}
                        
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Fecha</label>
                            <CustomDateInput value={date} onChange={setDate} />
                        </div>

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Resultado</label>
                            <div style={styles.radioGroup}>
                                {(['VICTORIA', 'EMPATE', 'DERROTA'] as const).map((option) => (
                                    <label key={option} style={{...styles.radioLabel, ...getResultRadioStyle(option)}}>
                                        <input type="radio" name="result_edit" value={option} checked={result === option} onChange={() => setResult(option)} style={{display: 'none'}} />
                                        {resultAbbreviations[option]}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={styles.gridContainer}>
                            <div style={styles.fieldGroup}><label style={styles.label}>Goles</label><div style={styles.stepper}><button type="button" onClick={() => setMyGoals(g => Math.max(0, g - 1))} style={styles.stepperButton}>-</button><span style={styles.stepperValue}>{myGoals}</span><button type="button" onClick={() => setMyGoals(g => g + 1)} style={styles.stepperButton}>+</button></div></div>
                            <div style={styles.fieldGroup}><label style={styles.label}>Asistencias</label><div style={styles.stepper}><button type="button" onClick={() => setMyAssists(a => Math.max(0, a - 1))} style={styles.stepperButton}>-</button><span style={styles.stepperValue}>{myAssists}</span><button type="button" onClick={() => setMyAssists(a => a + 1)} style={styles.stepperButton}>+</button></div></div>
                        </div>

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Diferencia de Gol</label>
                            <div style={styles.stepper}>
                                <button type="button" onClick={() => handleGoalDifferenceChange(-1)} style={styles.stepperButton} disabled={result === 'EMPATE'}>-</button>
                                <span style={styles.stepperValue}>{result === 'EMPATE' ? 0 : goalDifference}</span>
                                <button type="button" onClick={() => handleGoalDifferenceChange(1)} style={styles.stepperButton} disabled={result === 'EMPATE'}>+</button>
                            </div>
                        </div>

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Torneo</label>
                            <AutocompleteInput value={tournament} onChange={setTournament} suggestions={availableTournaments} placeholder="Ej: Liga de los Martes" />
                        </div>

                        {renderPlayerInputs(myTeamPlayers, setMyTeamPlayers, "Compañeros")}
                        {renderPlayerInputs(opponentPlayers, setOpponentPlayers, "Rivales")}

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Notas</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} style={styles.textArea} placeholder="Detalles del partido..." />
                        </div>
                    </div>
                    <div style={styles.footer}>
                        <button type="button" onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Cancelar</button>
                        <button type="submit" style={{...styles.button, ...styles.saveButton}}>Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default EditMatchModal;
