
import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { MenuIcon } from './icons/MenuIcon';
import { CloseIcon } from './icons/CloseIcon';
import type { Page } from '../types';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { UsersIcon } from './icons/UsersIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { TableIcon } from './icons/TableIcon';
import { ImageIcon } from './icons/ImageIcon';
import { FootballIcon } from './icons/FootballIcon';
import { UserIcon } from './icons/UserIcon';
import LoginModal from './modals/LoginModal';
import { PlayerIcon } from './icons/PlayerIcon';
import { BellIcon } from './icons/BellIcon';
import NotificationCenter from './notifications/NotificationCenter';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentPage, setCurrentPage, playerProfile, hasUnreadNotifications } = useData();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const isDark = theme.name === 'dark';

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if ((isMenuOpen || isNotificationCenterOpen) && !isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen, isNotificationCenterOpen, isDesktop]);

  const navLinks: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: 'recorder', label: 'Registro', icon: <ClipboardIcon size={18} /> },
    { page: 'stats', label: 'Estadísticas', icon: <BarChartIcon size={18} /> },
    { page: 'table', label: 'Tabla', icon: <TableIcon size={18} /> },
    { page: 'duels', label: 'Duelos', icon: <UsersIcon size={18} /> },
    { page: 'worldcup', label: 'Modo Carrera', icon: <PlayerIcon size={18} /> },
    { page: 'progress', label: 'Progreso', icon: <TrendingUpIcon size={18} /> },
    { page: 'social', label: 'Comunidad', icon: <ImageIcon size={18} /> },
    { page: 'coach', label: 'Entrenador IA', icon: <ChatBubbleIcon size={18} /> },
    { page: 'settings', label: 'Configuración', icon: <SettingsIcon size={18} /> },
  ];

  const handleOpenMenu = useCallback(() => {
    setIsAnimatingOut(false);
    setIsMenuOpen(true);
  }, []);
  
  const handleCloseMenu = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
        setIsMenuOpen(false);
    }, 300);
  }, []);

  const handleNavClick = useCallback((page: Page) => {
    setCurrentPage(page);
    handleCloseMenu();
  }, [setCurrentPage, handleCloseMenu]);
  
  const getNavButtonStyle = (page: Page, isActive: boolean) => {
    const isHovered = hoveredButton === page;
    const style: React.CSSProperties = { border: '1px solid' };

    if (isDark) {
        if (isHovered) {
            style.backgroundColor = '#414a6b';
            style.color = '#a1a8d6';
            style.borderColor = '#414a6b';
        } else if (isActive) {
            style.backgroundColor = '#a1a8d6';
            style.color = '#1c2237';
            style.borderColor = '#414a6b';
        } else { // Inactive
            style.backgroundColor = '#1c2237';
            style.color = '#a1a8d6';
            style.borderColor = '#414a6b';
        }
    } else { // Light theme
        if (isHovered) {
            style.backgroundColor = '#f5f6fa';
            style.color = '#1c2237';
            style.borderColor = '#f5f6fa';
        } else if (isActive) {
            style.backgroundColor = '#c8cdd7';
            style.color = '#1c2237';
            style.borderColor = '#c7ced8';
        } else { // Inactive
            style.backgroundColor = '#ffffff';
            style.color = '#1c2237';
            style.borderColor = '#c7ced8';
        }
    }
    return style;
  };

  const handleUserClick = () => {
      if (user) {
          setCurrentPage('settings'); // Or account page
      } else {
          setIsLoginModalOpen(true);
      }
      handleCloseMenu();
  };

  const handleToggleNotifications = useCallback(() => {
    setIsNotificationCenterOpen(prev => !prev);
  }, []);
  
  const styles: { [key: string]: React.CSSProperties } = {
    header: {
      backgroundColor: theme.colors.surface,
      padding: '0.5rem 2rem',
      borderBottom: `1px solid ${theme.colors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      boxSizing: 'border-box',
      zIndex: 1000,
      boxShadow: theme.shadows.medium,
      height: '65px',
    },
    logoContainer: { display: 'flex', alignItems: 'center', gap: '1rem' },
    title: { fontSize: '1.25rem', fontWeight: 700, color: theme.colors.primaryText, margin: 0, whiteSpace: 'nowrap' },
    aiText: { 
        display: 'inline-block',
        color: theme.colors.accent1,
        background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 900 
    },
    rightSection: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    desktopNav: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    navButton: {
      padding: '0.45rem 0.9rem',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.8rem',
      transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      borderRadius: theme.borderRadius.medium,
    },
    iconButton: { position: 'relative', background: 'none', border: 'none', color: theme.colors.secondaryText, cursor: 'pointer', padding: theme.spacing.small, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },
    userButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.background, transition: 'background-color 0.2s' },
    userAvatar: { width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' },
    userName: { fontSize: '0.8rem', fontWeight: 600, color: theme.colors.primaryText, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    menuBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1998 },
    // Reduced width by approx 25% (was clamp(250px, 80vw, 320px))
    sidePanelMenu: { position: 'fixed', top: 0, right: 0, width: 'clamp(200px, 60vw, 250px)', height: '100%', background: theme.colors.surface, zIndex: 1999, display: 'flex', flexDirection: 'column', boxShadow: theme.shadows.large },
    menuHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', borderBottom: `1px solid ${theme.colors.border}`, height: '65px' },
    menuUserInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.small,
        cursor: 'pointer',
        padding: '0.25rem 0.5rem',
        borderRadius: theme.borderRadius.large,
        transition: 'background-color 0.2s'
    },
    menuUserAvatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        objectFit: 'cover'
    },
    menuUserName: {
        fontSize: '1rem',
        fontWeight: 600,
        color: theme.colors.primaryText
    },
    mobileNav: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem', padding: '1rem', flex: 1 },
    mobileNavButton: {
        cursor: 'pointer', fontWeight: 600, fontSize: '1rem', padding: '0.8rem 1rem',
        borderRadius: theme.borderRadius.medium, transition: 'color 0.2s, background-color 0.2s, border-color 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        gap: '0.8rem',
    },
    notificationDot: {
      position: 'absolute',
      top: '4px',
      right: '4px',
      width: '8px',
      height: '8px',
      backgroundColor: theme.colors.loss,
      borderRadius: '50%',
      border: `2px solid ${theme.colors.surface}`,
      animation: 'pulse 1.5s infinite',
    },
  };


  return (
    <>
      <style>{`
          @keyframes menuSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
          @keyframes menuSlideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
          @keyframes backdropFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes backdropFadeOut { from { opacity: 1; } to { opacity: 0; } }
          @keyframes navLinkFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse {
            0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 82, 82, 0); }
            100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
          }

          .backdrop-anim-in { animation: backdropFadeIn 0.3s ease-out forwards; }
          .backdrop-anim-out { animation: backdropFadeOut 0.3s ease-out forwards; }
          .menu-anim-in { animation: menuSlideIn 0.3s ease-out forwards; }
          .menu-anim-out { animation: menuSlideOut 0.3s ease-out forwards; }
          .nav-link-anim { 
            animation: navLinkFadeIn 0.4s ease-out forwards;
            opacity: 0;
          }
        `}</style>
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <FootballIcon size={32} color={theme.colors.accent1} />
          <h1 style={styles.title}>Ply<span style={styles.aiText}>on</span></h1>
        </div>
        <div style={styles.rightSection}>
          {isDesktop && (
            <nav style={styles.desktopNav}>
              {navLinks.map(({ page, label, icon }) => {
                  const isActive = currentPage === page;
                  const buttonStateStyle = getNavButtonStyle(page, isActive);
                  
                  return (
                    <button 
                        key={page} 
                        style={{...styles.navButton, ...buttonStateStyle}} 
                        onClick={() => handleNavClick(page)} 
                        aria-current={isActive}
                        aria-label={`Ir a ${label}`}
                        onMouseEnter={() => setHoveredButton(page)}
                        onMouseLeave={() => setHoveredButton(null)}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', marginRight: '0.35rem' }}>{icon}</span>
                        <span>{label}</span>
                    </button>
                  )
              })}
            </nav>
          )}
          
          {isDesktop ? (
            <>
              <button onClick={handleToggleNotifications} style={styles.iconButton} aria-label="Notificaciones">
                <BellIcon size={20} color={theme.colors.primaryText} />
                {hasUnreadNotifications && <div style={styles.notificationDot} />}
              </button>
              <button onClick={handleUserClick} style={styles.userButton} aria-label={user ? "Ver perfil de usuario" : "Iniciar sesión"}>
                {user && playerProfile.photo ? (
                    <img src={playerProfile.photo} alt="Profile" style={styles.userAvatar} />
                ) : (
                    <UserIcon size={18} color={theme.colors.primaryText} />
                )}
                {user ? <span style={styles.userName}>{playerProfile.name || user.displayName || 'Plyr'}</span> : <span style={styles.userName}>Login</span>}
              </button>
            </>
          ) : (
            <button onClick={handleToggleNotifications} style={styles.iconButton} aria-label="Notificaciones">
              <BellIcon size={20} color={theme.colors.primaryText} />
              {hasUnreadNotifications && <div style={styles.notificationDot} />}
            </button>
          )}


          <button onClick={toggleTheme} style={styles.iconButton} aria-label={`Cambiar a tema ${theme.name === 'dark' ? 'claro' : 'oscuro'}`}>{theme.name === 'dark' ? <SunIcon /> : <MoonIcon />}</button>
          
          {!isDesktop && (
            <button onClick={handleOpenMenu} style={styles.iconButton} aria-label="Abrir menú de navegación"><MenuIcon color={theme.colors.primaryText} /></button>
          )}
        </div>
      </header>
      {!isDesktop && isMenuOpen && (
        <>
          <div style={styles.menuBackdrop} className={isAnimatingOut ? 'backdrop-anim-out' : 'backdrop-anim-in'} onClick={handleCloseMenu} />
          <div style={styles.sidePanelMenu} className={isAnimatingOut ? 'menu-anim-out' : 'menu-anim-in'}>
            <div style={styles.menuHeader}>
              <div onClick={handleUserClick} style={styles.menuUserInfo}>
                {user && playerProfile.photo ? (
                    <img src={playerProfile.photo} alt="Profile" style={styles.menuUserAvatar} />
                ) : (
                    <UserIcon size={24} color={theme.colors.primaryText} />
                )}
                <span style={styles.menuUserName}>
                  {user ? (playerProfile.name || user.displayName || 'Plyr') : 'Invitado'}
                </span>
              </div>
              <button onClick={handleCloseMenu} style={styles.iconButton} aria-label="Cerrar menú">
                <CloseIcon color={theme.colors.primaryText} size={28} />
              </button>
            </div>
            <nav style={styles.mobileNav}>
              {navLinks.map(({ page, label, icon }, index) => {
                const isActive = currentPage === page;
                const buttonStateStyle = getNavButtonStyle(page, isActive);
                return (
                    <button 
                        key={page} 
                        className="nav-link-anim"
                        style={{ ...styles.mobileNavButton, ...buttonStateStyle, animationDelay: `${index * 0.07}s` }} 
                        onClick={() => handleNavClick(page)} 
                        aria-current={isActive}
                        onMouseEnter={() => setHoveredButton(page)}
                        onMouseLeave={() => setHoveredButton(null)}
                    >
                        <span>{icon}</span>
                        <span>{label}</span>
                    </button>
                )
              })}
            </nav>
          </div>
        </>
      )}
      
      <NotificationCenter isOpen={isNotificationCenterOpen} onClose={() => setIsNotificationCenterOpen(false)} />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};

export default Header;
