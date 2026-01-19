
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { CloseIcon } from '../icons/CloseIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { EyeOffIcon } from '../icons/EyeOffIcon';
import { Loader } from '../Loader';

interface UpdateCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'email' | 'password';
}

const UpdateCredentialModal: React.FC<UpdateCredentialModalProps> = ({ isOpen, onClose, mode }) => {
  const { theme } = useTheme();
  const { updateUserEmail, updateUserPassword } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form fields
  const [newEmail, setNewEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Visibility states
  const [showCurrentPasswordEmail, setShowCurrentPasswordEmail] = useState(false);
  const [showCurrentPasswordPass, setShowCurrentPasswordPass] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getFirebaseErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/wrong-password': 
      case 'auth/invalid-credential':
        return 'La contraseña actual es incorrecta.';
      case 'auth/invalid-email': return 'El formato del nuevo correo no es válido.';
      case 'auth/email-already-in-use': return 'El nuevo correo electrónico ya está en uso.';
      case 'auth/weak-password': return 'La nueva contraseña debe tener al menos 6 caracteres.';
      case 'auth/too-many-requests': return 'Demasiados intentos. Por favor, inténtalo más tarde.';
      default: return 'Ocurrió un error inesperado.';
    }
  };
  
  const resetFormState = () => {
    setError('');
    setSuccessMessage('');
    setIsLoading(false);
    setNewEmail('');
    setCurrentPasswordForEmail('');
    setCurrentPasswordForPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowCurrentPasswordEmail(false);
    setShowCurrentPasswordPass(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetFormState();
    onClose();
  };
  
  useEffect(() => {
      if (isOpen) {
        resetFormState();
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => { 
          document.body.style.overflow = 'auto';
          window.removeEventListener('keydown', handleKeyDown);
      };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }
  
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await updateUserEmail(newEmail, currentPasswordForEmail);
      setSuccessMessage('¡Correo electrónico actualizado con éxito!');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error: any) {
      const message = (error && typeof error === 'object' && 'code' in error) ? getFirebaseErrorMessage(error.code) : 'Error al actualizar el correo.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await updateUserPassword(newPassword, currentPasswordForPassword);
      setSuccessMessage('¡Contraseña actualizada con éxito!');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error: any) {
      const message = (error && typeof error === 'object' && 'code' in error) ? getFirebaseErrorMessage(error.code) : 'Error al actualizar la contraseña.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
        backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
        boxShadow: theme.shadows.large, width: '100%', maxWidth: '400px',
        display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s ease',
        border: `1px solid ${theme.colors.border}`,
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${theme.spacing.medium} ${theme.spacing.large}`,
        borderBottom: `1px solid ${theme.colors.border}`,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    content: {
        padding: theme.spacing.large,
        display: 'flex', flexDirection: 'column',
        gap: theme.spacing.large,
    },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.medium, },
    input: {
        width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium,
        color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium,
        outline: 'none', boxSizing: 'border-box',
    },
    passwordWrapper: {
        position: 'relative',
        width: '100%'
    },
    inputPassword: {
        width: '100%', padding: theme.spacing.medium, paddingRight: '45px', // Space for icon
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium,
        color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium,
        outline: 'none', boxSizing: 'border-box',
    },
    togglePasswordBtn: {
        position: 'absolute',
        right: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: theme.colors.secondaryText,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px'
    },
    button: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: theme.spacing.medium, padding: `${theme.spacing.medium} ${theme.spacing.large}`,
        borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium,
        fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s, filter 0.2s',
        border: 'none', width: '100%', minHeight: '48px',
        backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent,
    },
    statusMessage: {
        textAlign: 'center',
        padding: theme.spacing.small, borderRadius: theme.borderRadius.medium,
        fontSize: theme.typography.fontSize.small,
        fontWeight: 600,
    },
  };
  
  const title = mode === 'email' ? 'Cambiar Correo Electrónico' : 'Cambiar Contraseña';

  const modalJSX = (
      <>
          <style>{`
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }
          `}</style>
          <div style={styles.backdrop} onClick={handleClose}>
              <div style={styles.modal} onClick={e => e.stopPropagation()}>
                  <header style={styles.header}>
                      <h2 style={styles.title}>{title}</h2>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={handleClose} aria-label="Cerrar modal"><CloseIcon color={theme.colors.primaryText} /></button>
                  </header>
                  <div style={styles.content}>
                      {error && <p style={{...styles.statusMessage, color: theme.colors.loss, backgroundColor: `${theme.colors.loss}20`}}>{error}</p>}
                      {successMessage && <p style={{...styles.statusMessage, color: theme.colors.win, backgroundColor: `${theme.colors.win}20`}}>{successMessage}</p>}
                      {mode === 'email' ? (
                          <form onSubmit={handleEmailUpdate} style={styles.form}>
                              <input type="email" placeholder="Nuevo correo electrónico" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={styles.input} required />
                              
                              <div style={styles.passwordWrapper}>
                                  <input 
                                      type={showCurrentPasswordEmail ? "text" : "password"} 
                                      placeholder="Contraseña actual" 
                                      value={currentPasswordForEmail} 
                                      onChange={e => setCurrentPasswordForEmail(e.target.value)} 
                                      style={styles.inputPassword} 
                                      required 
                                  />
                                  <button 
                                      type="button" 
                                      onClick={() => setShowCurrentPasswordEmail(!showCurrentPasswordEmail)}
                                      style={styles.togglePasswordBtn}
                                  >
                                      {showCurrentPasswordEmail ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                                  </button>
                              </div>

                              <button type="submit" disabled={isLoading} style={styles.button}>
                                  {isLoading ? <Loader /> : 'Actualizar Correo'}
                              </button>
                          </form>
                      ) : (
                          <form onSubmit={handlePasswordUpdate} style={styles.form}>
                              <div style={styles.passwordWrapper}>
                                  <input 
                                      type={showCurrentPasswordPass ? "text" : "password"} 
                                      placeholder="Contraseña actual" 
                                      value={currentPasswordForPassword} 
                                      onChange={e => setCurrentPasswordForPassword(e.target.value)} 
                                      style={styles.inputPassword} 
                                      required 
                                  />
                                  <button 
                                      type="button" 
                                      onClick={() => setShowCurrentPasswordPass(!showCurrentPasswordPass)}
                                      style={styles.togglePasswordBtn}
                                  >
                                      {showCurrentPasswordPass ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                                  </button>
                              </div>

                              <div style={styles.passwordWrapper}>
                                  <input 
                                      type={showNewPassword ? "text" : "password"} 
                                      placeholder="Nueva contraseña" 
                                      value={newPassword} 
                                      onChange={e => setNewPassword(e.target.value)} 
                                      style={styles.inputPassword} 
                                      required 
                                  />
                                  <button 
                                      type="button" 
                                      onClick={() => setShowNewPassword(!showNewPassword)}
                                      style={styles.togglePasswordBtn}
                                  >
                                      {showNewPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                                  </button>
                              </div>

                              <div style={styles.passwordWrapper}>
                                  <input 
                                      type={showConfirmPassword ? "text" : "password"} 
                                      placeholder="Confirmar nueva contraseña" 
                                      value={confirmNewPassword} 
                                      onChange={e => setConfirmNewPassword(e.target.value)} 
                                      style={styles.inputPassword} 
                                      required 
                                  />
                                  <button 
                                      type="button" 
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      style={styles.togglePasswordBtn}
                                  >
                                      {showConfirmPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                                  </button>
                              </div>

                              <button type="submit" disabled={isLoading} style={styles.button}>
                                  {isLoading ? <Loader /> : 'Actualizar Contraseña'}
                              </button>
                          </form>
                      )}
                  </div>
              </div>
          </div>
      </>
  );

  return createPortal(modalJSX, document.body);
};

export default UpdateCredentialModal;
