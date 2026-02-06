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
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentPage, setCurrentPage, playerProfile, hasUnreadNotifications } = useData();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

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

  const handleUserClick = () => {
      if (user) {
          setCurrentPage('settings');
      } else {
          setIsLoginModalOpen(true);
      }
      handleCloseMenu();
  };

  const handleToggleNotifications = useCallback(() => {
    setIsNotificationCenterOpen(prev => !prev);
  }, []);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <FootballIcon size={32} color={theme.colors.accent1} />
          <h1 className={styles.title}>Ply<span className={styles.aiText}>on</span></h1>
        </div>
        <div className={styles.rightSection}>
          {isDesktop && (
            <nav className={styles.desktopNav}>
              {navLinks.map(({ page, label, icon }) => {
                  const isActive = currentPage === page;
                  return (
                    <button 
                        key={page} 
                        className={styles.navButton}
                        onClick={() => handleNavClick(page)} 
                        aria-current={isActive}
                        aria-label={`Ir a ${label}`}
                    >
                        <span className={styles.navButtonIcon}>{icon}</span>
                        <span>{label}</span>
                    </button>
                  )
              })}
            </nav>
          )}
          
          {isDesktop ? (
            <>
              <button onClick={handleToggleNotifications} className={styles.iconButton} aria-label="Notificaciones">
                <BellIcon size={20} color={theme.colors.primaryText} />
                {hasUnreadNotifications && <div className={styles.notificationDot} />}
              </button>
              <button onClick={handleUserClick} className={styles.userButton} aria-label={user ? "Ver perfil de usuario" : "Iniciar sesión"}>
                {user && playerProfile.photo ? (
                    <img src={playerProfile.photo} alt="Profile" className={styles.userAvatar} />
                ) : (
                    <UserIcon size={18} color={theme.colors.primaryText} />
                )}
                {user ? <span className={styles.userName}>{playerProfile.name || user.displayName || 'Plyr'}</span> : <span className={styles.userName}>Login</span>}
              </button>
            </>
          ) : (
            <button onClick={handleToggleNotifications} className={styles.iconButton} aria-label="Notificaciones">
              <BellIcon size={20} color={theme.colors.primaryText} />
              {hasUnreadNotifications && <div className={styles.notificationDot} />}
            </button>
          )}

          <button onClick={toggleTheme} className={styles.iconButton} aria-label={`Cambiar a tema ${theme.name === 'dark' ? 'claro' : 'oscuro'}`}>
            {theme.name === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          
          {!isDesktop && (
            <button onClick={handleOpenMenu} className={styles.iconButton} aria-label="Abrir menú de navegación">
              <MenuIcon color={theme.colors.primaryText} />
            </button>
          )}
        </div>
      </header>
      {!isDesktop && isMenuOpen && (
        <>
          <div 
            className={`${styles.menuBackdrop} ${isAnimatingOut ? styles.backdropAnimOut : styles.backdropAnimIn}`} 
            onClick={handleCloseMenu} 
          />
          <div className={`${styles.sidePanelMenu} ${isAnimatingOut ? styles.menuAnimOut : styles.menuAnimIn}`}>
            <div className={styles.menuHeader}>
              <div onClick={handleUserClick} className={styles.menuUserInfo}>
                {user && playerProfile.photo ? (
                    <img src={playerProfile.photo} alt="Profile" className={styles.menuUserAvatar} />
                ) : (
                    <UserIcon size={24} color={theme.colors.primaryText} />
                )}
                <span className={styles.menuUserName}>
                  {user ? (playerProfile.name || user.displayName || 'Plyr') : 'Invitado'}
                </span>
              </div>
              <button onClick={handleCloseMenu} className={styles.iconButton} aria-label="Cerrar menú">
                <CloseIcon color={theme.colors.primaryText} size={28} />
              </button>
            </div>
            <nav className={styles.mobileNav}>
              {navLinks.map(({ page, label, icon }, index) => {
                const isActive = currentPage === page;
                return (
                    <button 
                        key={page} 
                        className={`${styles.mobileNavButton} ${styles.navLinkAnim}`}
                        style={{ animationDelay: `${index * 0.07}s` }}
                        onClick={() => handleNavClick(page)} 
                        aria-current={isActive}
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
