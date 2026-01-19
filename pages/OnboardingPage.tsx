
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FootballIcon } from '../components/icons/FootballIcon';
import { Loader } from '../components/Loader';
import LoginModal from '../components/modals/LoginModal';
import { UserIcon } from '../components/icons/UserIcon';
import { useAuth } from '../contexts/AuthContext';
import { validateInvitation } from '../services/firebaseService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { ActivityIcon } from '../components/icons/ActivityIcon';
import InvitationLandingModal from '../components/modals/InvitationLandingModal';

interface OnboardingPageProps {
  onComplete: (name: string, type: 'fresh' | 'demo') => Promise<void>;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => {
    const { theme } = useTheme();
    return (
        <div style={{ 
            display: 'flex', 
            gap: theme.spacing.medium, 
            textAlign: 'left', 
            alignItems: 'center', 
            backgroundColor: theme.colors.surface, 
            padding: theme.spacing.large, 
            borderRadius: theme.borderRadius.large, 
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.medium,
            transition: 'transform 0.2s ease',
        }}>
            <div style={{ 
                color: theme.colors.accent1, 
                backgroundColor: `${theme.colors.accent1}15`,
                padding: '12px',
                borderRadius: theme.borderRadius.medium,
                display: 'flex',
            }}>
                {icon}
            </div>
            <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: theme.typography.fontSize.medium, fontWeight: 700, color: theme.colors.primaryText }}>{title}</h4>
                <p style={{ margin: 0, fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, lineHeight: 1.4 }}>{desc}</p>
            </div>
        </div>
    );
};

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isPrimaryHovered, setIsPrimaryHovered] = useState(false);
  const [isSecondaryHovered, setIsSecondaryHovered] = useState(false);

  useEffect(() => {
    const checkInvite = async () => {
        const params = new URLSearchParams(window.location.search);
        const urlCode = params.get('invite');
        if (urlCode) {
            try {
                const inviterProfile = await validateInvitation(urlCode);
                if (inviterProfile) {
                    setInviterName(inviterProfile.name);
                    setIsInviteModalOpen(true);
                }
            } catch (e) { console.error(e); }
        }
    };
    checkInvite();
  }, []);

  const handleQuickStart = async () => {
    setIsLoading(true);
    await onComplete('Jugador', 'fresh');
  };

  const handleInviteAccept = () => {
      setIsInviteModalOpen(false);
      setIsLoginModalOpen(true);
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'grid',
      gridTemplateColumns: window.innerWidth >= 1024 ? '1.2fr 1fr' : '1fr',
      minHeight: '100vh',
      background: theme.colors.backgroundGradient,
      fontFamily: theme.typography.fontFamily,
      overflow: 'hidden',
      position: 'relative'
    },
    heroSection: {
        display: window.innerWidth >= 1024 ? 'flex' : 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '5% 10%',
        position: 'relative',
        borderRight: `1px solid ${theme.colors.border}`,
    },
    actionSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.extraLarge,
        backgroundColor: theme.colors.surface,
        zIndex: 2,
        position: 'relative',
        boxShadow: theme.name === 'light' ? '-10px 0 30px rgba(0,0,0,0.05)' : 'none',
    },
    logoContainer: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium, marginBottom: '1.5rem' },
    title: { fontSize: '4rem', fontWeight: 900, margin: 0, color: theme.colors.primaryText, letterSpacing: '-2px' },
    aiText: {
        background: `linear-gradient(135deg, ${theme.colors.accent1}, ${theme.colors.accent2})`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    tagline: {
        fontSize: '2.5rem',
        color: theme.colors.primaryText,
        margin: '0 0 1.5rem 0',
        fontWeight: 800,
        lineHeight: 1.1,
        maxWidth: '500px'
    },
    description: {
        fontSize: '1.1rem',
        color: theme.colors.secondaryText,
        lineHeight: 1.6,
        maxWidth: '550px',
        marginBottom: '2.5rem'
    },
    featuresGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.medium,
        width: '100%',
        maxWidth: '480px'
    },
    actionsWrapper: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: theme.spacing.medium, 
        width: '100%', 
        maxWidth: '360px',
        textAlign: 'center'
    },
    button: {
      padding: theme.spacing.medium, 
      borderRadius: theme.borderRadius.medium,
      fontSize: theme.typography.fontSize.medium, 
      fontWeight: 'bold', 
      cursor: 'pointer',
      transition: 'all 0.2s ease', 
      display: 'flex',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '52px', 
      border: 'none',
      width: '100%'
    },
    primaryBtn: {
        backgroundColor: theme.colors.accent1,
        color: theme.colors.textOnAccent,
        boxShadow: isPrimaryHovered ? `0 6px 20px ${theme.colors.accent1}40` : 'none',
        transform: isPrimaryHovered ? 'translateY(-2px)' : 'none',
    },
    secondaryBtn: {
        color: theme.colors.primaryText,
        border: `1px solid ${theme.colors.borderStrong}`,
        // Fixed: Remove duplicate backgroundColor property to resolve "An object literal cannot have multiple properties with the same name" error.
        backgroundColor: isSecondaryHovered ? theme.colors.background : 'transparent',
        transform: isSecondaryHovered ? 'translateY(-2px)' : 'none',
    },
    inviteBadge: {
        backgroundColor: `${theme.colors.accent2}15`,
        padding: '0.5rem 1rem',
        borderRadius: '99px',
        border: `1px solid ${theme.colors.accent2}30`,
        color: theme.colors.accent2,
        fontSize: '0.85rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    footerNotice: {
        marginTop: '2rem',
        fontSize: '0.8rem',
        color: theme.colors.secondaryText,
        lineHeight: 1.5,
        maxWidth: '300px',
        marginLeft: 'auto',
        marginRight: 'auto'
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeInMove { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-hero { animation: fadeInMove 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .feature-delay-1 { animation-delay: 0.1s; opacity: 0; }
        .feature-delay-2 { animation-delay: 0.2s; opacity: 0; }
        .feature-delay-3 { animation-delay: 0.3s; opacity: 0; }
      `}</style>
      
      <section style={styles.heroSection}>
        <div style={styles.logoContainer} className="animate-hero">
            <FootballIcon size={56} color={theme.colors.accent1} />
            <h1 style={styles.title}>Ply<span style={styles.aiText}>on</span></h1>
        </div>
        <h2 style={styles.tagline} className="animate-hero">Tu legado deportivo, <br/>potenciado por IA.</h2>
        <p style={styles.description} className="animate-hero">
            La plataforma definitiva para trackear tu carrera, analizar tu rendimiento y competir con amigos.
        </p>

        <div style={styles.featuresGrid}>
            <div className="animate-hero feature-delay-1">
                <FeatureCard icon={<ActivityIcon size={24}/>} title="Rendimiento Inteligente" desc="Seguimiento de consistencia, mapas de calor y promedios avanzados." />
            </div>
            <div className="animate-hero feature-delay-2">
                <FeatureCard icon={<SparklesIcon size={24}/>} title="Entrenador IA" desc="Feedback táctico personalizado basado en tus últimos partidos registrados." />
            </div>
            <div className="animate-hero feature-delay-3">
                <FeatureCard icon={<TrophyIcon size={24}/>} title="Modo Carrera Élite" desc="Juega Eliminatorias reales de la FIFA y clasifica al Mundial de Clubes." />
            </div>
        </div>
      </section>

      <section style={styles.actionSection}>
        <div style={{ ...styles.logoContainer, display: window.innerWidth < 1024 ? 'flex' : 'none' }} className="animate-hero">
            <FootballIcon size={40} color={theme.colors.accent1} />
            <h1 style={{ ...styles.title, fontSize: '2.5rem' }}>Ply<span style={styles.aiText}>on</span></h1>
        </div>

        {inviterName ? (
            <div style={styles.inviteBadge} className="animate-hero">
                <span style={{ fontSize: '1.1rem' }}>🤝</span> <strong>{inviterName}</strong> te ha invitado
            </div>
        ) : (
            <div style={{ ...styles.inviteBadge, color: theme.colors.accent1, backgroundColor: `${theme.colors.accent1}10`, borderColor: `${theme.colors.accent1}30` }} className="animate-hero">
                <SparklesIcon size={16} /> Nueva temporada disponible
            </div>
        )}

        <div style={styles.actionsWrapper} className="animate-hero">
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: theme.colors.primaryText }}>¡Bienvenido a la red!</h3>
                <p style={{ color: theme.colors.secondaryText, fontSize: '0.9rem', marginTop: '6px' }}>Tu carrera profesional comienza aquí.</p>
            </div>

            <button 
                onClick={handleQuickStart} 
                style={{ ...styles.button, ...styles.primaryBtn }} 
                disabled={isLoading}
                onMouseEnter={() => setIsPrimaryHovered(true)}
                onMouseLeave={() => setIsPrimaryHovered(false)}
            >
                {isLoading ? <Loader /> : 'Comenzar como Invitado'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', margin: '0.25rem 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: theme.colors.border }} />
                <span style={{ fontSize: '0.75rem', color: theme.colors.secondaryText, fontWeight: 600 }}>o</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: theme.colors.border }} />
            </div>

            <button 
                onClick={() => setIsLoginModalOpen(true)} 
                style={{ ...styles.button, ...styles.secondaryBtn }}
                onMouseEnter={() => setIsSecondaryHovered(true)}
                onMouseLeave={() => setIsSecondaryHovered(false)}
            >
                <UserIcon size={18} style={{ marginRight: '10px' }} /> Iniciar Sesión / Registro
            </button>

            <p style={styles.footerNotice}>
                Al registrarte, sincronizarás tus datos en la nube y podrás competir en el ranking global.
            </p>
        </div>
      </section>

      <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
          initialMode="login" 
      />
      
      <InvitationLandingModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          inviterName={inviterName || 'Un amigo'}
          onAccept={handleInviteAccept}
      />
    </div>
  );
};

export default OnboardingPage;
