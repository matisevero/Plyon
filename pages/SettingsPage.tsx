
import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { ChevronIcon } from '../components/icons/ChevronIcon';
import { PlayerProfileData, Tournament } from '../types';
import { Loader } from '../components/Loader';
import TournamentEditModal from '../components/modals/TournamentEditModal';
import { TrashIcon } from '../components/icons/TrashIcon';
import { UserIcon } from '../components/icons/UserIcon';
import { LogoutIcon } from '../components/icons/LogoutIcon';
import { ChatBubbleIcon } from '../components/icons/ChatBubbleIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import LoginModal from '../components/modals/LoginModal';
import SmartImportModal from '../components/modals/SmartImportModal';
import SegmentedControl from '../components/common/SegmentedControl';
import UpdateCredentialModal from '../components/modals/UpdateCredentialModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { APP_VERSION } from '../version';
import { RefreshIcon } from '../components/icons/RefreshIcon';
import { BellIcon } from '../components/icons/BellIcon';
import CustomDateInput from '../components/common/CustomDateInput';
import { createPendingMatch, updateUsername, deleteUserAccount } from '../services/firebaseService';
import { DatabaseIcon } from '../components/icons/DatabaseIcon';
import { LockIcon } from '../components/icons/LockIcon';
import ImageCropperModal from '../components/modals/ImageCropperModal';
import { EditLineIcon } from '../components/icons/EditLineIcon';

// Admin Email Configuration
const ADMIN_EMAILS = ['matias.severo@gmail.com']; 

