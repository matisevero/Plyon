
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { getGlobalRanking, getFriendsRanking, searchUsers, sendFriendRequest, respondToFriendRequest, removeFriend, getFriendsList, generateInvitationCode, getMatchesForUser, savePlayerMapping, getSocialFeed, deleteActivity, updateActivity, getFriendSuggestions, toggleReaction, getMatchesForUsers } from '../services/firebaseService';
import type { PublicProfile, RankingUser, FriendRequest, Match, PlayerMorale, SocialActivity } from '../types';
import LoginModal from '../components/modals/LoginModal';
import { ShareIcon } from '../components/icons/ShareIcon';
import ShareInvitationModal from '../components/modals/ShareInvitationModal';
import FriendProfileModal from '../components/modals/FriendProfileModal';
import { LinkIcon } from '../components/icons/LinkIcon';
import Card from '../components/common/Card';
import { Loader } from '../components/Loader';
import AutocompleteInput from '../components/AutocompleteInput';
import { parseLocalDate, calculatePlayerMorale, calculateMatchCareerPoints, inferMatchMode } from '../utils/analytics';
import SegmentedControl from '../components/common/SegmentedControl';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { BrainIcon } from '../components/icons/BrainIcon';
import { StarIcon } from '../components/icons/StarIcon';
import MomentPreviewCard from '../components/social/MomentPreviewCard';
import ShareMomentModal from '../components/modals/ShareMomentModal';
import { useTutorial } from '../hooks/useTutorial';
import { UsersIcon } from '../components/icons/UsersIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import TutorialModal from '../components/modals/TutorialModal';
import { InfoIcon } from '../components/icons/InfoIcon';
import { ChevronIcon } from '../components/icons/ChevronIcon';
import { MessageIcon } from '../components/icons/MessageIcon';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import ChatModal from '../components/modals/ChatModal';
import { AwardIcon } from '../components/icons/AwardIcon';
import { usePlayerStats } from '../hooks/usePlayerStats';
import PlyrStatusComposer from '../components/social/PlyrStatusComposer';
import { GlobeIcon } from '../components/icons/GlobeIcon';
import { ThreeDotsIcon } from '../components/icons/ThreeDotsIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import InfoTooltip from '../components/common/InfoTooltip';
import SectionHelp from '../components/common/SectionHelp';
import { CheckIcon } from '../components/icons/CheckIcon';
import Skeleton from '../components/common/Skeleton';
import RankingsSkeleton from '../components/skeletons/RankingsSkeleton';
import { useHaptics } from '../hooks/useHaptics';

export interface ShareableMoment { type: 'match' | 'achievement' | 'match_mvp' | 'last_match' | 'recent_form' | 'monthly_summary' | 'morale' | 'yearly_summary' | 'plyr_card' | 'season_recap'; title: string; date: string; data: any; icon: React.ReactNode; }
interface ExtendedRankingUser extends RankingUser { rankChange?: 'up' | 'down' | 'same' | 'new'; breakdown?: { regular: number; qualifiers: number; worldCup: number; }; }

