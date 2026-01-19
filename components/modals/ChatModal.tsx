
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { getFriendsList } from '../../services/firebaseService';
import type { PublicProfile } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';
import { Loader } from '../Loader';
import ChatWindow from '../social/ChatWindow';
import ChatList from '../social/ChatList';
import Card from '../common/Card';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialFriend: PublicProfile | null;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, initialFriend }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { playerProfile } = useData();
    const [friends, setFriends] = useState<PublicProfile[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<PublicProfile | null>(initialFriend);
    const [loading, setLoading] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 992);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isOpen && user && playerProfile.friends) {
            setLoading(true);
            getFriendsList(playerProfile.friends).then(list => {
                setFriends(list);
                setLoading(false);
            });
            // Update selected friend if initialFriend changes while open
            setSelectedFriend(initialFriend);
        }
    }, [isOpen, user, playerProfile.friends, initialFriend]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const styles: { [key: string]: React.CSSProperties } = {
        backdrop: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
        },
        modal: {
            backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
            boxShadow: theme.shadows.large, width: '100%', maxWidth: '900px',
            height: '80vh', display: 'flex', flexDirection: 'column',
            animation: 'scaleUp 0.3s ease', border: `1px solid ${theme.colors.border}`,
            overflow: 'hidden'
        },
        header: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: `${theme.spacing.medium} ${theme.spacing.large}`,
            borderBottom: `1px solid ${theme.colors.border}`, flexShrink: 0,
            backgroundColor: theme.colors.background
        },
        title: { margin: 0, fontSize: '1.2rem', fontWeight: 700, color: theme.colors.primaryText },
        closeButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' },
        layout: {
            display: 'grid',
            gridTemplateColumns: isDesktop ? '300px 1fr' : '1fr',
            flex: 1,
            overflow: 'hidden'
        },
        sidebar: {
            borderRight: isDesktop ? `1px solid ${theme.colors.border}` : 'none',
            overflowY: 'auto',
            backgroundColor: theme.colors.background,
            padding: theme.spacing.medium
        },
        mainChat: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
        },
        mobileBack: {
            padding: theme.spacing.small,
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            color: theme.colors.accent2,
            fontWeight: 'bold',
            fontSize: '0.9rem'
        }
    };

    return createPortal(
        <div style={styles.backdrop} onClick={onClose}>
            <style>{`
                @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <header style={styles.header}>
                    <h2 style={styles.title}>Mis Mensajes</h2>
                    <button style={styles.closeButton} onClick={onClose}><CloseIcon color={theme.colors.primaryText} /></button>
                </header>
                
                <div style={styles.layout}>
                    {/* List Sidebar - Hidden on mobile if friend selected */}
                    {(!selectedFriend || isDesktop) && (
                        <div style={styles.sidebar}>
                            {loading ? <div style={{textAlign:'center', padding:'2rem'}}><Loader /></div> : (
                                <ChatList 
                                    friends={friends} 
                                    onSelectFriend={setSelectedFriend} 
                                    activeFriendId={selectedFriend?.uid} 
                                />
                            )}
                        </div>
                    )}

                    {/* Chat Area - Hidden on mobile if no friend selected */}
                    {(selectedFriend || isDesktop) && (
                        <div style={styles.mainChat}>
                            {!isDesktop && (
                                <div style={styles.mobileBack} onClick={() => setSelectedFriend(null)}>
                                    &larr; Volver a contactos
                                </div>
                            )}
                            {selectedFriend ? (
                                <ChatWindow friend={selectedFriend} />
                            ) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.secondaryText, textAlign: 'center', padding: '2rem' }}>
                                    <div style={{display:'flex', flexDirection:'column', gap:'1rem', alignItems:'center'}}>
                                        <div style={{fontSize:'3rem'}}>💬</div>
                                        Selecciona un amigo para empezar a chatear.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ChatModal;
