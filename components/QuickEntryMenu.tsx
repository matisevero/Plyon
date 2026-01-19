
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { SparklesIcon } from './icons/SparklesIcon';
import { Loader } from './Loader';
import { CloseIcon } from './icons/CloseIcon';
import { parseMatchesFromText, parseMatchFromImage } from '../services/geminiService';
import type { Match } from '../types';
import Waveform from './effects/Waveform';

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

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'es-ES';
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setTranscript(prev => prev + ' ' + finalTranscript);
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error(event.error);
            setIsListening(false);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const processTranscript = async () => {
        if (!transcript.trim()) return;
        setIsProcessing(true);
        try {
            const matches = await parseMatchesFromText(transcript);
            if (matches && matches.length > 0) {
                onDataParsed(matches[0]);
                await addAIInteraction('match_summary', { summary: `Voz: "${transcript}"` });
                closeModal();
            } else {
                alert("No pude entender los datos del partido. Intenta ser más específico.");
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
        setModalMode(null);
        setTranscript('');
        setImagePreview(null);
        setIsProcessing(false);
        setIsListening(false);
        if (recognitionRef.current) recognitionRef.current.stop();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const styles: { [key: string]: React.CSSProperties } = {
        container: {
            display: 'flex',
            gap: theme.spacing.medium,
            // marginBottom: removed to let parent control layout
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
            
            // Gradient Border Logic:
            // 1. Inner background matches surface color
            // 2. Border is transparent but backed by the gradient box
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
            // Distinct gradient for photo
            background: `
                linear-gradient(${theme.colors.surface}, ${theme.colors.surface}) padding-box, 
                linear-gradient(90deg, ${theme.colors.accent2}, #5C6BC0) border-box
            `,
        },
        icon: { 
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center'
        },
        
        // Modal Styles
        backdrop: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: theme.spacing.medium, backdropFilter: 'blur(5px)'
        },
        modal: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.large,
            padding: theme.spacing.extraLarge,
            width: '100%', maxWidth: '400px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            position: 'relative', border: `1px solid ${theme.colors.border}`
        },
        closeBtn: {
            position: 'absolute', top: 10, right: 10,
            background: 'none', border: 'none', cursor: 'pointer'
        },
        transcriptBox: {
            width: '100%', minHeight: '100px',
            backgroundColor: theme.colors.background,
            padding: theme.spacing.medium,
            borderRadius: theme.borderRadius.medium,
            margin: '1rem 0',
            fontSize: '1rem',
            color: theme.colors.primaryText,
            border: `1px solid ${theme.colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        },
        listeningIndicator: {
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            marginBottom: '1rem'
        },
        listeningText: {
            color: theme.colors.accent1, fontWeight: 'bold', fontSize: '0.9rem'
        },
        primaryBtn: {
            backgroundColor: theme.colors.accent1,
            color: theme.colors.textOnAccent,
            padding: '12px 24px',
            borderRadius: '24px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: 'pointer',
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        },
        previewImg: {
            width: '100%', maxHeight: '300px', objectFit: 'contain',
            borderRadius: theme.borderRadius.medium, marginBottom: '1rem'
        }
    };

    return (
        <>
            <div style={styles.container}>
                <button 
                    style={styles.actionButton}
                    onClick={startListening}
                    onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.95)'}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                    <span style={styles.icon}>🎙️</span>
                    <span>Voz</span>
                </button>
                
                <button 
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

            {/* Modal for Voice/Image */}
            {modalMode && (
                <div style={styles.backdrop} onClick={closeModal}>
                    <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <button style={styles.closeBtn} onClick={closeModal}><CloseIcon color={theme.colors.primaryText}/></button>
                        
                        <h3 style={{margin: '0 0 1rem 0', color: theme.colors.primaryText}}>
                            {modalMode === 'voice' ? 'Cuéntame el partido' : 'Analizar Imagen'}
                        </h3>

                        {modalMode === 'voice' && (
                            <>
                                {isListening ? (
                                    <div style={styles.listeningIndicator}>
                                        <Waveform />
                                        <span style={styles.listeningText}>Escuchando...</span>
                                    </div>
                                ) : (
                                    <div style={{color: theme.colors.secondaryText, marginBottom: '1rem'}}>Grabación detenida</div>
                                )}
                                <div style={styles.transcriptBox}>
                                    {transcript ? (
                                        <span style={{textAlign: 'left', width: '100%'}}>{transcript}</span>
                                    ) : (
                                        <span style={{opacity: 0.5, fontStyle: 'italic', textAlign: 'center'}}>
                                            Di algo como: "Ganamos 5 a 4, metí 3 goles. Jugué con Mati y Juan contra el equipo de Lucas."
                                        </span>
                                    )}
                                </div>
                                <div style={{display: 'flex', gap: '10px', width: '100%'}}>
                                    {isListening ? (
                                        <button onClick={stopListening} style={{...styles.primaryBtn, backgroundColor: theme.colors.loss}}>
                                            Detener
                                        </button>
                                    ) : (
                                        <button onClick={processTranscript} disabled={!transcript || isProcessing} style={styles.primaryBtn}>
                                            {isProcessing ? <Loader/> : <SparklesIcon />}
                                            {isProcessing ? 'Procesando...' : 'Analizar'}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {modalMode === 'image' && (
                            <>
                                {imagePreview && <img src={imagePreview} style={styles.previewImg} alt="preview" />}
                                <button onClick={processImage} disabled={isProcessing} style={styles.primaryBtn}>
                                    {isProcessing ? <Loader/> : <SparklesIcon />}
                                    {isProcessing ? 'Analizando...' : 'Extraer Datos'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default QuickEntryMenu;