// ... Helper Components ...
const EditIcon = ({ size = 16, color = 'currentColor' }: { size?: number, color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);

const VeracityBadge: React.FC<{ reputation?: PublicProfile['reputation'] }> = ({ reputation }) => {
    const { theme } = useTheme();
    if (!reputation || reputation.totalValidations < 3) return null;
    const score = (reputation.perfectValidations / reputation.totalValidations) * 100;
    let color = theme.colors.secondaryText;
    let label = '';
    let icon = null;
    if (score >= 90) { color = theme.colors.accent2; label = 'Verificado'; icon = <CheckIcon size={12} color="#fff" />; } 
    else if (score >= 70) { color = theme.colors.win; label = 'Fiable'; } 
    else { return null; }
    return ( <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: color, color: '#fff', padding: '2px 6px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700, marginLeft: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title={`Índice de Veracidad: ${score.toFixed(0)}%`}> {icon} <span>{label}</span> </div> );
};

const REACTION_EMOJIS = ['⚽️', '🔥', '🏆', '🧤', '👏', '😂'];

const ActivityFeedItem: React.FC<{ activity: SocialActivity; onClickUser: (uid: string) => void; onDelete?: (id: string) => void }> = ({ activity, onClickUser, onDelete }) => {
    const { theme } = useTheme(); const { user } = useAuth(); const haptics = useHaptics(); const [isMenuOpen, setIsMenuOpen] = useState(false); const [isEditing, setIsEditing] = useState(false); const [editContent, setEditContent] = useState(activity.description || ''); const [isSaving, setIsSaving] = useState(false); const [showReactionPicker, setShowReactionPicker] = useState(false); const menuRef = useRef<HTMLDivElement>(null); const reactionPickerRef = useRef<HTMLDivElement>(null);
    const isMyPost = user?.uid === activity.userId; const isPostType = activity.type === 'post';
    useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) { setIsMenuOpen(false); } if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) { setShowReactionPicker(false); } }; if (isMenuOpen || showReactionPicker) { document.addEventListener('mousedown', handleClickOutside); } return () => document.removeEventListener('mousedown', handleClickOutside); }, [isMenuOpen, showReactionPicker]);
    const handleDeleteClick = () => { if (onDelete) { onDelete(activity.id); } setIsMenuOpen(false); };
    const handleUpdate = async () => { if (!editContent.trim()) return; setIsSaving(true); try { await updateActivity(activity.id, { description: editContent }); setIsEditing(false); } catch (error) { console.error("Error updating activity:", error); alert("No se pudo guardar la edición."); } finally { setIsSaving(false); } };
    const handleReaction = async (emoji: string) => { 
        if (!user) return; 
        haptics.light(); // Haptic Feedback
        setShowReactionPicker(false); 
        try { await toggleReaction(activity.id, user.uid, emoji); } catch (e) { console.error(e); } 
    };
    const timeAgo = (date: string) => { const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000); let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + " años"; interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + " meses"; interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + " días"; interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + " horas"; interval = seconds / 60; if (interval > 1) return Math.floor(interval) + " min"; return "ahora"; };
    const getIcon = () => { if (activity.type === 'post' && activity.metadata?.moodIcon) return activity.metadata.moodIcon; switch(activity.type) { case 'match': return '⚽️'; case 'achievement': return '🎖️'; case 'campaign_milestone': return '🏆'; case 'streak': return '🔥'; default: return '📢'; } };
    const styles: { [key: string]: React.CSSProperties } = { menuButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: theme.colors.secondaryText, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }, dropdown: { position: 'absolute', top: '100%', right: 0, backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.medium, boxShadow: theme.shadows.medium, zIndex: 10, overflow: 'hidden', minWidth: '120px' }, menuItem: { padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', color: theme.colors.primaryText, display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' }, textArea: { width: '100%', padding: '8px', borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.accent2}`, backgroundColor: theme.colors.background, color: theme.colors.primaryText, fontFamily: theme.typography.fontFamily, fontSize: '0.9rem', resize: 'vertical', minHeight: '60px', marginTop: '8px' }, editActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }, saveBtn: { padding: '4px 12px', borderRadius: '4px', border: 'none', backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent, fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }, cancelBtn: { padding: '4px 12px', borderRadius: '4px', border: `1px solid ${theme.colors.borderStrong}`, backgroundColor: 'transparent', color: theme.colors.secondaryText, fontSize: '0.8rem', cursor: 'pointer' }, reactionsContainer: { display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }, reactionPill: { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', cursor: 'pointer', border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.background, transition: 'all 0.2s' }, activeReactionPill: { backgroundColor: `${theme.colors.accent1}20`, borderColor: theme.colors.accent1, color: theme.colors.accent1 }, addReactionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '4px', opacity: 0.6, transition: 'opacity 0.2s' }, reactionPicker: { position: 'absolute', bottom: '100%', left: '0', backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: '24px', padding: '8px', display: 'flex', gap: '8px', boxShadow: theme.shadows.medium, zIndex: 20 }, pickerEmoji: { fontSize: '1.5rem', cursor: 'pointer', transition: 'transform 0.1s', background: 'none', border: 'none', padding: 0 } };
    const reactions = (activity.metadata?.reactions || {}) as Record<string, string[]>; const myReactionEmoji = user ? Object.keys(reactions).find(emoji => reactions[emoji].includes(user.uid)) : null;
    return ( <div style={{ display: 'flex', gap: theme.spacing.medium, padding: theme.spacing.medium, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.border}`, marginBottom: theme.spacing.small, animation: 'fadeInUp 0.4s ease-out forwards', position: 'relative' }}> <img src={activity.userPhoto || `https://ui-avatars.com/api/?name=${activity.userName}&background=random`} alt={activity.userName} style={{ width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', objectFit: 'cover' }} onClick={() => onClickUser(activity.userId)} /> <div style={{ flex: 1 }}> <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}> <span style={{ fontWeight: 'bold', color: theme.colors.primaryText, cursor: 'pointer' }} onClick={() => onClickUser(activity.userId)}> {activity.userName} </span> <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}> <span style={{ fontSize: '0.7rem', color: theme.colors.secondaryText }}>{timeAgo(activity.timestamp)}</span> {isMyPost && ( <div style={{position: 'relative'}} ref={menuRef}> <button style={styles.menuButton} onClick={() => setIsMenuOpen(!isMenuOpen)}> <ThreeDotsIcon size={16} /> </button> {isMenuOpen && ( <div style={styles.dropdown}> {isPostType && ( <div style={styles.menuItem} onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.background} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} > <EditIcon size={14} /> Editar </div> )} <div style={{...styles.menuItem, color: theme.colors.loss}} onClick={handleDeleteClick} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.background} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} > <TrashIcon size={14} /> Eliminar </div> </div> )} </div> )} </div> </div> <div style={{ marginTop: '4px' }}> <div style={{ fontWeight: 700, fontSize: isPostType ? '0.85rem' : '0.9rem', color: isPostType ? theme.colors.secondaryText : theme.colors.accent1, display: 'flex', alignItems: 'center', gap: '5px' }}> <span>{getIcon()}</span> {activity.title} {isPostType && activity.metadata?.location && ( <span style={{fontWeight: 400, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px', color: theme.colors.secondaryText}}> • <GlobeIcon size={12} /> {activity.metadata.location} </span> )} </div> {isEditing ? ( <div> <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} style={styles.textArea} autoFocus /> <div style={styles.editActions}> <button onClick={() => setIsEditing(false)} style={styles.cancelBtn}>Cancelar</button> <button onClick={handleUpdate} disabled={isSaving} style={styles.saveBtn}> {isSaving ? <Loader /> : 'Guardar'} </button> </div> </div> ) : ( activity.description && ( <p style={{ margin: '6px 0 0 0', fontSize: isPostType ? '1rem' : '0.85rem', color: theme.colors.primaryText, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}> {activity.description} </p> ) )} {isPostType && activity.metadata?.image && ( <div style={{marginTop: '10px'}}> <img src={activity.metadata.image} alt="Post content" style={{ width: '100%', borderRadius: theme.borderRadius.medium, maxHeight: '400px', objectFit: 'cover', border: `1px solid ${theme.colors.border}` }} /> </div> )} {isPostType && activity.metadata?.videoUrl && ( <div style={{marginTop: '10px', padding: '10px', backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.border}`}}> <a href={activity.metadata.videoUrl} target="_blank" rel="noreferrer" style={{display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: theme.colors.accent2, fontWeight: 600}}> <LinkIcon size={16} /> Ver video enlazado </a> </div> )} <div style={styles.reactionsContainer}> {Object.entries(reactions).map(([emoji, userIds]) => { const count = userIds.length; const isActive = myReactionEmoji === emoji; return ( <button key={emoji} style={{ ...styles.reactionPill, ...(isActive ? styles.activeReactionPill : {}) }} onClick={() => handleReaction(emoji)} > <style>{`
        @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
    `}</style> <span style={{animation: isActive ? 'pop 0.3s ease-out' : 'none'}}>{emoji}</span> {count > 0 && <span style={{fontWeight: 'bold', fontSize: '0.75rem'}}>{count}</span>} </button> ); })} <div style={{position: 'relative'}}> <button style={styles.addReactionBtn} onClick={() => setShowReactionPicker(!showReactionPicker)} title="Añadir reacción" > ☺︎ </button> {showReactionPicker && ( <div style={styles.reactionPicker} ref={reactionPickerRef}> {REACTION_EMOJIS.map(emoji => ( <button key={emoji} style={styles.pickerEmoji} onClick={() => handleReaction(emoji)} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} > {emoji} </button> ))} </div> )} </div> </div> </div> </div> </div> );
};

const FeedSkeleton: React.FC = () => {
    const { theme } = useTheme();
    return ( <div style={{ display: 'flex', gap: theme.spacing.medium, padding: theme.spacing.medium, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.border}`, marginBottom: theme.spacing.small, }}> <Skeleton width="45px" height="45px" variant="circle" /> <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}> <div style={{display: 'flex', justifyContent: 'space-between'}}> <Skeleton width="120px" height="15px" /> <Skeleton width="40px" height="12px" /> </div> <Skeleton width="80%" height="18px" /> <Skeleton width="100%" height="60px" style={{marginTop: '4px'}} /> </div> </div> );
};

