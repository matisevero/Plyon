
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { SparklesIcon } from './icons/SparklesIcon';
import { Loader } from './Loader';
import { CloseIcon } from './icons/CloseIcon';
import { parseMatchesFromText, parseMatchFromImage } from '../services/geminiService';
import type { Match } from '../types';
import Waveform from './effects/Waveform';
import { FootballIcon } from './icons/FootballIcon';
import { ImageIcon } from './icons/ImageIcon';

interface QuickEntryMenuProps {
    onDataParsed: (data: Partial<Match>) => void;
}

const QuickEntryMenu: React.FC<QuickEntryMenuProps> = ({ onDataParsed }) => {
    const { theme } = useTheme();
    const { checkAILimit, addAIInteraction } = useData();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [modalMode, setModalMode] = useState<'voice' | 'image' | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup function to ensure mic is turned off
    const cleanupMic = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                recognitionRef.current.abort(); // Force stop
            } catch (e) {
                console.error("Error stopping mic:", e);
            }
            recognitionRef.current = null;
        }
        setIsListening(false);
    };

    // Effect to clean up on unmount
    useEffect(() => {
        return () => cleanupMic();
    }, []);

    // -- Voice Logic --
    const startListening = () => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }

        try {
            checkAILimit();
        } catch (e: any) {
            alert(e.message);
            return;
        }

        setModalMode('voice');
        setIsListening(true);
        setTranscript('');

        // Reset if exists
        cleanupMic();

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setTranscript(prev => prev + ' ' + finalTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            if (event.error === 'not-allowed') {
                alert("Permiso de micrófono denegado.");
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            // Auto-restart if we didn't explicitly stop (optional, but keep it simple for now)
            if (isListening) {
                 // setIsListening(false);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListening = () => {
        cleanupMic();
    };

    const processTranscript = async () => {
        cleanupMic(); // Ensure mic is off before processing
        
        if (!transcript.trim()) return;
        setIsProcessing(true);
        try {
            const matches = await parseMatchesFromText(transcript);
            if (matches && matches.length > 0) {
                onDataParsed(matches[0]);
                await addAIInteraction('match_summary', { summary: `Voz: "${transcript}"` });
                closeModal();
            } else {
                alert("No pude entender los datos. Intenta decir: 'Ganamos 5 a 4 con 2 goles mios'.");
            }
        } catch (e) {
            console.error(e);
            alert("Error al procesar el audio.");
        } finally {
            setIsProcessing(false);
        }
    };

    // -- Image Logic --
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImagePreview(ev.target?.result as string);
                setModalMode('image');
            };
            reader.readAsDataURL(file);
        }
    };

    const processImage = async () => {
        if (!imagePreview) return;
        
        try {
            checkAILimit();
        } catch (e: any) {
            alert(e.message);
            return;
        }

        setIsProcessing(true);
        try {
            const matchData = await parseMatchFromImage(imagePreview);
            onDataParsed(matchData);
            await addAIInteraction('match_summary', { summary: `Imagen analizada` });
            closeModal();
        } catch (e) {
            console.error(e);
            alert("Error al analizar la imagen.");
        } finally {
            setIsProcessing(false);
        }
    };

    const closeModal = () => {
        cleanupMic();
        setModalMode(null);
        setTranscript('');
        setImagePreview(null);
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const styles: { [key: string]: React.CSSProperties } = {
        // Trigger Buttons
        container: {
            display: 'flex',
            gap: theme.spacing.medium,
        },
        actionButton: {
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '42px',
            padding: '0 16px',
            borderRadius: theme.borderRadius.medium,
            border: '2px solid transparent',
            background: `
                linear-gradient(${theme.colors.surface}, ${theme.colors.surface}) padding-box, 
                linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2}) border-box
            `,
            color: theme.colors.primaryText,
            cursor: 'pointer',
            transition: 'filter 0.2s, transform 0.1s',
            boxShadow: theme.shadows.small,
            fontWeight: 700,
            fontSize: '0.9rem',
        },
        photoButton: {
            background: `
                linear-gradient(${theme.colors.surface}, ${theme.colors.surface}) padding-box, 
                linear-gradient(90deg, ${theme.colors.accent2}, #5C6BC0) border-box
            `,
        },

        // Modal
        backdrop: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: theme.spacing.medium, backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease'
        },
        modalCard: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.large,
            boxShadow: theme.shadows.large,
            border: `1px solid ${theme.colors.border}`,
            width: '100%', maxWidth: '500px',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative'
        },
        header: {
            padding: theme.spacing.large,
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: theme.colors.background
        },
        title: {
            margin: 0, fontSize: '1.25rem', fontWeight: 800,
            color: theme.colors.primaryText,
            display: 'flex', alignItems: 'center', gap: '8px'
        },
        titleGradient: {
            background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        },
        content: {
            padding: theme.spacing.large,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.large,
            minHeight: '250px', justifyContent: 'center'
        },
        transcriptBox: {
            width: '100%',
            padding: theme.spacing.medium,
            borderRadius: theme.borderRadius.medium,
            backgroundColor: theme.colors.background,
            border: `1px solid ${theme.colors.borderStrong}`,
            color: theme.colors.primaryText,
            fontSize: '1.1rem',
            lineHeight: 1.5,
            minHeight: '100px',
            boxSizing: 'border-box',
            textAlign: 'center'
        },
        placeholderText: {
            color: theme.colors.secondaryText,
            fontStyle: 'italic'
        },
        controls: {
            display: 'flex',
            gap: theme.spacing.medium,
            width: '100%',
            marginTop: 'auto'
        },
        button: {
            flex: 1,
            padding: '12px',
            borderRadius: theme.borderRadius.medium,
            border: 'none',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'transform 0.1s'
        },
        recordBtn: {
            backgroundColor: theme.colors.loss,
            color: '#fff',
            boxShadow: `0 0 15px ${theme.colors.loss}60`,
            animation: isListening ? 'pulse-red 1.5s infinite' : 'none'
        },
        confirmBtn: {
            backgroundColor: theme.colors.accent1,
            color: theme.colors.textOnAccent
        },
        cancelBtn: {
            backgroundColor: 'transparent',
            border: `1px solid ${theme.colors.borderStrong}`,
            color: theme.colors.secondaryText
        },
        imagePreview: {
            width: '100%',
            maxHeight: '300px',
            objectFit: 'contain',
            borderRadius: theme.borderRadius.medium,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: '#000'
        }
    };

    const modalContent = (
        <div style={styles.backdrop} onClick={closeModal}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(255, 82, 82, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); } }
            `}</style>
            
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>
                        <SparklesIcon size={24} color={theme.colors.accent1} /> 
                        <span style={styles.titleGradient}>
                            {modalMode === 'voice' ? 'Asistente de Voz' : 'Escáner de Imagen'}
                        </span>
                    </h3>
                    <button 
                        onClick={closeModal} 
                        style={{background:'none', border:'none', cursor:'pointer', padding: '4px'}}
                    >
                        <CloseIcon size={24} color={theme.colors.primaryText} />
                    </button>
                </div>

                <div style={styles.content}>
                    {isProcessing ? (
                        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem'}}>
                            <Loader />
                            <p style={{color: theme.colors.secondaryText, margin: 0}}>Procesando información...</p>
                        </div>
                    ) : modalMode === 'voice' ? (
                        <>
                            <div style={{height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'}}>
                                {isListening ? (
                                    <Waveform />
                                ) : (
                                    <div style={{opacity: 0.3}}><Waveform /></div> // Static or grayed out
                                )}
                            </div>
                            
                            <div style={styles.transcriptBox}>
                                {transcript ? (
                                    transcript
                                ) : (
                                    <span style={styles.placeholderText}>
                                        {isListening ? "Escuchando... di el resultado, goles y asistencias." : "Presiona el micrófono para empezar."}
                                    </span>
                                )}
                            </div>

                            <div style={styles.controls}>
                                {isListening ? (
                                    <button 
                                        type="button" 
                                        style={{...styles.button, ...styles.recordBtn}}
                                        onClick={stopListening}
                                    >
                                        ⏹ Detener
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        style={{...styles.button, backgroundColor: theme.colors.accent2, color: '#fff'}}
                                        onClick={startListening}
                                    >
                                        🎙️ Grabar
                                    </button>
                                )}

                                {transcript && !isListening && (
                                    <button 
                                        type="button" 
                                        style={{...styles.button, ...styles.confirmBtn}}
                                        onClick={processTranscript}
                                    >
                                        <SparklesIcon size={18} /> Procesar
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {imagePreview && (
                                <img src={imagePreview} alt="Preview" style={styles.imagePreview} />
                            )}
                            <div style={styles.controls}>
                                <button 
                                    type="button" 
                                    style={{...styles.button, ...styles.cancelBtn}}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Cambiar Foto
                                </button>
                                <button 
                                    type="button" 
                                    style={{...styles.button, ...styles.confirmBtn}}
                                    onClick={processImage}
                                >
                                    <SparklesIcon size={18} /> Extraer Datos
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div style={styles.container}>
                <button 
                    type="button"
                    style={styles.actionButton}
                    onClick={startListening}
                    onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.95)'}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                    <span style={styles.icon}>🎙️</span>
                    <span>Voz</span>
                </button>
                
                <button 
                    type="button"
                    style={{...styles.actionButton, ...styles.photoButton}}
                    onClick={() => fileInputRef.current?.click()}
                    onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.95)'}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                    <span style={styles.icon}>📸</span>
                    <span>Foto</span>
                </button>
                <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{display: 'none'}} 
                    onChange={handleImageSelect}
                />
            </div>

            {modalMode && createPortal(modalContent, document.body)}
        </>
    );
};

export default QuickEntryMenu;
