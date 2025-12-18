
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { PublicProfile } from '../../types';
import { UserIcon } from '../icons/UserIcon';

interface ChatListProps {
    friends: PublicProfile[];
    onSelectFriend: (friend: PublicProfile) => void;
    activeFriendId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ friends, onSelectFriend, activeFriendId }) => {
    const { theme } = useTheme();

    const styles: { [key: string]: React.CSSProperties } = {
        list: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.small,
        },
        item: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.medium,
            padding: theme.spacing.medium,
            borderRadius: theme.borderRadius.medium,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            border: `1px solid transparent`,
        },
        activeItem: {
            backgroundColor: `${theme.colors.accent2}20`,
            borderColor: theme.colors.accent2,
        },
        inactiveItem: {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
        },
        avatar: {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            objectFit: 'cover',
        },
        info: {
            flex: 1,
            minWidth: 0,
        },
        name: {
            fontWeight: 'bold',
            color: theme.colors.primaryText,
            marginBottom: '2px',
        },
        status: {
            fontSize: '0.8rem',
            color: theme.colors.secondaryText,
        },
        empty: {
            textAlign: 'center',
            padding: '2rem',
            color: theme.colors.secondaryText,
            fontStyle: 'italic',
        }
    };

    if (friends.length === 0) {
        return (
            <div style={styles.empty}>
                Aún no tienes amigos agregados. Busca amigos en la pestaña "Comunidad" para empezar a chatear.
            </div>
        );
    }

    return (
        <div style={styles.list}>
            {friends.map(friend => (
                <div 
                    key={friend.uid} 
                    style={{
                        ...styles.item,
                        ...(friend.uid === activeFriendId ? styles.activeItem : styles.inactiveItem)
                    }}
                    onClick={() => onSelectFriend(friend)}
                >
                    <img 
                        src={friend.photo || `https://ui-avatars.com/api/?name=${friend.name}&background=random`} 
                        alt={friend.name} 
                        style={styles.avatar} 
                    />
                    <div style={styles.info}>
                        <div style={styles.name}>{friend.name}</div>
                        <div style={styles.status}>Toca para chatear</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatList;