const FeedView: React.FC = () => {
    const { theme } = useTheme(); const { playerProfile } = useData(); const [activities, setActivities] = useState<SocialActivity[]>([]); const [loading, setLoading] = useState(true); const [selectedFriend, setSelectedFriend] = useState<PublicProfile | null>(null); const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
    useEffect(() => { setLoading(true); const unsubscribe = getSocialFeed(playerProfile.friends || [], '', (data) => { setActivities(data); setLoading(false); }); return () => unsubscribe(); }, [playerProfile.friends]);
    const handleUserClick = async (uid: string) => { const profiles = await getFriendsList([uid]); if (profiles.length > 0) setSelectedFriend(profiles[0]); };
    const handleDeleteActivity = async () => { if (activityToDelete) { try { await deleteActivity(activityToDelete); } catch (error) { console.error("Error deleting activity:", error); alert("No se pudo eliminar la publicación. Verifica tu conexión o intenta más tarde."); throw error; } } };
    if (loading) { return ( <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}> <PlyrStatusComposer /> <h4 style={{ color: theme.colors.secondaryText, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>Muro de Actividad</h4> {[1, 2, 3].map(i => <FeedSkeleton key={i} />)} </div> ); }
    return ( <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}> {selectedFriend && <FriendProfileModal isOpen={!!selectedFriend} onClose={() => setSelectedFriend(null)} friend={selectedFriend} />} <PlyrStatusComposer /> <h4 style={{ color: theme.colors.secondaryText, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>Muro de Actividad</h4> {activities.length === 0 ? ( <Card style={{ textAlign: 'center', padding: '3rem' }}> <p style={{ color: theme.colors.secondaryText, fontStyle: 'italic' }}>El muro está tranquilo... ¡Sé el primero en publicar algo!</p> </Card> ) : ( activities.map(act => ( <ActivityFeedItem key={act.id} activity={act} onClickUser={handleUserClick} onDelete={(id) => setActivityToDelete(id)} /> )) )} <ConfirmationModal isOpen={!!activityToDelete} onClose={() => setActivityToDelete(null)} onConfirm={handleDeleteActivity} title="Eliminar Publicación" message="¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer." /> </div> );
};

const UserListItem: React.FC<{ user: ExtendedRankingUser | RankingUser; action?: React.ReactNode; rank?: number; points?: number; onClick?: () => void; isExpanded?: boolean; onToggleExpand?: () => void; isMe?: boolean; }> = ({ user, action, rank, points, onClick, isExpanded, onToggleExpand, isMe }) => {
    const { theme } = useTheme();
    const getRankStyle = (r: number) => { if (r === 1) return { color: '#FFD700', fontSize: '1.2rem' }; if (r === 2) return { color: '#C0C0C0', fontSize: '1.1rem' }; if (r === 3) return { color: '#CD7F32', fontSize: '1.1rem' }; return { color: theme.colors.secondaryText, fontSize: '0.9rem' }; };
    
    return ( 
        <div style={{ marginBottom: theme.spacing.small }}> 
            <div onClick={onToggleExpand || onClick} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.medium, padding: theme.spacing.medium, backgroundColor: theme.colors.surface, borderRadius: isExpanded ? `${theme.borderRadius.medium} ${theme.borderRadius.medium} 0 0` : theme.borderRadius.medium, border: `1px solid ${isMe ? theme.colors.accent1 : theme.colors.border}`, cursor: 'pointer', transition: 'transform 0.1s', boxShadow: isMe ? `0 0 10px ${theme.colors.accent1}30` : 'none' }} > 
                {rank ? ( <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px' }}> <div style={{ fontWeight: 'bold', textAlign: 'center', ...getRankStyle(rank) }}>{rank}</div> </div> ) : <div style={{width: '28px'}} />} 
                <img src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /> 
                <div style={{ flex: 1 }}> 
                    <div style={{ fontWeight: 'bold', color: theme.colors.primaryText, display: 'flex', alignItems: 'center' }}> 
                        {user.name} 
                        {isMe && <span style={{fontSize: '0.7rem', color: theme.colors.accent1, marginLeft: '4px'}}>(Tú)</span>} 
                        <VeracityBadge reputation={user.reputation} />
                    </div> 
                    {points !== undefined && ( <div style={{ fontSize: '0.8rem', color: theme.colors.secondaryText }}>{points} pts</div> )} 
                </div> 
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.small }}> {action} {onToggleExpand && <ChevronIcon isExpanded={!!isExpanded} />} </div> 
            </div> 
            {isExpanded && ( <div style={{ padding: theme.spacing.medium, backgroundColor: theme.colors.background, border: `1px solid ${isMe ? theme.colors.accent1 : theme.colors.border}`, borderTop: 'none', borderRadius: `0 0 ${theme.borderRadius.medium} ${theme.borderRadius.medium}`, display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeInDown 0.2s ease-out' }}> <div style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.colors.secondaryText, textTransform: 'uppercase', marginBottom: '4px' }}> {isMe ? 'Desglose de Puntos:' : 'Resumen de Carrera:'} </div> {('breakdown' in user && user.breakdown) ? ( <> <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}> <span>🏟️ Amistosos / Regular:</span> <span style={{ fontWeight: 'bold' }}>{user.breakdown.regular}</span> </div> <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}> <span>🌎 Eliminatorias:</span> <span style={{ fontWeight: 'bold', color: theme.colors.accent2 }}>{user.breakdown.qualifiers}</span> </div> <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}> <span>🏆 Mundial:</span> <span style={{ fontWeight: 'bold', color: theme.colors.accent1 }}>{user.breakdown.worldCup}</span> </div> </> ) : ( <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}> <span>🎖️ Puntos Totales de Carrera:</span> <span style={{ fontWeight: 'bold' }}>{user.careerPoints || 0}</span> </div> )} {!isMe && ( <p style={{fontSize: '0.7rem', color: theme.colors.secondaryText, fontStyle: 'italic', margin: '4px 0 0 0'}}> * Solo puedes ver el desglose detallado de tus propios puntos o de amigos agregados. </p> )} <button onClick={(e) => { e.stopPropagation(); onClick?.(); }} style={{ marginTop: '8px', background: 'transparent', border: `1px solid ${theme.colors.borderStrong}`, color: theme.colors.primaryText, padding: '4px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }} > Ver Perfil Completo </button> </div> )} 
        </div> 
    );
};