const SettingsPage: React.FC = () => {
  const { theme, themePreference, setThemePreference } = useTheme();
  const { user, logOut } = useAuth();
  const { 
      matches,
      goals,
      customAchievements,
      aiInteractions,
      tournaments,
      updateTournament,
      deleteTournament,
      importCsvData,
      importJsonData,
      setCurrentPage, resetApp, playerProfile, updatePlayerProfile,
      requestNotificationPermission,
      recalculateStats
  } = useData();
  
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [expandedSections, setExpandedSections] = useState<string[]>(['cuenta']);
  const [localProfile, setLocalProfile] = useState<PlayerProfileData>(playerProfile);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  
  // Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateModalMode, setUpdateModalMode] = useState<'email' | 'password'>('email');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const [confirmState, setConfirmState] = useState<{
      isOpen: boolean;
      type: 'tournament' | 'reset' | 'deleteAccount' | null;
      id?: string;
      itemName?: string;
  }>({ isOpen: false, type: null });

  const isEmailProvider = user?.providerData[0]?.providerId === 'password';
  
  // Admin Check
  const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email);
  
  const handleOpenUpdateModal = (mode: 'email' | 'password') => {
    setUpdateModalMode(mode);
    setIsUpdateModalOpen(true);
  };
  
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setLocalProfile(playerProfile);
  }, [playerProfile]);
  
  const handleProfileChange = (field: keyof PlayerProfileData, value: any) => {
      setLocalProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              setRawImageSrc(e.target?.result as string);
              setIsCropperOpen(true);
          };
          reader.readAsDataURL(file);
      }
      // Reset input so same file can be selected again if cancelled
      if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleCropComplete = (croppedImage: string) => {
      handleProfileChange('photo', croppedImage);
  };

  const handleSaveProfile = async () => {
      setIsSavingProfile(true);
      try {
          const finalProfile = { ...localProfile };
          
          if (user && user.email) {
              finalProfile.email = user.email;
          }

          // Handle Username Change
          if (user && localProfile.username && localProfile.username !== playerProfile.username) {
              try {
                  await updateUsername(user.uid, playerProfile.username, localProfile.username);
              } catch (e: any) {
                  alert(`Error al actualizar usuario: ${e.message}`);
                  setIsSavingProfile(false);
                  return;
              }
          }

          await updatePlayerProfile(finalProfile);
          alert("Perfil guardado con éxito.");
      } catch (e) {
          console.error(e);
          alert("Error al guardar perfil.");
      } finally {
          setIsSavingProfile(false);
      }
  };

  const [hoveredButtons, setHoveredButtons] = useState<Record<string, boolean>>({});
  const handleHover = (id: string, isHovered: boolean) => {
    setHoveredButtons(prev => ({ ...prev, [id]: isHovered }));
  };

  const getTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}`;
  };

  const handleExport = () => {
    const dataToExport = { matches, goals, customAchievements, aiInteractions, playerProfile, tournaments };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plyon-backup-${getTimestamp()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleExportCSV = () => {
    if (matches.length === 0) {
        alert("No hay partidos para exportar.");
        return;
    }
    
    const headers = ["Fecha", "Resultado", "Mis Goles", "Mis Asistencias", "Dif. Gol", "Torneo", "Notas"];
    
    const escapeCsvField = (field: any) => {
        if (field === undefined || field === null) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    };

    const rows = matches.map(m => [
        escapeCsvField(m.date),
        escapeCsvField(m.result),
        escapeCsvField(m.myGoals),
        escapeCsvField(m.myAssists),
        escapeCsvField(m.goalDifference),
        escapeCsvField(m.tournament),
        escapeCsvField(m.notes)
    ].join(','));

    const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `partidos-${playerProfile.name || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJsonClick = () => {
    jsonInputRef.current?.click();
  };

  const handleImportCsvClick = () => {
    csvInputRef.current?.click();
  };

  const handleJsonFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await importJsonData(e.target?.result as string);
        setCurrentPage('recorder');
      } catch (e: any) { 
          console.error(e);
          alert(`Error al importar JSON: ${e.message}`); 
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };
  
  const handleCsvFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            await importCsvData(e.target?.result as string);
            setCurrentPage('recorder');
        } catch (e: any) { 
            console.error(e);
            alert(`Error al importar CSV: ${e.message}`); 
        }
    };
    reader.readAsText(file);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };
  
  const handleResetDataClick = () => {
    setConfirmState({ isOpen: true, type: 'reset' });
  };
  
  const handleDeleteAccountClick = () => {
    setConfirmState({ isOpen: true, type: 'deleteAccount' });
  };

  const handleSaveTournament = (tournament: Tournament) => {
    updateTournament(tournament);
    setEditingTournament(null);
  };

  const handleDeleteTournamentClick = (tournament: Tournament) => {
    setConfirmState({ isOpen: true, type: 'tournament', id: tournament.id, itemName: tournament.name });
  };

  const confirmAction = async () => {
      if (confirmState.type === 'tournament' && confirmState.id) {
          await deleteTournament(confirmState.id);
      } else if (confirmState.type === 'reset') {
          await resetApp();
      } else if (confirmState.type === 'deleteAccount') {
          if (user) {
              try {
                  await deleteUserAccount(user.uid);
                  await resetApp(); // Clear local state too
                  alert("Cuenta eliminada correctamente.");
              } catch (e: any) {
                  console.error(e);
                  alert("Error al eliminar cuenta. Por seguridad, es posible que debas cerrar sesión y volver a entrar antes de eliminarla.");
              }
          }
      }
      setConfirmState({ isOpen: false, type: null });
  };

  const handleRecalculateStats = async () => {
      if (!user) {
          alert("Debes iniciar sesión para usar esta función.");
          return;
      }
      setIsOptimizing(true);
      try {
          await recalculateStats();
          alert("Base de datos optimizada correctamente.");
      } catch (e: any) {
          console.error(e);
          alert(`Error al optimizar: ${e.message}`);
      } finally {
          setIsOptimizing(false);
      }
  };

  const handleSimulatePendingMatch = async () => {
      if (!user) return;
      try {
          const dummyMatch: any = {
              id: `sim-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              result: 'VICTORIA',
              myGoals: 2,
              myAssists: 1,
              notes: 'Partido simulado para pruebas de UI.',
              myTeamPlayers: [{ name: playerProfile.name || 'Yo', goals: 2, assists: 1 }],
              opponentPlayers: []
          };
          
          await Promise.all([
              createPendingMatch(dummyMatch, user.uid, user.uid, 'teammate', 'Entrenador IA'),
              createPendingMatch({...dummyMatch, result: 'DERROTA', myGoals: 0}, user.uid, user.uid, 'opponent', 'Rival Desconocido'),
              createPendingMatch({...dummyMatch, result: 'EMPATE', myGoals: 1}, user.uid, user.uid, 'teammate', 'Capitán')
          ]);
          
          alert("¡Simulación enviada! Revisa la notificación emergente o el centro de notificaciones.");
      } catch (e) {
          console.error(e);
          alert("Error al simular.");
      }
  };
  
  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent2}`, paddingLeft: theme.spacing.medium },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
        gap: theme.spacing.large,
        alignItems: 'start',
    },
    column: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large, minWidth: 0 },
    sectionContainer: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, boxShadow: theme.shadows.medium, border: `1px solid ${theme.colors.border}`, display: 'flex', flexDirection: 'column', width: '100%' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${theme.spacing.medium} ${theme.spacing.large}`, cursor: 'pointer' },
    sectionTitle: { fontSize: theme.typography.fontSize.large, fontWeight: 600, color: theme.colors.primaryText, margin: 0 },
    sectionContent: { padding: `0 ${theme.spacing.large} ${theme.spacing.large}`, borderTop: `1px solid ${theme.colors.border}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    description: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, lineHeight: 1.6, margin: 0 },
    button: { padding: `${theme.spacing.medium} ${theme.spacing.large}`, border: 'none', borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium, fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.medium, transition: 'background-color 0.2s, color 0.2s, border 0.2s' },
    profileForm: { display: 'flex', flexDirection: 'column', gap: theme.spacing.medium, marginTop: '10px' },
    profileRow: { display: 'grid', gridTemplateColumns: '120px 1fr', gap: theme.spacing.large, alignItems: 'center' },
    // Updated photo container to be relative for overlay
    profilePhotoContainer: { 
        width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', 
        cursor: 'pointer', backgroundColor: theme.colors.background, 
        position: 'relative', border: `1px solid ${theme.colors.border}`,
        // Add transform to contain children paint
        transform: 'translateZ(0)'
    },
    profilePhoto: { width: '100%', height: '100%', objectFit: 'cover' },
    
    // New Overlay Style
    profileOverlay: {
        position: 'absolute', inset: 0, 
        background: 'rgba(0,0,0,0.4)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        // Opacity handled by CSS class in render
        transition: 'opacity 0.2s ease',
        backdropFilter: 'blur(2px)',
    },

    fieldGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    label: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontWeight: 500 },
    input: { width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium, boxSizing: 'border-box' },
    tournamentList: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    tournamentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.medium, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.borderStrong}` },
    tournamentInfo: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium },
    tournamentName: { fontWeight: 600 },
    tournamentActions: { display: 'flex', gap: theme.spacing.small, alignItems: 'center' },
    formSection: { paddingTop: theme.spacing.medium, marginTop: theme.spacing.medium, borderTop: `1px solid ${theme.colors.border}` },
    subHeader: { fontSize: '1rem', fontWeight: 600, color: theme.colors.secondaryText, margin: `10px 0 ${theme.spacing.small} 0` },
    divider: { border: 0, borderTop: `1px solid ${theme.colors.border}`, margin: `${theme.spacing.medium} 0`, width: '100%' },
    legalLink: { color: theme.colors.secondaryText, fontSize: '0.8rem', textDecoration: 'none', margin: '0 8px' },
    adminButton: { marginTop: '1rem', width: '100%', background: `linear-gradient(90deg, #121212, #2c2c2c)`, border: '1px solid #444', color: '#fff' }
  };
  
  const getSecondaryButtonStyle = (color: string, isHovered: boolean): React.CSSProperties => ({ backgroundColor: isHovered ? `${color}20` : 'transparent', color: color, border: `1px solid ${color}` });
  const getPrimaryButtonStyle = (color: string, isHovered: boolean): React.CSSProperties => ({ backgroundColor: color, color: theme.colors.textOnAccent, border: `1px solid ${color}`, filter: isHovered ? 'brightness(0.9)' : 'brightness(1)' });
  
  const getGradientButtonStyle = (isHovered: boolean): React.CSSProperties => ({
      background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`,
      color: theme.name === 'dark' ? '#121829' : '#FFFFFF',
      border: 'none',
      filter: isHovered ? 'brightness(0.9)' : 'brightness(1)'
  });

  const handleToggleSection = (sectionId: string) => { 
      setExpandedSections(prev => {
          if (prev.includes(sectionId)) {
              return prev.filter(id => id !== sectionId);
          } else {
              return [...prev, sectionId];
          }
      }); 
  };
  
  return (
    <>
      <style>{`
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        html { scrollbar-gutter: stable; }

        /* Profile Hover Logic */
        .profile-overlay { opacity: 0; }
        
        /* Desktop Hover */
        @media (hover: hover) {
            .profile-container:hover .profile-overlay { opacity: 1; }
        }

        /* Mobile Active/Touch */
        .profile-container:active .profile-overlay { opacity: 1; }
      `}</style>
      <main style={styles.container}>
        <h2 style={styles.pageTitle}>Ajustes</h2>
        <div style={styles.gridContainer}>
          <div style={styles.column}>
            {/* Cuenta y Datos */}
            <div style={styles.sectionContainer}>
                <div style={styles.sectionHeader} onClick={() => handleToggleSection('cuenta')}>
                    <h3 style={styles.sectionTitle}>Cuenta y gestión de datos</h3>
                    <ChevronIcon isExpanded={expandedSections.includes('cuenta')} />
                </div>
                {expandedSections.includes('cuenta') && (
                    <div style={{...styles.sectionContent, animation: 'fadeInDown 0.3s ease-out'}}>
                        {user ? (
                            <>
                                <p style={{...styles.description, marginTop: '10px'}}>Conectado como: <strong>{user.email}</strong></p>
                                {playerProfile.username && (
                                    <p style={{...styles.description, marginTop: '5px', fontSize: '0.9rem'}}>
                                        Plyr ID: <strong style={{color: theme.colors.accent1}}>@{playerProfile.username}</strong>
                                    </p>
                                )}
                                <p style={styles.description}>Tus datos se están sincronizando automáticamente con la nube.</p>
                                {isEmailProvider && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium, marginTop: theme.spacing.medium }}>
                                        <button onClick={() => handleOpenUpdateModal('email')} style={{ ...styles.button, ...getSecondaryButtonStyle(theme.colors.accent2, hoveredButtons['changeEmail']) }} onMouseEnter={() => handleHover('changeEmail', true)} onMouseLeave={() => handleHover('changeEmail', false)}>
                                            Cambiar mail
                                        </button>
                                        <button onClick={() => handleOpenUpdateModal('password')} style={{ ...styles.button, ...getSecondaryButtonStyle(theme.colors.accent2, hoveredButtons['changePass']) }} onMouseEnter={() => handleHover('changePass', true)} onMouseLeave={() => handleHover('changePass', false)}>
                                            Cambiar contraseña
                                        </button>
                                    </div>
                                )}
                                <button onClick={logOut} style={{...styles.button, ...getSecondaryButtonStyle(theme.colors.loss, hoveredButtons['logout']), marginTop: '1rem'}} onMouseEnter={() => handleHover('logout', true)} onMouseLeave={() => handleHover('logout', false)}>
                                    <LogoutIcon /> Cerrar sesión
                                </button>
                            </>
                        ) : (
                            <>
                                <p style={styles.description}>Inicia sesión para sincronizar tus datos en múltiples dispositivos y asegurar tu información en la nube.</p>
                                <button onClick={() => setIsLoginModalOpen(true)} style={{...styles.button, ...getPrimaryButtonStyle(theme.colors.accent2, hoveredButtons['login'])}} onMouseEnter={() => handleHover('login', true)} onMouseLeave={() => handleHover('login', false)}>
                                    <UserIcon size={20} /> Iniciar sesión / Registrarse
                                </button>
                            </>
                        )}

                        <hr style={styles.divider} />
                        
                        <h4 style={styles.subHeader}>Gestión de datos</h4>
                        <p style={styles.description}>Exporta/Importa respaldo completo (JSON) o solo partidos (CSV).</p>
                        
                        <button 
                            onClick={() => setIsSmartImportOpen(true)} 
                            style={{...styles.button, ...getGradientButtonStyle(hoveredButtons['smartImport']), width: '100%'}} 
                            onMouseEnter={() => handleHover('smartImport', true)} 
                            onMouseLeave={() => handleHover('smartImport', false)}
                        >
                            <SparklesIcon /> Importar con IA (desde texto)
                        </button>

                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium}}>
                            <button onClick={handleExport} style={{...styles.button, ...getSecondaryButtonStyle(theme.colors.accent1, hoveredButtons['exportJson'])}} onMouseEnter={() => handleHover('exportJson', true)} onMouseLeave={() => handleHover('exportJson', false)}>Exportar JSON</button>
                            <button onClick={handleImportJsonClick} style={{...styles.button, ...getSecondaryButtonStyle(theme.colors.accent1, hoveredButtons['importJson'])}} onMouseEnter={() => handleHover('importJson', true)} onMouseLeave={() => handleHover('importJson', false)}>Importar JSON</button>
                            <input type="file" ref={jsonInputRef} onChange={handleJsonFileChange} accept=".json" style={{ display: 'none' }} />
                        </div>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium}}>
                            <button onClick={handleExportCSV} style={{...styles.button, ...getSecondaryButtonStyle(theme.colors.accent2, hoveredButtons['exportCsv'])}} onMouseEnter={() => handleHover('exportCsv', true)} onMouseLeave={() => handleHover('exportCsv', false)}>Exportar CSV</button>
                            <button onClick={handleImportCsvClick} style={{...styles.button, ...getSecondaryButtonStyle(theme.colors.accent2, hoveredButtons['importCsv'])}} onMouseEnter={() => handleHover('importCsv', true)} onMouseLeave={() => handleHover('importCsv', false)}>Importar CSV</button>
                            <input type="file" ref={csvInputRef} onChange={handleCsvFileChange} accept=".csv" style={{ display: 'none' }} />
                        </div>
                        
                        {user && (
                            <>
                                <hr style={styles.divider} />
                                <h4 style={styles.subHeader}>Optimización de Base de Datos</h4>
                                <p style={styles.description}>Si notas que tus estadísticas totales no coinciden con tus partidos, usa esta herramienta para recalcular el resumen.</p>
                                <button 
                                    onClick={handleRecalculateStats} 
                                    disabled={isOptimizing}
                                    style={{...styles.button, ...getSecondaryButtonStyle(theme.colors.accent1, hoveredButtons['optimize'])}} 
                                    onMouseEnter={() => handleHover('optimize', true)} 
                                    onMouseLeave={() => handleHover('optimize', false)}
                                >
                                    {isOptimizing ? <Loader /> : <DatabaseIcon size={20} />} Recalcular Estadísticas (Reparar)
                                </button>
                            </>
                        )}
                        
                        {isAdmin && (
                            <button 
                                onClick={() => setCurrentPage('admin')}
                                style={{...styles.button, ...styles.adminButton}}
                            >
                                <LockIcon size={16} /> Panel de Administrador
                            </button>
                        )}
                        
                    </div>
                )}
            </div>

          </div>

          <div style={styles.column}>
            {/* Perfil y Configuración */}
            <div style={styles.sectionContainer}>
                <div style={styles.sectionHeader} onClick={() => handleToggleSection('perfil')}>
                    <h3 style={styles.sectionTitle}>Perfil y configuración</h3>
                    <ChevronIcon isExpanded={expandedSections.includes('perfil')} />
                </div>
                {expandedSections.includes('perfil') && (
                    <div style={{...styles.sectionContent, animation: 'fadeInDown 0.3s ease-out'}}>
                        <div style={styles.profileForm}>
                            <div style={styles.profileRow}>
                                <div 
                                    className="profile-container"
                                    style={styles.profilePhotoContainer} 
                                    onClick={() => photoInputRef.current?.click()}
                                    title="Click para editar foto"
                                >
                                    <img src={localProfile.photo || `https://ui-avatars.com/api/?name=${localProfile.name}&background=random`} alt="Perfil" style={styles.profilePhoto} />
                                    <div className="profile-overlay" style={styles.profileOverlay}>
                                        <EditLineIcon size={28} color="#FFFFFF" />
                                    </div>
                                </div>
                                <input type="file" ref={photoInputRef} onChange={handlePhotoSelect} accept="image/*" style={{ display: 'none' }} />
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: theme.colors.primaryText, fontWeight: 600 }}>Foto de perfil</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: theme.colors.secondaryText }}>Toca la imagen para editarla y encuadrarla</p>
                                </div>
                            </div>
                            
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Nombre de Plyr</label>
                                <input 
                                    type="text" 
                                    value={localProfile.name} 
                                    onChange={e => handleProfileChange('name', e.target.value)} 
                                    style={styles.input} 
                                />
                            </div>
                            
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Plyr ID (@usuario)</label>
                                <div style={{position: 'relative'}}>
                                    <input 
                                        type="text" 
                                        value={localProfile.username || ''} 
                                        onChange={e => handleProfileChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        disabled={!user}
                                        style={{...styles.input, opacity: !user ? 0.7 : 1, cursor: !user ? 'not-allowed' : 'text'}} 
                                    />
                                    <span style={{position: 'absolute', right: 10, top: 12, fontSize: '0.8rem', color: theme.colors.secondaryText}}>@{localProfile.username}</span>
                                </div>
                                {!user && <span style={{fontSize: '0.75rem', color: theme.colors.secondaryText, fontStyle: 'italic'}}>Inicia sesión para modificar tu ID.</span>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium }}>
                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Altura (cm)</label>
                                    <input type="number" value={localProfile.height || ''} onChange={e => handleProfileChange('height', parseInt(e.target.value))} style={styles.input} />
                                </div>
                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Peso (kg)</label>
                                    <input type="number" value={localProfile.weight || ''} onChange={e => handleProfileChange('weight', parseInt(e.target.value))} style={styles.input} />
                                </div>
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Equipo Favorito</label>
                                <input type="text" value={localProfile.favoriteTeam || ''} onChange={e => handleProfileChange('favoriteTeam', e.target.value)} style={styles.input} />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Fecha de Nacimiento</label>
                                <CustomDateInput value={localProfile.dob || ''} onChange={(val) => handleProfileChange('dob', val)} />
                            </div>
                            <button onClick={handleSaveProfile} disabled={isSavingProfile} style={{...styles.button, ...getPrimaryButtonStyle(theme.colors.accent1, hoveredButtons['saveProfile'])}} onMouseEnter={() => handleHover('saveProfile', true)} onMouseLeave={() => handleHover('saveProfile', false)}>
                                {isSavingProfile ? <Loader /> : 'Guardar Perfil'}
                            </button>
                        </div>

                        <hr style={styles.divider} />

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Tema de la aplicación</label>
                            <SegmentedControl
                                options={[
                                    { label: 'Sistema', value: 'system' },
                                    { label: 'Claro', value: 'light' },
                                    { label: 'Oscuro', value: 'dark' },
                                ]}
                                selectedValue={themePreference}
                                onSelect={(val) => setThemePreference(val as any)}
                            />
                        </div>
                        
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Notificaciones</label>
                            <button onClick={requestNotificationPermission} style={{...styles.button, ...getSecondaryButtonStyle(theme.colors.accent2, hoveredButtons['notif'])}} onMouseEnter={() => handleHover('notif', true)} onMouseLeave={() => handleHover('notif', false)}>
                                <BellIcon size={18} /> Activar Notificaciones
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Gestión de Torneos */}
            <div style={styles.sectionContainer}>
                <div style={styles.sectionHeader} onClick={() => handleToggleSection('torneos')}>
                    <h3 style={styles.sectionTitle}>Gestión de Torneos</h3>
                    <ChevronIcon isExpanded={expandedSections.includes('torneos')} />
                </div>
                {expandedSections.includes('torneos') && (
                    <div style={{...styles.sectionContent, animation: 'fadeInDown 0.3s ease-out'}}>
                        <div style={styles.tournamentList}>
                            {tournaments.map(tournament => (
                                <div key={tournament.id} style={styles.tournamentItem}>
                                    <div style={styles.tournamentInfo}>
                                        <span style={{ fontSize: '1.5rem' }}>{tournament.icon}</span>
                                        <div>
                                            <div style={styles.tournamentName}>{tournament.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: theme.colors.secondaryText }}>{tournament.playersPerSide} vs {tournament.playersPerSide} • {tournament.matchDuration} min</div>
                                        </div>
                                    </div>
                                    <div style={styles.tournamentActions}>
                                        <button onClick={() => setEditingTournament(tournament)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.accent2 }}>Editar</button>
                                        <button onClick={() => handleDeleteTournamentClick(tournament)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.loss }}><TrashIcon /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Soporte y Feedback */}
             <div style={styles.sectionContainer}>
                <div style={styles.sectionHeader} onClick={() => handleToggleSection('soporte')}>
                    <h3 style={styles.sectionTitle}>Soporte y Feedback</h3>
                    <ChevronIcon isExpanded={expandedSections.includes('soporte')} />
                </div>
                {expandedSections.includes('soporte') && (
                    <div style={{...styles.sectionContent, animation: 'fadeInDown 0.3s ease-out'}}>
                        <p style={styles.description}>¿Tienes alguna sugerencia o encontraste un error? ¡Cuéntanos! Usamos IA para procesar tus comentarios y mejorar rápidamente.</p>
                        <a 
                            href="https://forms.google.com" // Placeholder URL
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{...styles.button, ...getSecondaryButtonStyle(theme.colors.accent2, hoveredButtons['feedback']), textDecoration: 'none'}} 
                            onMouseEnter={() => handleHover('feedback', true)} 
                            onMouseLeave={() => handleHover('feedback', false)}
                        >
                            <ChatBubbleIcon /> Enviar Comentarios / Reportar
                        </a>
                    </div>
                )}
             </div>

             {/* ZONA DE PELIGRO */}
             <div style={{...styles.sectionContainer, borderColor: theme.colors.loss}}>
                <div style={styles.sectionHeader} onClick={() => handleToggleSection('danger')}>
                    <h3 style={{...styles.sectionTitle, color: theme.colors.loss}}>Zona de Peligro</h3>
                    <ChevronIcon isExpanded={expandedSections.includes('danger')} color={theme.colors.loss} />
                </div>
                {expandedSections.includes('danger') && (
                    <div style={{...styles.sectionContent, animation: 'fadeInDown 0.3s ease-out'}}>
                        <div style={{textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.medium}}>
                            <button 
                                onClick={handleResetDataClick} 
                                style={{
                                    ...styles.button, 
                                    backgroundColor: theme.colors.loss, 
                                    color: theme.colors.textOnAccent, 
                                    border: `1px solid ${theme.colors.loss}`, 
                                    opacity: 0.9, 
                                    fontSize: '0.9rem', 
                                    width: isDesktop ? 'auto' : '100%',
                                    maxWidth: isDesktop ? '300px' : 'none'
                                }}
                            >
                                <TrashIcon size={16} /> BORRAR TODOS LOS DATOS LOCALES
                            </button>
                            
                            {user && (
                                <button 
                                    onClick={handleDeleteAccountClick} 
                                    style={{
                                        ...styles.button, 
                                        backgroundColor: 'transparent', 
                                        color: theme.colors.loss, 
                                        border: `1px solid ${theme.colors.loss}`, 
                                        fontSize: '0.9rem', 
                                        width: isDesktop ? 'auto' : '100%',
                                        maxWidth: isDesktop ? '300px' : 'none'
                                    }}
                                >
                                    ELIMINAR CUENTA Y DATOS PERMANENTEMENTE
                                </button>
                            )}
                        </div>
                    </div>
                )}
             </div>

            <div style={{marginTop: '2rem', textAlign: 'center', width: '100%'}}>
                <div style={{marginTop: '1rem', color: theme.colors.secondaryText, fontSize: '0.75rem'}}>
                    FútbolStats v{APP_VERSION}
                </div>
                <div style={{marginTop: '0.5rem', display: 'flex', justifyContent: 'center'}}>
                    <a href="#" style={styles.legalLink}>Términos y Condiciones</a>
                    <span style={{color: theme.colors.border}}>|</span>
                    <a href="#" style={styles.legalLink}>Política de Privacidad</a>
                </div>
                
                {user && process.env.NODE_ENV === 'development' && (
                    <div style={{marginTop: '10px'}}>
                        <button onClick={handleSimulatePendingMatch} style={{fontSize: '0.7rem', textDecoration: 'underline', border: 'none', background: 'none', color: theme.colors.accent2, cursor: 'pointer'}}>
                            Simular partido pendiente (Dev)
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Modals */}
      <TournamentEditModal 
        isOpen={!!editingTournament} 
        onClose={() => setEditingTournament(null)} 
        onSave={handleSaveTournament}
        tournament={editingTournament} 
      />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <SmartImportModal isOpen={isSmartImportOpen} onClose={() => setIsSmartImportOpen(false)} />
      <UpdateCredentialModal 
        isOpen={isUpdateModalOpen} 
        onClose={() => setIsUpdateModalOpen(false)} 
        mode={updateModalMode} 
      />
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: null })}
        onConfirm={confirmAction}
        title={
            confirmState.type === 'tournament' ? 'Eliminar Torneo' : 
            confirmState.type === 'deleteAccount' ? 'Eliminar Cuenta Definitivamente' :
            'Restablecer Aplicación'
        }
        message={
            confirmState.type === 'tournament' ? 
            `¿Estás seguro de que quieres eliminar el torneo "${confirmState.itemName}"?` : 
            confirmState.type === 'deleteAccount' ?
            <span style={{color: theme.colors.loss}}>
                ESTA ACCIÓN ES IRREVERSIBLE. Se eliminará tu cuenta, tu perfil, tus estadísticas y todos tus datos de nuestros servidores. No podrás recuperarlos.
            </span> :
            <span style={{color: theme.colors.loss}}>¡ADVERTENCIA! Esto borrará TODOS tus datos locales y reiniciará la aplicación. Si has iniciado sesión, los datos de la nube se mantendrán, pero este dispositivo se limpiará. Esta acción no se puede deshacer.</span>
        }
      />
      <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => setIsCropperOpen(false)}
          imageSrc={rawImageSrc}
          onCropComplete={handleCropComplete}
      />
    </>
  );
};

export default SettingsPage;
