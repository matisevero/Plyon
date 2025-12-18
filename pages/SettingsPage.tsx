
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
      generateShareLink
  } = useData();
  
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Changed to array to support multiple open sections
  const [expandedSections, setExpandedSections] = useState<string[]>(['cuenta']);
  const [localProfile, setLocalProfile] = useState<PlayerProfileData>(playerProfile);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateModalMode, setUpdateModalMode] = useState<'email' | 'password'>('email');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  
  const [confirmState, setConfirmState] = useState<{
      isOpen: boolean;
      type: 'tournament' | 'reset' | null;
      id?: string;
      itemName?: string;
  }>({ isOpen: false, type: null });

  const isEmailProvider = user?.providerData[0]?.providerId === 'password';
  
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

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250; 
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          setIsUploadingPhoto(true);
          try {
              const compressedPhoto = await compressImage(file);
              handleProfileChange('photo', compressedPhoto);
          } catch (error) {
              console.error("Error compressing image:", error);
              alert("Error al procesar la imagen.");
          } finally {
              setIsUploadingPhoto(false);
          }
      }
  };

  const handleSaveProfile = () => {
      // Also update email in profile for searching if user is logged in
      const finalProfile = { ...localProfile };
      if (user && user.email) {
          finalProfile.email = user.email;
      }
      updatePlayerProfile(finalProfile);
      alert("Perfil guardado con éxito.");
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
      }
      setConfirmState({ isOpen: false, type: null });
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
    profilePhotoContainer: { width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', backgroundColor: theme.colors.background, position: 'relative' },
    profilePhoto: { width: '100%', height: '100%', objectFit: 'cover' },
    loaderOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
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
    statusMessage: { fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' },
  };
  
  const getSecondaryButtonStyle = (color: string, isHovered: boolean): React.CSSProperties => ({ backgroundColor: isHovered ? `${color}20` : 'transparent', color: color, border: `1px solid ${color}` });
  const getPrimaryButtonStyle = (color: string, isHovered: boolean): React.CSSProperties => ({ backgroundColor: color, color: theme.colors.textOnAccent, border: `1px solid ${color}`, filter: isHovered ? 'brightness(0.9)' : 'brightness(1)' });
  
  // Custom gradient style for the AI Import button
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
        /* Reserves space for the scrollbar to prevent layout shifts */
        html {
            scrollbar-gutter: stable;
        }
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
                                <div style={styles.profilePhotoContainer} onClick={() => photoInputRef.current?.click()}>
                                    <img src={localProfile.photo || `https://ui-avatars.com/api/?name=${localProfile.name}&background=random`} alt="Foto de perfil" style={styles.profilePhoto} />
                                    {isUploadingPhoto && <div style={styles.loaderOverlay}><Loader /></div>}
                                    <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
                                </div>
                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Nombre de Plyr</label>
                                    <input type="text" value={localProfile.name} onChange={e => handleProfileChange('name', e.target.value)} style={styles.input} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium }}>
                                <div style={styles.fieldGroup}><label style={styles.label}>Fecha de nacimiento</label><input type="date" value={localProfile.dob || ''} onChange={e => handleProfileChange('dob', e.target.value)} style={styles.input} /></div>
                                <div style={styles.fieldGroup}><label style={styles.label}>Equipo favorito</label><input type="text" value={localProfile.favoriteTeam || ''} onChange={e => handleProfileChange('favoriteTeam', e.target.value)} style={styles.input} placeholder="Ej: River Plate" /></div>
                            </div>
                            {user && (
                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Email (para que te encuentren)</label>
                                    <input type="text" value={localProfile.email || user.email || ''} readOnly style={{...styles.input, backgroundColor: theme.colors.background, opacity: 0.7}} />
                                </div>
                            )}
                            <button onClick={handleSaveProfile} style={{...styles.button, ...getPrimaryButtonStyle(theme.colors.accent1, hoveredButtons['saveProfile']), alignSelf: 'stretch'}} onMouseEnter={() => handleHover('saveProfile', true)} onMouseLeave={() => handleHover('saveProfile', false)}>Guardar cambios</button>
                        </div>

                        <hr style={styles.divider} />

                        <h4 style={styles.subHeader}>Mis torneos</h4>
                        <div style={styles.tournamentList}>
                            {tournaments.map(t => (
                                <div key={t.id} style={styles.tournamentItem}>
                                    <div style={styles.tournamentInfo}>
                                        <span style={{ fontSize: '1.5rem' }}>{t.icon}</span>
                                        <span style={{...styles.tournamentName, color: t.color }}>{t.name}</span>
                                    </div>
                                    <div style={styles.tournamentActions}>
                                        <button onClick={() => setEditingTournament(t)} style={{...styles.button, padding: '0.5rem', ...getSecondaryButtonStyle(theme.colors.draw, false)}}>Editar</button>
                                        <button onClick={() => handleDeleteTournamentClick(t)} style={{...styles.button, padding: '0.5rem', ...getSecondaryButtonStyle(theme.colors.loss, false)}}><TrashIcon /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <hr style={styles.divider} />

                        <h4 style={styles.subHeader}>Apariencia</h4>
                        <SegmentedControl 
                            options={[
                                { label: 'Claro', value: 'light'},
                                { label: 'Oscuro', value: 'dark'},
                                { label: 'Sistema', value: 'system'},
                            ]}
                            selectedValue={themePreference}
                            onSelect={(value) => setThemePreference(value as 'light' | 'dark' | 'system')}
                        />
                    </div>
                )}
            </div>

            {/* Feedback */}
            <div style={styles.sectionContainer}>
                <div style={styles.sectionHeader} onClick={() => handleToggleSection('feedback')}>
                    <h3 style={styles.sectionTitle}>Feedback y soporte</h3>
                    <ChevronIcon isExpanded={expandedSections.includes('feedback')} />
                </div>
                {expandedSections.includes('feedback') && (
                    <div style={{...styles.sectionContent, animation: 'fadeInDown 0.3s ease-out'}}>
                        <p style={{...styles.description, marginTop: '10px'}}>
                            ¿Tienes alguna idea para mejorar la app o encontraste un error? ¡Queremos escucharte!
                        </p>
                        <a 
                            href="https://forms.gle/uNMPoG5d8hsMjavf8" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{...styles.button, ...getSecondaryButtonStyle(theme.colors.accent2, hoveredButtons['feedback']), textDecoration: 'none'}}
                            onMouseEnter={() => handleHover('feedback', true)}
                            onMouseLeave={() => handleHover('feedback', false)}
                        >
                            <ChatBubbleIcon size={20} />
                            Completar formulario de feedback
                        </a>
                    </div>
                )}
            </div>

            {/* Zona de peligro */}
            <div style={styles.sectionContainer}>
                <div style={styles.sectionHeader} onClick={() => handleToggleSection('peligro')}>
                    <h3 style={styles.sectionTitle}>Zona de peligro</h3>
                    <ChevronIcon isExpanded={expandedSections.includes('peligro')} />
                </div>
                {expandedSections.includes('peligro') && (
                    <div style={{...styles.sectionContent, animation: 'fadeInDown 0.3s ease-out'}}>
                        <p style={{...styles.description, marginTop: '10px'}}>Borra todos tus datos locales.</p>
                        <button onClick={handleResetDataClick} style={{...styles.button, ...getSecondaryButtonStyle(theme.colors.loss, hoveredButtons['reset'])}} onMouseEnter={() => handleHover('reset', true)} onMouseLeave={() => handleHover('reset', false)}>Restablecer App</button>
                    </div>
                )}
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: theme.spacing.medium, color: theme.colors.secondaryText, fontSize: '0.75rem', opacity: 0.7 }}>
            v{APP_VERSION}
        </div>

        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        <TournamentEditModal isOpen={!!editingTournament} onClose={() => setEditingTournament(null)} onSave={handleSaveTournament} tournament={editingTournament} />
        <SmartImportModal isOpen={isSmartImportOpen} onClose={() => setIsSmartImportOpen(false)} />
        <UpdateCredentialModal 
            isOpen={isUpdateModalOpen}
            mode={updateModalMode}
            onClose={() => setIsUpdateModalOpen(false)}
        />
        <ConfirmationModal
            isOpen={confirmState.isOpen}
            onClose={() => setConfirmState({ isOpen: false, type: null })}
            onConfirm={confirmAction}
            title={confirmState.type === 'reset' ? 'Restablecer Aplicación' : 'Eliminar Torneo'}
            message={
                confirmState.type === 'reset' 
                ? '¿Estás completamente seguro? Esta acción borrará TODOS tus datos de este dispositivo y no se puede deshacer.' 
                : `¿Seguro que quieres eliminar el torneo "${confirmState.itemName}"?`
            }
        />
      </main>
    </>
  );
};

export default SettingsPage;
