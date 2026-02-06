
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { FootballIcon } from '../components/icons/FootballIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import LoginModal from '../components/modals/LoginModal';
import InvitationLandingModal from '../components/modals/InvitationLandingModal';
import { validateInvitation } from '../services/firebaseService';

const LandingPage: React.FC = () => {
  const { setCurrentPage } = useData();
  const [scrolled, setScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  // Invitation State
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check for Invitation Code on Mount
  useEffect(() => {
    const checkInvite = async () => {
        try {
            const params = new URLSearchParams(window.location.search);
            const urlCode = params.get('invite');
            
            if (urlCode) {
                // Validate code with backend
                const inviterProfile = await validateInvitation(urlCode);
                if (inviterProfile) {
                    console.log("Invitación válida de:", inviterProfile.name);
                    setInviterName(inviterProfile.name);
                    setIsInviteModalOpen(true);
                } else {
                    console.log("Código de invitación inválido o expirado");
                }
            }
        } catch (e) { 
            console.error("Error validando invitación:", e); 
        }
    };
    checkInvite();
  }, []);

  const handleInviteAccept = () => {
      setIsInviteModalOpen(false);
      // Open Login Modal immediately so they can register and claim the invite
      setIsLoginOpen(true);
  };

  // Auto-rotate features
  useEffect(() => {
      const interval = setInterval(() => {
          setActiveFeature(prev => (prev + 1) % 3);
      }, 4000);
      return () => clearInterval(interval);
  }, []);

  const features = [
      {
          title: "Análisis de Nivel Profesional",
          desc: "Mapas de calor, índices de impacto y estadísticas avanzadas para entender tu juego.",
          icon: <ChartBarIcon size={40} color="#00E676" />
      },
      {
          title: "Inteligencia Artificial",
          desc: "Tu propio entrenador virtual. Recibe consejos tácticos y titulares de prensa generados por IA.",
          icon: <SparklesIcon size={40} color="#2979FF" />
      },
      {
          title: "Compite con Amigos",
          desc: "Crea duelos, compara tarjetas de jugador y escala en el ranking mundial.",
          icon: <TrophyIcon size={40} color="#FFD700" />
      }
  ];

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#121829', // Dark theme hardcoded for landing impact
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
    },
    nav: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      padding: '1.2rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 1000,
      transition: 'all 0.3s ease',
      backgroundColor: scrolled ? 'rgba(18, 24, 41, 0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none',
    },
    logo: {
        display: 'flex', alignItems: 'center', gap: '10px',
        fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-1px'
    },
    logoText: {
        background: 'linear-gradient(90deg, #00E676, #2979FF)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    hero: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '8rem 1.5rem 4rem 1.5rem',
        background: 'radial-gradient(circle at 50% 30%, #1A2238 0%, #121829 70%)',
    },
    h1: {
        fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
        fontWeight: 900,
        lineHeight: 1.1,
        marginBottom: '1.5rem',
        maxWidth: '900px',
        letterSpacing: '-2px'
    },
    subtitle: {
        fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
        color: '#94A3B8',
        marginBottom: '3rem',
        maxWidth: '600px',
        lineHeight: 1.6
    },
    ctaButton: {
        padding: '1rem 2.5rem',
        fontSize: '1.2rem',
        fontWeight: 700,
        borderRadius: '50px',
        border: 'none',
        background: 'linear-gradient(90deg, #00E676, #00C853)',
        color: '#fff',
        cursor: 'pointer',
        boxShadow: '0 10px 30px rgba(0, 230, 118, 0.4)',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    featureSection: {
        padding: '4rem 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
    },
    featureCard: {
        backgroundColor: '#1A2238',
        padding: '2rem',
        borderRadius: '20px',
        border: '1px solid #2D3748',
        transition: 'transform 0.3s, border-color 0.3s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '1rem'
    },
    footer: {
        borderTop: '1px solid #2D3748',
        padding: '3rem 2rem',
        textAlign: 'center',
        color: '#94A3B8',
        marginTop: 'auto'
    },
    secondaryBtn: {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff',
        padding: '0.6rem 1.2rem',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 600,
        transition: 'all 0.2s'
    }
  };

  return (
    <div style={styles.container}>
        <nav style={styles.nav}>
            <div style={styles.logo}>
                <FootballIcon size={32} color="#00E676" />
                <span>Ply<span style={styles.logoText}>on</span></span>
            </div>
            <div style={{display: 'flex', gap: '1rem'}}>
                <button 
                    style={styles.secondaryBtn}
                    onClick={() => setIsLoginOpen(true)}
                >
                    Iniciar Sesión
                </button>
            </div>
        </nav>

        <section style={styles.hero}>
            <div style={{
                padding: '6px 16px', borderRadius: '20px', backgroundColor: 'rgba(41, 121, 255, 0.1)', 
                color: '#2979FF', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem',
                border: '1px solid rgba(41, 121, 255, 0.3)'
            }}>
                ✨ Nueva Versión 4.2 Disponible
            </div>
            <h1 style={styles.h1}>
                Tu carrera de fútbol, <br/>
                <span style={styles.logoText}>nivel profesional.</span>
            </h1>
            <p style={styles.subtitle}>
                Deja de anotar en notas del celular. Registra tus partidos, analiza tu rendimiento con IA y compite en el ranking global de Plyon.
            </p>
            <button 
                style={styles.ctaButton}
                onClick={() => setCurrentPage('recorder')}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 230, 118, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 230, 118, 0.4)';
                }}
            >
                Comenzar Gratis
            </button>
        </section>

        <section style={styles.featureSection}>
            {features.map((f, i) => (
                <div 
                    key={i} 
                    style={{
                        ...styles.featureCard,
                        transform: activeFeature === i ? 'scale(1.02)' : 'scale(1)',
                        borderColor: activeFeature === i ? '#2979FF' : '#2D3748'
                    }}
                >
                    <div style={{
                        padding: '12px', borderRadius: '12px', 
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        marginBottom: '0.5rem'
                    }}>
                        {f.icon}
                    </div>
                    <h3 style={{fontSize: '1.5rem', fontWeight: 700, margin: 0}}>{f.title}</h3>
                    <p style={{color: '#94A3B8', lineHeight: 1.5}}>{f.desc}</p>
                </div>
            ))}
        </section>

        <footer style={styles.footer}>
            <p>© {new Date().getFullYear()} Plyon Stats. Hecho para los que aman el juego.</p>
        </footer>

        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        
        <InvitationLandingModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            inviterName={inviterName || 'Un amigo'}
            onAccept={handleInviteAccept}
        />
    </div>
  );
};

export default LandingPage;
