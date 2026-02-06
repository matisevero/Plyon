
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { useTheme } from './contexts/ThemeContext';
import { useData } from './contexts/DataContext';
import { useAuth } from './contexts/AuthContext';
import { acceptInvitationCode } from './services/firebaseService';
// Importamos la variable de error desde config
import { initializationError, app as firebaseApp } from './firebase/config';

import Header from './components/Header';
// import BottomTabBar from './components/BottomTabBar'; // Hidden as requested
import RecorderPage from './pages/RecorderPage';
import StatsPage from './pages/StatsPage';
import ProgressPage from './pages/ProgressPage';
import { DuelsPage } from './pages/DuelsPage';
import CoachPage from './pages/CoachPage';
import SettingsPage from './pages/SettingsPage';
import TablePage from './pages/TablePage';
import SocialPage from './pages/SocialPage';
import WorldCupPage from './pages/WorldCupPage';
import OnboardingPage from './pages/OnboardingPage';
import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import SeasonRecapPage from './pages/SeasonRecapPage'; // NEW PAGE
import { Loader } from './components/Loader';
import DashboardSkeleton from './components/skeletons/DashboardSkeleton'; // NEW SKELETON
import SyncBanner from './components/SyncBanner';
import DataConflictModal from './components/modals/DataConflictModal';
import SharedViewLoader from './components/SharedViewLoader';
import VersionChecker from './components/VersionChecker'; 
import LoginModal from './components/modals/LoginModal';
import PendingMatchesModal from './components/modals/PendingMatchesModal';
import IncomingMatchesNotifier from './components/notifications/IncomingMatchesNotifier';
import type { Page } from './types';

const MainAppContent: React.FC = () => {
  const { theme } = useTheme();
  
  if (initializationError || !firebaseApp) {
      return (
          <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
              height: '100vh', backgroundColor: '#121829', color: '#fff', padding: '2rem', textAlign: 'center',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          }}>
              <h1 style={{color: '#FF5252'}}>⚠️ Error de Configuración</h1>
              <p style={{fontSize: '1.2rem', marginBottom: '1rem'}}>
                  La aplicación no pudo conectarse a la base de datos.
              </p>
              <div style={{
                  backgroundColor: '#1A2238', padding: '1rem', borderRadius: '8px', 
                  border: '1px solid #FF5252', maxWidth: '600px', width: '100%',
                  overflowX: 'auto', marginBottom: '2rem'
              }}>
                  <code style={{color: '#FFCDD2'}}>
                      {initializationError || "API Key inválida o no configurada en firebase/config.ts"}
                  </code>
              </div>
              <p>Por favor, revisa el archivo <code>firebase/config.ts</code> y asegúrate de poner tus credenciales reales.</p>
              <button 
                  onClick={() => window.location.reload()} 
                  style={{
                      padding: '10px 20px', borderRadius: '8px', border: 'none', 
                      backgroundColor: '#00B0FF', color: 'white', fontWeight: 'bold', cursor: 'pointer'
                  }}
              >
                  Recargar Aplicación
              </button>
          </div>
      );
  }

  const { currentPage, setCurrentPage, loading: dataLoading, isOnboardingComplete, completeOnboarding, isShareMode } = useData();
  const { loading: authLoading, user } = useAuth();
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPendingMatchesModalOpen, setIsPendingMatchesModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial Routing Logic
  useEffect(() => {
    if (!currentPage) {
        // If logged in or onboarding done -> Recorder
        if (user || isOnboardingComplete) {
            setCurrentPage('recorder');
        } else {
            // New user -> Landing Page
            setCurrentPage('landing');
        }
    }
  }, [currentPage, setCurrentPage, user, isOnboardingComplete]);

  // Handle Invitation Code Check (Global persistence for login flow)
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('invite');
      if (inviteCode && !user) {
          localStorage.setItem('pendingInviteCode', inviteCode);
      }
  }, [user]);

  const styles: { [key: string]: React.CSSProperties } = {
    appContainer: {
      minHeight: '100vh',
      background: theme.colors.backgroundGradient,
      color: theme.colors.primaryText,
      fontFamily: theme.typography.fontFamily,
      transition: 'background 0.3s, color 0.3s',
      width: '100%',
      overflowX: 'hidden',
      // Removed padding bottom since BottomTabBar is hidden
      paddingBottom: 0, 
    },
    fullScreenLoader: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '1rem',
    },
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing': return <LandingPage />;
      case 'admin': return <AdminPage />;
      case 'stats': return <StatsPage />;
      case 'table': return <TablePage />;
      case 'duels': return <DuelsPage />;
      case 'progress': return <ProgressPage />;
      case 'social': return <SocialPage />;
      case 'coach': return <CoachPage />;
      case 'worldcup': return <WorldCupPage />;
      case 'settings': return <SettingsPage />;
      case 'season_recap': return <SeasonRecapPage />; // NEW CASE
      case 'recorder': default: return <RecorderPage />;
    }
  };

  // Replace circular loader with Dashboard Skeleton for a premium feel
  if (dataLoading || authLoading) {
    return (
      <div style={styles.appContainer}>
        <Header />
        <div style={{ paddingTop: '65px' }}>
             <DashboardSkeleton />
        </div>
      </div>
    );
  }
  
  // If Landing Page, render full screen without app chrome
  if (currentPage === 'landing') {
      return <LandingPage />;
  }

  // If Admin Page, render full screen without standard chrome
  if (currentPage === 'admin') {
      return (
        <div style={styles.appContainer}>
            <AdminPage />
        </div>
      );
  }

  // Restore Onboarding blocking logic for new users inside the app flow
  if (!isOnboardingComplete && !isShareMode && !user) {
    return <OnboardingPage onComplete={completeOnboarding} />;
  }

  return (
    <div style={styles.appContainer}>
      <SyncBanner />
      <VersionChecker /> 
      <DataConflictModal />
      <Header />
      <div key={currentPage} style={{ paddingTop: '65px' }} className="page-transition-enter">
        {renderPage()}
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      
      <IncomingMatchesNotifier onOpen={() => setIsPendingMatchesModalOpen(true)} />
      <PendingMatchesModal isOpen={isPendingMatchesModalOpen} onClose={() => setIsPendingMatchesModalOpen(false)} />
      
      {/* BottomTabBar Hidden */}
    </div>
  );
};

const App: React.FC = () => {
  const [shareId, setShareId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('shareId');
    if (id) {
        setShareId(id);
    }
  }, []);

  if (shareId) {
      return <SharedViewLoader shareId={shareId} />;
  }

  return <MainAppContent />;
};

export default App;
