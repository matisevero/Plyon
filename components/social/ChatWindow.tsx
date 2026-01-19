
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { sendMessage, subscribeToMessages } from '../../services/firebaseService';
import { moderateText } from '../../services/geminiService';
import type { ChatMessage, PublicProfile } from '../../types';
import { Loader } from '../Loader';

interface ChatWindowProps {
    friend: PublicProfile;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ friend }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToMessages(user.uid, friend.uid, (msgs) => {
            setMessages(msgs);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user, friend.uid]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user || isSending) return;
        
        setIsSending(true);
        setError(null);
        
        try {
            // 1. Moderate Content
            const moderation = await moderateText(input.trim());
            if (moderation.isToxic) {
                setError(`Mensaje bloqueado: ${moderation.reason || 'Contenido inapropiado detectado.'}`);
                setIsSending(false);
                return;
            }

            // 2. Send Message
            await sendMessage(user.uid, friend.uid, input.trim());
            setInput('');
        } catch (error) {
            console.error("Error sending message", error);
            setError("Error al enviar mensaje.");
        } finally {
            setIsSending(false);
        }
    };

    const styles: { [key: string]: React.CSSProperties } = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.medium,
            border: `1px solid ${theme.colors.border}`,
            overflow: 'hidden',
        },
        header: {
            padding: theme.spacing.medium,
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.medium,
            backgroundColor: theme.colors.background,
        },
        avatar: {
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover',
        },
        name: {
            fontWeight: 'bold',
            color: theme.colors.primaryText,
        },
        messagesArea: {
            flex: 1,
            overflowY: 'auto',
            padding: theme.spacing.medium,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.small,
        },
        inputArea: {
            padding: theme.spacing.medium,
            borderTop: `1px solid ${theme.colors.border}`,
            display: 'flex',
            gap: theme.spacing.small,
            flexDirection: 'column' // Changed to handle error message
        },
        inputRow: {
            display: 'flex',
            gap: theme.spacing.small,
        },
        input: {
            flex: 1,
            padding: theme.spacing.small,
            borderRadius: theme.borderRadius.medium,
            border: `1px solid ${error ? theme.colors.loss : theme.colors.borderStrong}`,
            backgroundColor: theme.colors.background,
            color: theme.colors.primaryText,
            fontSize: theme.typography.fontSize.medium,
        },
        sendButton: {
            padding: `${theme.spacing.small} ${theme.spacing.medium}`,
            borderRadius: theme.borderRadius.medium,
            border: 'none',
            backgroundColor: theme.colors.accent1,
            color: theme.colors.textOnAccent,
            fontWeight: 'bold',
            cursor: 'pointer',
        },
        messageBubble: {
            maxWidth: '70%',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            lineHeight: 1.4,
            wordBreak: 'break-word',
        },
        myMessage: {
            alignSelf: 'flex-end',
            backgroundColor: theme.colors.accent1,
            color: theme.colors.textOnAccent,
            borderBottomRightRadius: '2px',
        },
        theirMessage: {
            alignSelf: 'flex-start',
            backgroundColor: theme.colors.background,
            color: theme.colors.primaryText,
            border: `1px solid ${theme.colors.border}`,
            borderBottomLeftRadius: '2px',
        },
        timestamp: {
            fontSize: '0.65rem',
            opacity: 0.7,
            marginTop: '4px',
            textAlign: 'right',
            display: 'block',
        },
        errorText: {
            color: theme.colors.loss,
            fontSize: '0.8rem',
            marginTop: '4px'
        }
    };

    if (isLoading) return <div style={{padding: '2rem', textAlign: 'center'}}><Loader /></div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <img src={friend.photo || `https://ui-avatars.com/api/?name=${friend.name}&background=random`} alt={friend.name} style={styles.avatar} />
                <span style={styles.name}>{friend.name}</span>
            </div>
            <div style={styles.messagesArea}>
                {messages.length === 0 ? (
                    <p style={{textAlign: 'center', color: theme.colors.secondaryText, fontStyle: 'italic', marginTop: '2rem'}}>
                        Di hola 👋
                    </p>
                ) : (
                    messages.map(msg => {
                        const isMine = msg.senderId === user?.uid;
                        return (
                            <div key={msg.id} style={{
                                ...styles.messageBubble,
                                ...(isMine ? styles.myMessage : styles.theirMessage)
                            }}>
                                {msg.text}
                                <span style={styles.timestamp}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} style={styles.inputArea}>
                <div style={styles.inputRow}>
                    <input 
                        type="text" 
                        value={input} 
                        onChange={e => { setInput(e.target.value); setError(null); }} 
                        style={styles.input}
                        placeholder="Escribe un mensaje..."
                        disabled={isSending}
                    />
                    <button type="submit" style={styles.sendButton} disabled={isSending}>
                        {isSending ? <Loader /> : 'Enviar'}
                    </button>
                </div>
                {error && <div style={styles.errorText}>{error}</div>}
            </form>
        </div>
    );
};

export default ChatWindow;
