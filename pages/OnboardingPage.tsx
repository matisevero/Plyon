
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FootballIcon } from '../components/icons/FootballIcon';
import { Loader } from '../components/Loader';
import LoginModal from '../components/modals/LoginModal';
import { UserIcon } from '../components/icons/UserIcon';
import { useAuth } from '../contexts/AuthContext';
import { fetchPublicProfiles } from '../services/firebaseService';
import type { PublicProfile } from '../types';

interface OnboardingPageProps {
  onComplete: (name: string, type: 'fresh' | 'demo') => Promise<void>;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const { user, logOut } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isFreshHovered, setIsFreshHovered] = useState(false);
  const [isDemoHovered, setIsDemoHovered] = useState(false);
  const [isLoginHovered, setIsLoginHovered] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [inviter, setInviter] = useState<PublicProfile | null>(null);

  useEffect(() => {
    const checkInvite = async () => {
        const inviteCode = localStorage.getItem('pendingInviteCode');
        if (inviteCode) {
            try {
                const profiles = await fetchPublicProfiles([inviteCode]);
                if (profiles.length > 0) setInviter(profiles[0]);
            } catch (e) {
                console.error("Error fetching inviter", e);
            }
        }
    };
    checkInvite();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
  };

  const handleStartAsGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return;
    setIsLoading(true);
    await onComplete(name.trim(), 'fresh');
  };

  const handleCompleteProfileAndConnect = async () => {
    if (!name.trim() || isLoading) return;
    setIsLoading(true);
    await onComplete(name.trim(), 'fresh');
  };

  const handleStartWithDemo = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const finalName = name.trim() || 'Mati';
    await onComplete(finalName, 'demo');
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: theme.colors.backgroundGradient, padding: theme.spacing.large,
      textAlign: 'center', color: theme.colors.primaryText, fontFamily: theme.typography.fontFamily,
      animation: 'fadeIn 1s ease-out'
    },
    title: { fontSize: '2.5rem', fontWeight: 900, margin: `${theme.spacing.medium} 0 ${theme.spacing.small} 0` },
    aiText: {
        background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    subtitle: {
      fontSize: theme.typography.fontSize.large, color: theme.colors.secondaryText, maxWidth: '400px',
      margin: `0 auto ${theme.spacing.extraLarge} auto`, lineHeight: 1.6,
    },
    inviteBanner: {
        backgroundColor: `${theme.colors.accent1}15`, border: `1px solid ${theme.colors.accent1}40`,
        borderRadius: theme.borderRadius.large, padding: theme.spacing.large, marginBottom: theme.spacing.extraLarge,
        maxWidth: '400px', animation: 'slideUpFadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '0.5rem'
    },
    inviteText: { margin: 0, fontSize: '1.2rem', color: theme.colors.primaryText, fontWeight: 600 },
    inviterName: { color: theme.colors.accent1, fontWeight: 800, fontSize: '1.4rem' },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large, width: '100%', maxWidth: '350px' },
    label: { fontSize: theme.typography.fontSize.medium, fontWeight: 600, marginBottom: '1.5rem', display: 'block' },
    input: {
      width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.surface,
      border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium,
      color: theme.colors.primaryText, fontSize: theme.typography.fontSize.large, textAlign: 'center', outline: 'none',
    },
    button: {
      padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderRadius: theme.borderRadius.medium,
      fontSize: theme.typography.fontSize.medium, fontWeight: 'bold', cursor: 'pointer',
      transition: 'background-color 0.2s, color 0.2s, border 0.2s', display: 'flex',
      alignItems: 'center', justifyContent: 'center', minHeight: '48px',
    },
    orSeparator: {
        display: 'flex', alignItems: 'center', gap: theme.spacing.medium,
        color: theme.colors.secondaryText, margin: `${theme.spacing.small} 0`,
    },
    line: { flex: 1, height: '1px', backgroundColor: theme.colors.border },
    welcomeUser: {
        backgroundColor: `${theme.colors.accent2}20`, padding: theme.spacing.medium, borderRadius: theme.borderRadius.medium,
        marginBottom: theme.spacing.medium, color: theme.colors.primaryText, border: `1px solid ${theme.colors.accent2}`,
    },
    regWarning: { fontSize: '0.85rem', color: theme.colors.accent1, marginTop: '-0.5rem', fontWeight: 700 }
  };

  const freshButtonStyle: React.CSSProperties = { ...styles.button, backgroundColor: isFreshHovered ? theme.colors.accent1 : 'transparent', color: isFreshHovered ? theme.colors.textOnAccent : theme.colors.accent1, border: `1px solid ${theme.colors.accent1}` };
  const demoButtonStyle: React.CSSProperties = { ...styles.button, backgroundColor: isDemoHovered ? theme.colors.accent2 : 'transparent', color: isDemoHovered ? theme.colors.textOnAccent : theme.colors.accent2, border: `1px solid ${theme.colors.accent2}` };
  const loginButtonStyle: React.CSSProperties = { ...styles.button, backgroundColor: isLoginHovered ? theme.colors.surface : 'transparent', color: theme.colors.primaryText, border: `1px solid ${theme.colors.borderStrong}`, marginTop: 0, };

  const renderGeneralOnboarding = () => (
    <>
      <p style={styles.subtitle}>Tu centro de mando de fútbol personal. Registra partidos y analiza tu rendimiento.</p>
      <form onSubmit={handleStartAsGuest} style={styles.form}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <label htmlFor="playerName" style={styles.label}>¿Cómo quieres que te llamen?</label>
          <input id="playerName" type="text" value={name} onChange={handleNameChange} style={styles.input} placeholder="Ej: Leo Messi" required autoFocus disabled={isLoading} />
        </div>
        
        {name.trim() !== '' && (
          <>
            <button type="submit" style={{ ...freshButtonStyle }} onMouseEnter={() => setIsFreshHovered(true)} onMouseLeave={() => setIsFreshHovered(false)} disabled={isLoading}>
              {isLoading ? <Loader /> : 'Empezar ahora'}
            </button>
            <div style={{...styles.orSeparator}}><div style={styles.line}></div><span>o</span><div style={styles.line}></div></div>
            <button type="button" onClick={handleStartWithDemo} style={{ ...demoButtonStyle }} onMouseEnter={() => setIsDemoHovered(true)} onMouseLeave={() => setIsDemoHovered(false)} disabled={isLoading}>
              {isLoading ? <Loader /> : 'Cargar Datos de Ejemplo'}
            </button>
          </>
        )}
        <div style={styles.orSeparator}><div style={styles.line}></div></div>
        <button type="button" onClick={() => setIsLoginModalOpen(true)} style={loginButtonStyle} onMouseEnter={() => setIsLoginHovered(true)} onMouseLeave={() => setIsLoginHovered(false)} disabled={isLoading}>
           <UserIcon size={18} /> Inicia Sesión / Regístrate
        </button>
      </form>
    </>
  );

  const renderInviteOnboarding = () => (
    <>
      <div style={styles.inviteBanner}>
        <p style={styles.inviteText}>¡Has sido invitado!</p>
        <span style={styles.inviterName}>{inviter!.name}</span>
        <p style={{fontSize: '0.95rem', color: theme.colors.secondaryText, margin: '5px 0'}}>quiere que te unas a su red en Plyon.</p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} style={styles.form}>
        {user ? (
          <div style={styles.welcomeUser}>
              <p style={{margin: 0}}>Hola, <strong>{user.displayName || user.email}</strong> 👋</p>
              <p style={{fontSize: '0.8rem', margin: '5px 0 0 0'}}>Escribe o confirma tu nombre para finalizar el enlace.</p>
          </div>
        ) : null}

        <div style={{display: 'flex', flexDirection: 'column'}}>
          <label htmlFor="playerName" style={styles.label}>Define tu nombre de jugador</label>
          <input id="playerName" type="text" value={name} onChange={handleNameChange} style={styles.input} placeholder="Ej: Leo Messi" required autoFocus disabled={isLoading} />
        </div>
        
        {user ? (
            <button type="button" onClick={handleCompleteProfileAndConnect} style={freshButtonStyle} disabled={isLoading || !name.trim()}>
                {isLoading ? <Loader/> : 'Finalizar Perfil y Conectar'}
            </button>
        ) : (
            <button type="button" onClick={() => setIsLoginModalOpen(true)} style={freshButtonStyle} disabled={isLoading}>
                Crear Cuenta o Iniciar Sesión para Conectar
            </button>
        )}

        {!user && <p style={styles.regWarning}>* Es necesario registrarse para conectar con {inviter!.name}</p>}

        {user && !isLoading && (
            <button type="button" onClick={() => logOut()} style={{background: 'none', border: 'none', color: theme.colors.secondaryText, cursor: 'pointer', textDecoration: 'underline'}}>
                Cerrar sesión ({user.email})
            </button>
        )}
      </form>
    </>
  );

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpFadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={styles.container}>
        <FootballIcon size={64} color={theme.colors.accent1} />
        <h1 style={styles.title}>Ply<span style={styles.aiText}>on</span></h1>
        
        {inviter ? renderInviteOnboarding() : renderGeneralOnboarding()}
      </div>
      
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};

export default OnboardingPage;
