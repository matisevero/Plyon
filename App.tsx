
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { useTheme } from './contexts/ThemeContext';
import { useData } from './contexts/DataContext';
import { useAuth } from './contexts/AuthContext';

import Header from './components/Header';
import RecorderPage from './pages/RecorderPage';
import StatsPage from './pages/StatsPage';
import ProgressPage from './pages/ProgressPage';
import { DuelsPage } from './pages/DuelsPage';
import CoachPage from './pages/CoachPage';
import SettingsPage from './pages/SettingsPage';
import TablePage from './pages/TablePage';
import SocialPage from './pages/SocialPage';
import OnboardingPage from './pages/OnboardingPage';
import WorldCupPage from './pages/WorldCupPage';
import { Loader } from './components/Loader';
import SyncBanner from './components/SyncBanner';
import DataConflictModal from './components/modals/DataConflictModal';
import SharedViewLoader from './components/SharedViewLoader';
import VersionChecker from './components/VersionChecker'; 
import LoginModal from './components/modals/LoginModal';
import type { Page } from './types';

const MainAppContent: React.FC = () => {
  const { theme } = useTheme();
  const { currentPage, setCurrentPage, isOnboardingComplete, loading: dataLoading, completeOnboarding } = useData();
  const { loading: authLoading } = useAuth();
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    if (!currentPage) {
      setCurrentPage('recorder');
    }
  }, [currentPage, setCurrentPage]);

  const styles: { [key: string]: React.CSSProperties } = {
    appContainer: {
      minHeight: '100vh',
      background: theme.colors.backgroundGradient,
      color: theme.colors.primaryText,
      fontFamily: theme.typography.fontFamily,
      transition: 'background 0.3s, color 0.3s',
      width: '100%',
      overflowX: 'hidden',
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
      case 'stats': return <StatsPage />;
      case 'table': return <TablePage />;
      case 'duels': return <DuelsPage />;
      case 'progress': return <ProgressPage />;
      case 'social': return <SocialPage />;
      case 'coach': return <CoachPage />;
      case 'worldcup': return <WorldCupPage />;
      case 'settings': return <SettingsPage />;
      case 'recorder': default: return <RecorderPage />;
    }
  };

  if (dataLoading || authLoading) {
    return (
      <div style={{ ...styles.appContainer, ...styles.fullScreenLoader }}>
        <Loader />
        <p>Cargando Plyon...</p>
      </div>
    );
  }

  if (!isOnboardingComplete) {
    return <OnboardingPage onComplete={completeOnboarding} />;
  }

  return (
    <div style={styles.appContainer}>
      <SyncBanner />
      <VersionChecker /> 
      <DataConflictModal />
      <Header />
      <div key={currentPage} style={{ paddingTop: '65px' }} className="page-transition-container">
        {renderPage()}
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
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
