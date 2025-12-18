
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Loader } from '../Loader';
import { FirebaseError } from 'firebase/app';
import { CloseIcon } from '../icons/CloseIcon';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { signUp, signIn, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) {
    return null;
  }

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'El formato del correo electrónico no es válido.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Correo electrónico o contraseña incorrectos.';
        case 'auth/email-already-in-use':
            return 'Este correo electrónico ya está registrado.';
        case 'auth/weak-password':
            return 'La contraseña debe tener al menos 6 caracteres.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos. Por favor, inténtalo más tarde.';
        default:
            return 'Ocurrió un error. Por favor, inténtalo de nuevo.';
    }
  };

  const handleAuthSuccess = () => {
    onClose();
    // Reset form state for next time modal is opened
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setSuccessMessage('');
    setMode('login');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      try {
          if (mode === 'register') {
              await signUp(email, password, name);
              handleAuthSuccess();
          } else if (mode === 'login') {
              await signIn(email, password);
              handleAuthSuccess();
          } else if (mode === 'forgot') {
              await resetPassword(email);
              setSuccessMessage('Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.');
          }
      } catch (error) {
          if (error instanceof FirebaseError) {
              setError(getErrorMessage(error.code));
          } else if (error instanceof Error) {
              setError(error.message);
          } else {
              setError('Ocurrió un error inesperado.');
          }
      } finally {
          setIsLoading(false);
      }
  };

  const toggleMode = () => {
      setMode(prev => prev === 'login' ? 'register' : 'login');
      setError('');
      setSuccessMessage('');
  };

  const goToForgot = () => {
      setMode('forgot');
      setError('');
      setSuccessMessage('');
  }

  const backToLogin = () => {
      setMode('login');
      setError('');
      setSuccessMessage('');
  }

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
      position: 'relative'
    },
    closeButton: {
        position: 'absolute',
        top: theme.spacing.medium,
        right: theme.spacing.medium,
        background: 'none',
        border: 'none',
        cursor: 'pointer'
    },
    content: {
      padding: theme.spacing.extraLarge,
      display: 'flex', flexDirection: 'column',
      gap: theme.spacing.large,
      textAlign: 'center'
    },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.medium, },
    input: {
        width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium,
        color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium,
        outline: 'none', boxSizing: 'border-box',
    },
    button: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: theme.spacing.medium, padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium,
      fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s, filter 0.2s',
      border: 'none', width: '100%', minHeight: '48px',
    },
    primaryButton: { backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent, },
    toggleText: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, marginTop: theme.spacing.medium },
    toggleLink: { color: theme.colors.accent2, fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none', },
    forgotLink: { 
        fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, 
        cursor: 'pointer', textDecoration: 'underline', alignSelf: 'flex-end',
        marginTop: `-${theme.spacing.small}` 
    },
    errorText: {
        color: theme.colors.loss, backgroundColor: `${theme.colors.loss}20`,
        padding: theme.spacing.small, borderRadius: theme.borderRadius.medium,
        fontSize: theme.typography.fontSize.small,
    },
    successText: {
        color: theme.colors.win, backgroundColor: `${theme.colors.win}20`,
        padding: theme.spacing.small, borderRadius: theme.borderRadius.medium,
        fontSize: theme.typography.fontSize.small,
    }
  };

  const getTitle = () => {
      if (mode === 'login') return 'Iniciar Sesión';
      if (mode === 'register') return 'Crear Cuenta';
      return 'Recuperar Contraseña';
  }

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }
      `}</style>
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={onClose} aria-label="Cerrar modal"><CloseIcon color={theme.colors.primaryText} /></button>
            <div style={styles.content}>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <h2 style={{margin: 0, fontSize: '1.5rem', color: theme.colors.primaryText}}>{getTitle()}</h2>
                    
                    {error && <p style={styles.errorText}>{error}</p>}
                    {successMessage && <p style={styles.successText}>{successMessage}</p>}
                    
                    {mode === 'register' && (
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" style={styles.input} required />
                    )}
                    
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" style={styles.input} required />
                    
                    {mode !== 'forgot' && (
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" style={styles.input} required />
                    )}

                    {mode === 'login' && (
                        <span onClick={goToForgot} style={styles.forgotLink}>¿Olvidaste tu contraseña?</span>
                    )}

                    <button type="submit" disabled={isLoading} style={{...styles.button, ...styles.primaryButton}}>
                        {isLoading ? <Loader /> : (mode === 'login' ? 'Iniciar Sesión' : (mode === 'register' ? 'Registrarse' : 'Enviar Correo'))}
                    </button>
                </form>

                {mode === 'forgot' ? (
                    <p style={styles.toggleText}>
                        <a onClick={backToLogin} style={styles.toggleLink}>
                            &larr; Volver a Iniciar Sesión
                        </a>
                    </p>
                ) : (
                    <p style={styles.toggleText}>
                        {mode === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
                        <a onClick={toggleMode} style={styles.toggleLink}>
                            {mode === 'login' ? ' Regístrate' : ' Inicia sesión'}
                        </a>
                    </p>
                )}
            </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalJSX, document.body);
};

export default LoginModal;
