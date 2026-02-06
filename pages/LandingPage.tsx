import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { FootballIcon } from '../components/icons/FootballIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import LoginModal from '../components/modals/LoginModal';
import s from './LandingPage.module.css';

const LandingPage: React.FC = () => {
  const { setCurrentPage } = useData();
  const [scrolled, setScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <div className={s.container}>
        <nav className={`${s.nav} ${scrolled ? s.navScrolled : ''}`}>
            <div className={s.logo}>
                <FootballIcon size={32} color="#00E676" />
                <span>Ply<span className={s.logoText}>on</span></span>
            </div>
            <div style={{display: 'flex', gap: '1rem'}}>
                <button 
                    className={s.secondaryBtn}
                    onClick={() => setIsLoginOpen(true)}
                >
                    Iniciar Sesión
                </button>
            </div>
        </nav>

        <section className={s.hero}>
            <div className={s.versionBadge}>
                Nueva Versión 4.2 Disponible
            </div>
            <h1 className={s.h1}>
                Tu carrera de fútbol, <br/>
                <span className={s.logoText}>nivel profesional.</span>
            </h1>
            <p className={s.subtitle}>
                Deja de anotar en notas del celular. Registra tus partidos, analiza tu rendimiento con IA y compite en el ranking global de Plyon.
            </p>
            <button 
                className={s.ctaButton}
                onClick={() => setCurrentPage('recorder')}
            >
                Comenzar Gratis
            </button>
        </section>

        <section className={s.featureSection}>
            {features.map((f, i) => (
                <div 
                    key={i} 
                    className={`${s.featureCard} ${activeFeature === i ? s.featureCardActive : ''}`}
                >
                    <div className={s.featureIconWrapper}>
                        {f.icon}
                    </div>
                    <h3 className={s.featureTitle}>{f.title}</h3>
                    <p className={s.featureDesc}>{f.desc}</p>
                </div>
            ))}
        </section>

        <footer className={s.footer}>
            <p>{'©'} {new Date().getFullYear()} Plyon Stats. Hecho para los que aman el juego.</p>
        </footer>

        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default LandingPage;