const FriendsView: React.FC<{ onChatOpen: (friend: PublicProfile) => void }> = ({ onChatOpen }) => {
    // ... [Copy FriendsView Logic] ...
    const { theme } = useTheme(); const { user } = useAuth(); const { playerProfile, updatePlayerProfile, matches, friendRequests } = useData(); const [searchQuery, setSearchQuery] = useState(''); const [searchResults, setSearchResults] = useState<PublicProfile[]>([]); const [friends, setFriends] = useState<PublicProfile[]>([]); const [isSearching, setIsSearching] = useState(false); const [loadingFriends, setLoadingFriends] = useState(false); const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); const [inviteLink, setInviteLink] = useState(''); const [isGeneratingLink, setIsGeneratingLink] = useState(false); const [isShareModalOpen, setIsShareModalOpen] = useState(false); const [selectedFriend, setSelectedFriend] = useState<PublicProfile | null>(null); const [showLinkInput, setShowLinkInput] = useState<string | null>(null); const [linkName, setLinkName] = useState(''); const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<PublicProfile[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const allPlayers = useMemo(() => { const players = new Set<string>(); matches.forEach(match => { match.myTeamPlayers?.forEach(p => { if (p && p.name.trim() && p.name.toLowerCase() !== (playerProfile.name || '').toLowerCase()) { players.add(p.name.trim()); } }); match.opponentPlayers?.forEach(p => { if (p && p.name.trim()) { players.add(p.name.trim()); } }); }); return Array.from(players).sort(); }, [matches, playerProfile.name]);
    useEffect(() => { if (user) { setLoadingFriends(true); const loadData = async () => { const fetchedFriends = await getFriendsList(playerProfile.friends || []); setFriends(fetchedFriends); setLoadingFriends(false); if ((playerProfile.friends && playerProfile.friends.length > 0) || (playerProfile.playerMappings && Object.keys(playerProfile.playerMappings).length > 0)) { setLoadingSuggestions(true); const suggestedProfiles = await getFriendSuggestions(user.uid, playerProfile.friends || [], playerProfile.playerMappings); setSuggestions(suggestedProfiles); setLoadingSuggestions(false); } }; loadData(); } }, [user, playerProfile.friends, playerProfile.playerMappings]);
    const handleSearch = async (term: string) => { setSearchQuery(term); if (term.length > 2 && user) { setIsSearching(true); const results = await searchUsers(term, user.uid); setSearchResults(results.filter(r => !playerProfile.friends?.includes(r.uid))); setIsSearching(false); } else { setSearchResults([]); } }; const handleSendRequest = async (targetUser: PublicProfile) => { if (!user) return; setPendingRequestId(targetUser.uid); try { const result = await sendFriendRequest(user.uid, targetUser.uid, playerProfile.name); if (result.success) { alert(result.message || `Solicitud enviada a ${targetUser.name}`); setSearchResults(prev => prev.filter(p => p.uid !== targetUser.uid)); setSuggestions(prev => prev.filter(p => p.uid !== targetUser.uid)); } } catch (e: any) { console.error(e); alert(`Error: ${e.message || "No se pudo enviar la solicitud"}`); } finally { setPendingRequestId(null); } }; const handleResponse = async (req: FriendRequest, action: 'accept' | 'reject') => { try { await respondToFriendRequest(req.id, action); if (action === 'accept') { const newFriendsList = [...(playerProfile.friends || []), req.from]; updatePlayerProfile({ friends: newFriendsList }); } } catch (e: any) { console.error(e); alert("Error al procesar la solicitud. Intenta de nuevo."); } }; const handleShareInvite = async () => { if (!user) return; setIsGeneratingLink(true); try { let link = inviteLink; if (!link) { const code = await generateInvitationCode(user.uid, playerProfile.name || 'Un amigo'); link = `${window.location.origin}/?invite=${code}`; setInviteLink(link); } setIsShareModalOpen(true); } catch (e: any) { console.error(e); alert("Error al generar enlace de invitación"); } finally { setIsGeneratingLink(false); } }; const handleSaveMapping = async (friendId: string) => { if (!user || !linkName.trim()) return; try { await savePlayerMapping(user.uid, linkName.trim(), friendId); updatePlayerProfile({ playerMappings: { ...playerProfile.playerMappings, [linkName.trim()]: friendId } }); setShowLinkInput(null); setLinkName(''); } catch (e) { console.error("Error linking player", e); alert("Error al vincular jugador"); } }; const handleRemoveFriend = async (friendId: string) => { if (!user) return; if (!confirm('¿Eliminar amigo de tu lista?')) return; try { await removeFriend(user.uid, friendId); const newFriendsList = (playerProfile.friends || []).filter(id => id !== friendId); updatePlayerProfile({ friends: newFriendsList }); setFriends(prev => prev.filter(f => f.uid !== friendId)); } catch (e) { console.error("Error removing friend", e); alert("Hubo un error al eliminar al amigo. Intenta de nuevo."); } };
    if (!user) { return ( <Card style={{textAlign: 'center', padding: '3rem'}}> <p>Inicia sesión para buscar amigos y ver tu lista.</p> <button onClick={() => setIsLoginModalOpen(true)} style={{ padding: '0.8rem 1.5rem', backgroundColor: theme.colors.accent1, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Iniciar Sesión</button> <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} /> </Card> ); }
    return ( <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.large }}> {selectedFriend && <FriendProfileModal isOpen={!!selectedFriend} onClose={() => setSelectedFriend(null)} friend={selectedFriend} />} <Card style={{ padding: theme.spacing.medium, backgroundColor: theme.colors.surface, border: `1px dashed ${theme.colors.accent2}` }}> <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}> <div> <h4 style={{ margin: 0, color: theme.colors.primaryText }}>Invita a un amigo</h4> <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: theme.colors.secondaryText }}>Envíale un enlace para conectar automáticamente.</p> </div> <button onClick={handleShareInvite} disabled={isGeneratingLink} style={{ background: theme.colors.accent2, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }} > {isGeneratingLink ? <Loader /> : <ShareIcon size={16} />} {inviteLink ? 'Ver Enlace' : 'Invitar'} </button> </div> </Card> <ShareInvitationModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} inviteLink={inviteLink} userName={playerProfile.name || 'Tu amigo'} /> <div style={{ position: 'relative' }}> <AutocompleteInput value={searchQuery} onChange={handleSearch} suggestions={[]} placeholder="Buscar nuevos amigos por nombre..." /> {isSearching && <div style={{position: 'absolute', right: 10, top: 12}}><Loader /></div>} </div> {searchResults.length > 0 && ( <div> <h4 style={{ color: theme.colors.secondaryText, marginBottom: theme.spacing.small }}>Resultados de búsqueda</h4> {searchResults.map(u => ( <div key={u.uid} style={{ marginBottom: theme.spacing.small }}> <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.medium, padding: theme.spacing.medium, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.border}`, }}> <img src={u.photo || `https://ui-avatars.com/api/?name=${u.name}&background=random`} alt={u.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /> <div style={{ flex: 1 }}> <div style={{ fontWeight: 'bold', color: theme.colors.primaryText }}>{u.name}</div> </div> <button onClick={() => handleSendRequest(u)} disabled={pendingRequestId === u.uid} style={{ background: theme.colors.accent1, color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', opacity: pendingRequestId === u.uid ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '5px' }} > {pendingRequestId === u.uid ? <Loader /> : 'Agregar'} </button> </div> </div> ))} </div> )} {friendRequests.length > 0 && ( <div> <h4 style={{ color: theme.colors.secondaryText, marginBottom: theme.spacing.small }}>Solicitudes pendientes</h4> {friendRequests.map(req => ( <div key={req.id} style={{ marginBottom: theme.spacing.small }}> <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.medium, padding: theme.spacing.medium, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.border}`, }}> <img src={req.senderProfile?.photo || `https://ui-avatars.com/api/?name=${req.senderProfile?.name}&background=random`} alt={req.senderProfile?.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /> <div style={{ flex: 1 }}> <div style={{ fontWeight: 'bold', color: theme.colors.primaryText }}>{req.senderProfile?.name}</div> </div> <div style={{ display: 'flex', gap: '8px' }}> <button onClick={() => handleResponse(req, 'accept')} style={{ background: theme.colors.win, color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>✓</button> <button onClick={() => handleResponse(req, 'reject')} style={{ background: theme.colors.loss, color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>✗</button> </div> </div> </div> ))} </div> )} {suggestions.length > 0 && ( <div style={{animation: 'fadeIn 0.5s ease'}}> <h4 style={{ color: theme.colors.secondaryText, marginBottom: theme.spacing.small, display: 'flex', justifyContent: 'space-between' }}> <span>Personas que quizás conozcas</span> {loadingSuggestions && <Loader />} </h4> <div style={{display: 'flex', gap: theme.spacing.medium, overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none'}}> {suggestions.map(u => ( <div key={u.uid} style={{ flex: '0 0 140px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: theme.spacing.medium, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.border}`, textAlign: 'center' }}> <img src={u.photo || `https://ui-avatars.com/api/?name=${u.name}&background=random`} alt={u.name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} /> <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: theme.colors.primaryText, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div> <button onClick={() => handleSendRequest(u)} disabled={pendingRequestId === u.uid} style={{ width: '100%', background: 'transparent', border: `1px solid ${theme.colors.accent1}`, color: theme.colors.accent1, borderRadius: '4px', padding: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }} > {pendingRequestId === u.uid ? <Loader /> : 'Agregar'} </button> </div> ))} </div> </div> )} <div> <h4 style={{ color: theme.colors.secondaryText, marginBottom: theme.spacing.small }}>Mis Amigos ({friends.length})</h4> {loadingFriends ? <Loader /> : friends.length === 0 ? ( <p style={{ fontStyle: 'italic', color: theme.colors.secondaryText }}>Aún no tienes amigos agregados.</p> ) : ( friends.map(f => ( <React.Fragment key={f.uid}> <div onClick={() => setSelectedFriend(f)} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.medium, padding: theme.spacing.medium, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.border}`, marginBottom: theme.spacing.small, cursor: 'pointer' }} > <img src={f.photo || `https://ui-avatars.com/api/?name=${f.name}&background=random`} alt={f.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /> <div style={{ flex: 1, minWidth: 0 }}> <div style={{ fontWeight: 'bold', color: theme.colors.primaryText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div> </div> <div style={{display: 'flex', gap: '8px', alignItems: 'center'}} onClick={e => e.stopPropagation()}> <button onClick={(e) => { e.stopPropagation(); onChatOpen(f); }} style={{ background: `${theme.colors.accent2}20`, border: `1px solid ${theme.colors.accent2}`, color: theme.colors.accent2, borderRadius: '4px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Chatear" > <MessageIcon size={16} /> </button> <button onClick={(e) => { e.stopPropagation(); setShowLinkInput(showLinkInput === f.uid ? null : f.uid); setLinkName(''); }} style={{ background: 'transparent', border: 'none', color: theme.colors.secondaryText, cursor: 'pointer', padding: '4px' }} title="Vincular a nombre de jugador" > <LinkIcon size={16} /> </button> <button onClick={(e) => { e.stopPropagation(); handleRemoveFriend(f.uid); }} style={{ background: 'transparent', color: theme.colors.loss, border: `1px solid ${theme.colors.loss}`, borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}> Eliminar </button> </div> </div> {showLinkInput === f.uid && ( <div style={{ display: 'flex', gap: '8px', padding: '8px', backgroundColor: theme.colors.background, marginBottom: '8px', marginTop: '-8px', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', border: `1px solid ${theme.colors.border}`, borderTop: 'none', alignItems: 'center' }}> <div style={{flex: 1}}> <AutocompleteInput value={linkName} onChange={setLinkName} suggestions={allPlayers} placeholder="Nombre en alineación (ej: Mati)" /> </div> <button onClick={() => handleSaveMapping(f.uid)} style={{backgroundColor: theme.colors.accent2, color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'}} > Vincular </button> </div> )} </React.Fragment> )) )} </div> </div> );
};

const RankingsView: React.FC = () => {
    const { theme } = useTheme(); 
    const { user } = useAuth(); 
    const { playerProfile, matches: localMatches } = useData(); 
    
    // States for filtering
    const [scope, setScope] = useState<'global' | 'friends'>('friends'); 
    
    // --- NEW FILTER LOGIC ---
    // Toggle: 'year' or 'month'
    const [filterType, setFilterType] = useState<'year' | 'month'>('year');
    // Dropdown Value: Holds '2025', '2024' OR '2025-01', '2024-12'
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    
    // Calculate available periods from Local Data + Current Date
    const availablePeriods = useMemo(() => {
        const years = new Set<string>();
        const months = new Set<string>(); // Format "YYYY-M" (e.g. 2025-0 for Jan)

        const today = new Date();
        years.add(today.getFullYear().toString());
        months.add(`${today.getFullYear()}-${today.getMonth()}`);

        localMatches.forEach(m => {
            const d = parseLocalDate(m.date);
            years.add(d.getFullYear().toString());
            months.add(`${d.getFullYear()}-${d.getMonth()}`);
        });

        const sortedYears = Array.from(years).sort((a, b) => Number(b) - Number(a));
        const sortedMonths = Array.from(months).sort((a, b) => {
            const [yA, mA] = a.split('-').map(Number);
            const [yB, mB] = b.split('-').map(Number);
            if (yA !== yB) return yB - yA;
            return mB - mA;
        });

        return { years: sortedYears, months: sortedMonths };
    }, [localMatches]);

    // Initialize/Reset selectedPeriod when filterType changes
    useEffect(() => {
        if (filterType === 'year') {
            if (availablePeriods.years.length > 0) setSelectedPeriod(availablePeriods.years[0]);
        } else {
            if (availablePeriods.months.length > 0) setSelectedPeriod(availablePeriods.months[0]);
        }
    }, [filterType, availablePeriods]);

    const [ranking, setRanking] = useState<ExtendedRankingUser[]>([]); 
    const [isLoading, setIsLoading] = useState(false); 
    const [selectedFriend, setSelectedFriend] = useState<PublicProfile | null>(null); 
    const [expandedUserUid, setExpandedUserUid] = useState<string | null>(null); 
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null); 
    const [hasMoreGlobal, setHasMoreGlobal] = useState(true); 
    const [isPaginating, setIsPaginating] = useState(false); 
    const [globalSearch, setGlobalSearch] = useState(''); 
    const [globalSearchResults, setGlobalSearchResults] = useState<ExtendedRankingUser[]>([]);

    // Helper to calculate points from a list of matches based on strict date filtering
    const calculatePointsFromMatches = (matchList: Match[]) => { 
        let total = 0; 
        const breakdown = { regular: 0, qualifiers: 0, worldCup: 0 }; 
        
        matchList.forEach(m => { 
            const pts = calculateMatchCareerPoints(m, playerProfile); 
            total += pts; 
            const mode = inferMatchMode(m, playerProfile); 
            if (mode === 'world-cup') { breakdown.worldCup += pts; } 
            else if (mode === 'qualifiers') { breakdown.qualifiers += pts; } 
            else { breakdown.regular += pts; } 
        }); 
        return { total, breakdown }; 
    };

    const loadRanking = async (isLoadMore = false) => { 
        if (!isLoadMore) { 
            setIsLoading(true); 
            setRanking([]); 
            setLastDoc(null); 
        } else { 
            setIsPaginating(true); 
        } 
        
        if (scope === 'global') { 
            // GLOBAL: Always use stored careerPoints (DB Source of Truth for Global)
            // Filtering by date is disabled for Global in MVP to avoid expensive backend queries
            const { users, lastDoc: newLastDoc } = await getGlobalRanking(50, isLoadMore ? lastDoc : null); 
            setLastDoc(newLastDoc); 
            setHasMoreGlobal(users.length === 50); 
            
            const usersWithProcessedData = users.map((u, i) => { 
                return { 
                    ...u, 
                    careerPoints: u.careerPoints ?? 0, 
                    stats: { totalMatches: 0, totalPoints: u.careerPoints || 0, winRate: 0 } 
                } as ExtendedRankingUser; 
            }); 
            
            const sortedGlobal = usersWithProcessedData.sort((a, b) => (b.careerPoints || 0) - (a.careerPoints || 0)); 
            const finalGlobalData = sortedGlobal.map((u, i) => ({ ...u, position: isLoadMore ? ranking.length + i + 1 : i + 1 })); 
            setRanking(prev => isLoadMore ? [...prev, ...finalGlobalData] : finalGlobalData); 
        } 
        else if (user && scope === 'friends') { 
            // FRIENDS: Dynamic calculation from matches based on filterType and selectedPeriod
            // 1. Get Friend Profiles
            const friendProfiles = await getFriendsRanking(user.uid, playerProfile.friends || []); 
            // Add self
            const selfProfile = { uid: user.uid, name: playerProfile.name, photo: playerProfile.photo, username: playerProfile.username, reputation: playerProfile.reputation } as RankingUser;
            const allProfiles = [selfProfile, ...friendProfiles.filter(f => f.uid !== user.uid)];

            // 2. Fetch Matches for ALL profiles in list
            // We'll fetch last 200 matches to ensure we cover the year/month requested
            const userIds = allProfiles.map(p => p.uid);
            const allMatchesMap = await getMatchesForUsers(userIds);

            // 3. Filter and Calculate Points based on selected Date
            const calculatedRankings = allProfiles.map(profile => {
                const userMatches = allMatchesMap[profile.uid] || [];
                
                // FILTERING LOGIC
                const filteredMatches = userMatches.filter(m => {
                    const d = parseLocalDate(m.date);
                    if (filterType === 'year') {
                        return d.getFullYear().toString() === selectedPeriod;
                    } else {
                        // Monthly Filter
                        const [targetYear, targetMonthIndex] = selectedPeriod.split('-').map(Number);
                        return d.getFullYear() === targetYear && d.getMonth() === targetMonthIndex;
                    }
                });

                // CALCULATING
                const { total, breakdown } = calculatePointsFromMatches(filteredMatches);
                
                return {
                    ...profile,
                    careerPoints: total,
                    breakdown
                } as ExtendedRankingUser;
            });
            
            // 4. Sort
            const sortedCurrent = calculatedRankings.sort((a, b) => b.careerPoints - a.careerPoints); 
            
            // 5. Assign Positions
            const finalData = sortedCurrent.map((p, i) => { 
                return { ...p, position: i + 1 }; 
            }); 
            
            setRanking(finalData); 
        } 
        
        setIsLoading(false); 
        setIsPaginating(false); 
    };

    useEffect(() => { loadRanking(); }, [scope, user, playerProfile.friends, localMatches.length, filterType, selectedPeriod]);

    const handleGlobalSearch = async (term: string) => { 
        setGlobalSearch(term); 
        if (term.length > 2 && user) { 
            setIsLoading(true); 
            const results = await searchUsers(term, user.uid); 
            setGlobalSearchResults(results.map(r => ({ ...r, careerPoints: r.careerPoints ?? 0, stats: { totalMatches: 0, totalPoints: r.careerPoints || 0, winRate: 0 } }) as ExtendedRankingUser)); 
            setIsLoading(false); 
        } else { 
            setGlobalSearchResults([]); 
        } 
    };

    const dropdownStyle: React.CSSProperties = {
        padding: '0.4rem 1.2rem 0.4rem 0.6rem',
        borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.borderStrong}`,
        backgroundColor: theme.colors.background,
        color: theme.colors.primaryText,
        fontSize: theme.typography.fontSize.small,
        fontWeight: 600,
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22${encodeURIComponent(theme.colors.secondaryText)}%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 6px center',
        width: '100%',
        minWidth: '150px'
    };

    const formatMonthLabel = (periodStr: string) => {
        const [year, monthIndex] = periodStr.split('-').map(Number);
        const date = new Date(year, monthIndex, 1);
        const monthName = date.toLocaleString('es-ES', { month: 'long' });
        return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
    };

    return ( 
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.large }}> 
            {selectedFriend && <FriendProfileModal isOpen={!!selectedFriend} onClose={() => setSelectedFriend(null)} friend={selectedFriend} />} 
            
            <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: theme.spacing.medium }}> 
                <SegmentedControl options={[{ label: 'Amigos 👥', value: 'friends' }, { label: 'Global 🌍', value: 'global' }]} selectedValue={scope} onSelect={(v) => { setScope(v as any); }} /> 
                
                {/* Date Filters - Visible only for Friends scope as it supports live calculation */}
                {scope === 'friends' && (
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                        {/* Toggle Year/Month */}
                        <div style={{flex: 1}}>
                            <SegmentedControl 
                                options={[{ label: 'Año', value: 'year' }, { label: 'Mes', value: 'month' }]}
                                selectedValue={filterType}
                                onSelect={(v) => setFilterType(v as any)}
                            />
                        </div>
                        
                        {/* Dropdown */}
                        <div style={{flex: 1.5}}>
                            <select 
                                value={selectedPeriod} 
                                onChange={(e) => setSelectedPeriod(e.target.value)} 
                                style={dropdownStyle}
                            >
                                {filterType === 'year' ? (
                                    availablePeriods.years.map(y => <option key={y} value={y}>{y}</option>)
                                ) : (
                                    availablePeriods.months.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)
                                )}
                            </select>
                        </div>
                    </div>
                )}
                
                {/* Global Search */}
                {scope === 'global' && ( 
                    <div style={{ position: 'relative' }}> 
                        <AutocompleteInput value={globalSearch} onChange={handleGlobalSearch} suggestions={[]} placeholder="Buscar jugador en el mundo..." /> 
                        <p style={{fontSize: '0.75rem', color: theme.colors.secondaryText, fontStyle: 'italic', marginTop: '4px', textAlign: 'center'}}>
                            * El ranking global muestra puntos acumulados totales.
                        </p>
                    </div> 
                )} 
            </div> 
            
            {isLoading && ranking.length === 0 ? <RankingsSkeleton /> : ( 
                <div> 
                    {scope === 'global' && globalSearch.length > 2 && globalSearchResults.length > 0 && ( 
                        <div style={{marginBottom: theme.spacing.large, borderBottom: `2px solid ${theme.colors.border}`, paddingBottom: theme.spacing.medium}}> 
                            <h4 style={{fontSize: '0.8rem', color: theme.colors.secondaryText, marginBottom: theme.spacing.small, textTransform: 'uppercase'}}>Resultados de búsqueda</h4> 
                            {globalSearchResults.map(u => ( 
                                <UserListItem key={u.uid} user={u} points={u.careerPoints} onClick={() => setSelectedFriend(u)} isExpanded={expandedUserUid === u.uid} onToggleExpand={() => setExpandedUserUid(expandedUserUid === u.uid ? null : u.uid)} isMe={u.uid === user?.uid} /> 
                            ))} 
                        </div> 
                    )} 
                    
                    {ranking.length === 0 ? ( 
                        <p style={{ textAlign: 'center', color: theme.colors.secondaryText }}>No hay datos disponibles para el período seleccionado.</p> 
                    ) : ( 
                        <> 
                            {ranking.map((u) => ( 
                                <UserListItem key={u.uid} user={u} rank={u.position} points={u.careerPoints} onClick={() => setSelectedFriend(u)} isExpanded={expandedUserUid === u.uid} onToggleExpand={() => setExpandedUserUid(expandedUserUid === u.uid ? null : u.uid)} isMe={u.uid === user?.uid} /> 
                            ))} 
                            
                            {scope === 'global' && hasMoreGlobal && ( 
                                <button onClick={() => loadRanking(true)} disabled={isPaginating} style={{ width: '100%', padding: '1rem', background: 'transparent', border: `1px dashed ${theme.colors.borderStrong}`, color: theme.colors.secondaryText, borderRadius: theme.borderRadius.medium, cursor: 'pointer', marginTop: theme.spacing.medium, fontWeight: 'bold', fontSize: '0.9rem' }} > 
                                    {isPaginating ? <Loader /> : 'Cargar más jugadores...'} 
                                </button> 
                            )} 
                        </> 
                    )} 
                </div> 
            )} 
        </div> 
    );
};

// ... MomentsView, SocialPage remain unchanged but included in full file output below
const MomentsView: React.FC = () => {
    // ... [Copy MomentsView Logic] ...
    const { theme } = useTheme(); 
    const { matches, playerProfile } = useData(); 
    const playerStats = usePlayerStats(matches);
    const [selectedMoment, setSelectedMoment] = useState<ShareableMoment | null>(null); 
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    
    useEffect(() => { const handleResize = () => setIsDesktop(window.innerWidth >= 768); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);
    
    const shareableMoments: ShareableMoment[] = useMemo(() => { 
        const moments: ShareableMoment[] = []; 
        if (matches.length < 3) return []; 
        const sortedMatches = [...matches].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()); 
        const currentYear = new Date().getFullYear(); 
        const lastMatch = sortedMatches[0]; 
        
        if (matches.length >= 5) {
            const wins = matches.filter(m => m.result === 'VICTORIA').length;
            const total = matches.length;
            const winRate = total > 0 ? (wins / total) * 100 : 0;
            const goals = matches.reduce((s, m) => s + m.myGoals, 0);
            const assists = matches.reduce((s, m) => s + m.myAssists, 0);
            
            // Calculate OVR (Overall)
            // Base 50 + WinRate * 0.3 + Level * 2
            // Cap at 99
            let ovr = 50 + (winRate * 0.3) + (playerStats.level * 2);
            if (ovr > 99) ovr = 99;
            
            moments.push({
                type: 'plyr_card',
                title: 'Mi Plyr Card',
                date: 'Actual',
                data: {
                    name: playerProfile.name,
                    photo: playerProfile.photo,
                    ovr: Math.round(ovr),
                    stats: {
                        PJ: total,
                        G: goals,
                        A: assists,
                        V: Math.round(winRate),
                        Nvl: playerStats.level,
                        Pts: playerProfile.careerPoints || 0
                    }
                },
                icon: <AwardIcon />, 
            });
        }

        if (lastMatch) { const resultIcons: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = { VICTORIA: '✅', EMPATE: '🤝', DERROTA: '❌' }; moments.push({ type: 'last_match', title: 'Último partido jugado', date: parseLocalDate(lastMatch.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), data: lastMatch, icon: <span style={{ fontSize: '1.5rem' }}>{resultIcons[lastMatch.result]}</span>, }); } 
        const recentFormMatches = sortedMatches.slice(0, 5); if (recentFormMatches.length === 5) { moments.push({ type: 'recent_form', title: 'Racha de últimos 5 partidos', date: 'Forma reciente', data: recentFormMatches.map(m => m.result), icon: <TrendingUpIcon />, }); } 
        if (sortedMatches.length > 0) { const lastMatchDate = parseLocalDate(sortedMatches[0].date); const lastActivityMonth = lastMatchDate.getMonth(); const lastActivityYear = lastMatchDate.getFullYear(); const lastMonthWithMatches = sortedMatches.filter(m => { const d = parseLocalDate(m.date); return d.getFullYear() === lastActivityYear && d.getMonth() === lastActivityMonth; }); if (lastMonthWithMatches.length > 0) { const wins = lastMonthWithMatches.filter(m => m.result === 'VICTORIA').length; const draws = lastMonthWithMatches.filter(m => m.result === 'EMPATE').length; const losses = lastMonthWithMatches.length - wins - draws; const goals = lastMonthWithMatches.reduce((sum, m) => sum + m.myGoals, 0); const assists = lastMonthWithMatches.reduce((sum, m) => sum + m.myAssists, 0); const monthName = new Date(lastActivityYear, lastActivityMonth).toLocaleString('es-ES', { month: 'long' }); moments.push({ type: 'monthly_summary', title: `Resumen de ${monthName}`, date: 'Estadísticas del mes', data: { monthName, matches: lastMonthWithMatches.length, wins, draws, losses, goals, assists }, icon: <CalendarIcon />, }); } } 
        const moraleData = calculatePlayerMorale(matches); if (moraleData) { moments.push({ type: 'morale', title: `Moral: ${moraleData.level}`, date: 'Análisis de rendimiento', data: moraleData, icon: <BrainIcon />, }); } 
        const recentWin = sortedMatches.find(m => m.result === 'VICTORIA' && (m.myGoals + m.myAssists >= 2)); if (recentWin) { moments.push({ type: 'match', title: 'Última gran victoria', date: parseLocalDate(recentWin.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), data: recentWin, icon: <StarIcon />, }); } 
        const currentYearMatches = sortedMatches.filter(m => parseLocalDate(m.date).getFullYear() === currentYear); if (currentYearMatches.length > 5) { const wins = currentYearMatches.filter(m => m.result === 'VICTORIA').length; const draws = currentYearMatches.filter(m => m.result === 'EMPATE').length; const losses = currentYearMatches.filter(m => m.result === 'DERROTA').length; const goals = currentYearMatches.reduce((sum, m) => sum + m.myGoals, 0); const assists = currentYearMatches.reduce((sum, m) => sum + m.myAssists, 0); const monthlyActivity = Array(12).fill(0).map(() => ({ wins: 0, losses: 0, draws: 0 })); currentYearMatches.forEach(m => { const month = parseLocalDate(m.date).getMonth(); if(m.result === 'VICTORIA') monthlyActivity[month].wins++; else if(m.result === 'DERROTA') monthlyActivity[month].losses++; else monthlyActivity[month].draws++; }); const momentumData = monthlyActivity.map(m => { const total = m.wins + m.draws + m.losses; if (total === 0) return 0; return ((m.wins * 3 + m.draws) / (total * 3)) * 10; }); moments.push({ type: 'yearly_summary', title: `Resumen Temporada ${currentYear}`, date: 'Anual', data: { year: currentYear, totalMatches: currentYearMatches.length, wins, draws, losses, goals, assists, monthlyActivity, momentumData, matches: currentYearMatches }, icon: <TrophyIcon />, }); } 
        return moments; 
    }, [matches, playerProfile, playerStats]);
    
    const gridStyle = { display: isDesktop ? 'grid' : 'flex', flexDirection: 'column' as 'column', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium, };
    return ( <div> <div style={gridStyle}> {matches.length < 3 ? ( <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}> <p style={{color: theme.colors.secondaryText, fontStyle: 'italic'}}>Registra al menos 3 partidos para generar momentos compartibles.</p> </Card> ) : ( shareableMoments.map((moment, index) => ( <MomentPreviewCard key={index} title={moment.title} icon={moment.icon} date={moment.date} onOpen={() => setSelectedMoment(moment)} /> )) )} </div> {selectedMoment && <ShareMomentModal moment={selectedMoment} onClose={() => setSelectedMoment(null)} />} </div> );
};

const SocialPage: React.FC = () => {
  const { theme } = useTheme(); 
  const { user } = useAuth();
  const { isShareMode } = useData();
  const [activeTab, setActiveTab] = useState<'feed' | 'moments' | 'rankings' | 'friends'>('feed'); 
  const [chatFriend, setChatFriend] = useState<PublicProfile | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const { isTutorialSeen, markTutorialAsSeen } = useTutorial('social'); 
  const [isTutorialOpen, setIsTutorialOpen] = useState(!isTutorialSeen && !isShareMode);
  
  useEffect(() => {
      if (isTutorialSeen) setIsTutorialOpen(false);
  }, [isTutorialSeen]);

  const tutorialSteps = [
    { title: 'Muro Social', content: 'Entérate de las hazañas de tus amigos y los últimos resultados en la comunidad en tiempo real.', icon: <UsersIcon size={48} />, },
    { title: 'Momentos de gloria', content: 'Genera tarjetas visuales automáticas de tus mejores rachas y récords, listas para compartir en tus redes sociales.', icon: <StarIcon size={48} />, },
    { title: 'Ranking Global', content: 'Mide tu nivel contra jugadores de todo el mundo. Cada gol y victoria te otorga puntos para escalar en la tabla.', icon: <TrophyIcon size={48} />, }
  ];

  const handleOpenChat = (friend?: PublicProfile) => {
      if (friend) setChatFriend(friend);
      else setChatFriend(null);
      setIsChatModalOpen(true);
  };

  const styles: { [key: string]: React.CSSProperties } = { 
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large, }, 
    pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent1}`, paddingLeft: theme.spacing.medium, display: 'flex', alignItems: 'center' }, 
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.medium },
    titleContainer: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium, }, 
    infoButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', }, 
    actionButton: { 
        background: 'transparent', 
        border: `1px solid ${theme.colors.borderStrong}`, 
        color: theme.colors.secondaryText, 
        padding: `${theme.spacing.small} ${theme.spacing.medium}`, 
        borderRadius: theme.borderRadius.medium, 
        cursor: 'pointer', 
        fontWeight: 600, 
        fontSize: theme.typography.fontSize.small, 
        transition: 'background-color 0.2s, color 0.2s, border 0.2s', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '5px' 
    },
    tabContainer: { 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: theme.spacing.medium, 
        overflowX: 'auto', 
        paddingBottom: '5px',
    }, 
    tabButton: { flex: 1, padding: '1rem', background: 'transparent', border: 'none', borderBottom: `2px solid transparent`, cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: theme.colors.secondaryText, transition: 'all 0.2s', whiteSpace: 'nowrap' }, 
    activeTab: { borderBottom: `2px solid ${theme.colors.accent1}`, color: theme.colors.primaryText, } 
  };
  
  return (
      <>
        <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        <TutorialModal isOpen={isTutorialOpen} onClose={(dontShowAgain) => { setIsTutorialOpen(false); if(dontShowAgain) markTutorialAsSeen(); }} steps={tutorialSteps} />
        <main style={styles.container}>
          <div style={styles.header}>
              <div style={styles.titleContainer}>
                <h2 style={{...styles.pageTitle, marginBottom: 0}}>
                    Comunidad
                    <SectionHelp steps={tutorialSteps} />
                </h2>
              </div>
              {user && (
                <button onClick={() => handleOpenChat()} style={styles.actionButton}>
                    <MessageIcon size={18} /> Mensajes
                </button>
              )}
          </div>
          <div style={styles.tabContainer} className="no-scrollbar">
              <button style={{...styles.tabButton, ...(activeTab === 'feed' ? styles.activeTab : {})}} onClick={() => setActiveTab('feed')}>Actividad</button>
              <button style={{...styles.tabButton, ...(activeTab === 'friends' ? styles.activeTab : {})}} onClick={() => setActiveTab('friends')}>Amigos</button>
              <button style={{...styles.tabButton, ...(activeTab === 'rankings' ? styles.activeTab : {})}} onClick={() => setActiveTab('rankings')}>Rankings</button>
              <button style={{...styles.tabButton, ...(activeTab === 'moments' ? styles.activeTab : {})}} onClick={() => setActiveTab('moments')}>Momentos</button>
          </div>
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {activeTab === 'feed' && <FeedView />}
            {activeTab === 'friends' && <FriendsView onChatOpen={handleOpenChat} />}
            {activeTab === 'rankings' && <RankingsView />}
            {activeTab === 'moments' && <MomentsView />}
          </div>
        </main>

        <ChatModal 
            isOpen={isChatModalOpen} 
            onClose={() => setIsChatModalOpen(false)} 
            initialFriend={chatFriend} 
        />
      </>
  );
};

export default SocialPage;
