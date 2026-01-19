
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ThreeDotsIcon } from '../icons/ThreeDotsIcon';
import { ShareIcon } from '../icons/ShareIcon';

interface MomentPreviewCardProps {
  title: string;
  icon: React.ReactNode;
  date: string;
  onOpen: () => void;
}

const MomentPreviewCard: React.FC<MomentPreviewCardProps> = ({ title, icon, date, onOpen }) => {
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const styles: { [key: string]: React.CSSProperties } = {
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      border: `1px solid ${theme.colors.border}`,
      padding: theme.spacing.medium,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      gap: theme.spacing.medium,
      transition: 'background-color 0.2s, transform 0.2s, box-shadow 0.2s',
      boxShadow: isHovered ? theme.shadows.medium : theme.shadows.small,
      cursor: 'pointer',
      position: 'relative',
      transform: isHovered && isDesktop ? 'translateY(-2px)' : 'none',
    },
    icon: {
      color: theme.colors.accent1,
      display: 'flex',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.small,
      borderRadius: theme.borderRadius.medium,
    },
    textContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.1rem',
        overflow: 'hidden',
    },
    title: {
      fontSize: theme.typography.fontSize.medium,
      fontWeight: 600,
      color: theme.colors.primaryText,
      margin: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    date: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.secondaryText,
    },
    actionContainer: {
        position: 'relative',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
    },
    menuButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: theme.colors.secondaryText,
      padding: '0.5rem',
      display: 'flex',
      borderRadius: '50%',
      transition: 'background-color 0.2s',
    },
    shareBtn: {
        opacity: isHovered ? 1 : 0,
        transform: isHovered ? 'translateX(0)' : 'translateX(10px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: theme.colors.accent1,
        color: theme.colors.textOnAccent,
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        fontWeight: 600,
        fontSize: '0.8rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
        boxShadow: theme.shadows.small,
    },
    dropdownMenu: {
      position: 'absolute',
      right: 0,
      top: '100%',
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.medium,
      border: `1px solid ${theme.colors.borderStrong}`,
      boxShadow: theme.shadows.large,
      zIndex: 10,
      marginTop: '0.25rem',
      overflow: 'hidden',
      width: 'max-content',
    },
    dropdownItem: {
      background: 'none',
      border: 'none',
      color: theme.colors.primaryText,
      padding: `${theme.spacing.small} ${theme.spacing.medium}`,
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      fontSize: theme.typography.fontSize.small,
      transition: 'background-color 0.2s',
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpen();
    setIsMenuOpen(false);
  };
  
  const handleMouseEnterMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = theme.colors.border;
  };

  const handleMouseLeaveMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  return (
    <div 
        style={styles.card} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onOpen}
    >
      <div style={styles.icon}>{icon}</div>
      <div style={styles.textContainer}>
        <h3 style={styles.title}>{title}</h3>
        <span style={styles.date}>{date}</span>
      </div>
      
      <div style={styles.actionContainer} ref={menuRef} onClick={(e) => e.stopPropagation()}>
        {isDesktop ? (
            <button style={styles.shareBtn} onClick={handleAction}>
                <ShareIcon size={16} /> Compartir
            </button>
        ) : (
            <>
                <button onClick={handleMenuToggle} style={styles.menuButton} aria-label="Opciones">
                    <ThreeDotsIcon />
                </button>
                {isMenuOpen && (
                <div style={styles.dropdownMenu}>
                    <button
                    onClick={handleAction}
                    style={styles.dropdownItem}
                    onMouseEnter={handleMouseEnterMenu}
                    onMouseLeave={handleMouseLeaveMenu}
                    >
                    Ver y Compartir
                    </button>
                </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default MomentPreviewCard;
