
import React, { useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { addActivity } from '../../services/firebaseService';
import { FootballIcon } from '../icons/FootballIcon';
import { ImageIcon } from '../icons/ImageIcon';
import { Loader } from '../Loader';
import { GlobeIcon } from '../icons/GlobeIcon';
import { LinkIcon } from '../icons/LinkIcon';
import { ChevronIcon } from '../icons/ChevronIcon';

const MOODS = [
    { id: 'matchday', label: 'Día de Partido', icon: '🏟️' },
    { id: 'training', label: 'Entrenando', icon: '🏋️' },
    { id: 'recovery', label: 'Recuperación', icon: '🧊' },
    { id: 'injured', label: 'Lesionado', icon: '🤕' },
    { id: 'celebrating', label: 'Celebrando', icon: '🎉' },
    { id: 'watching', label: 'Viendo fútbol', icon: '📺' },
    { id: 'thinking', label: 'Pensando', icon: '🤔' },
];

const PlyrStatusComposer: React.FC = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { playerProfile } = useData();
    
    const [text, setText] = useState('');
    
    // Mood State
    const [selectedMood, setSelectedMood] = useState(MOODS[0]);
    const [isMoodSelectorOpen, setIsMoodSelectorOpen] = useState(false);
    const [isCustomMood, setIsCustomMood] = useState(false);
    const [customEmoji, setCustomEmoji] = useState('⚽️');
    const [customLabel, setCustomLabel] = useState('');

    const [location, setLocation] = useState('');
    const [showLocationInput, setShowLocationInput] = useState(false);
    const [videoLink, setVideoLink] = useState('');
    const [showVideoInput, setShowVideoInput] = useState(false);
    
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPosting, setIsPosting] = useState(false);

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; 
                const MAX_HEIGHT = 800;
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
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        });
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await compressImage(e.target.files[0]);
                setSelectedImage(base64);
            } catch (err) {
                console.error("Error processing image", err);
                alert("Error al procesar la imagen");
            }
        }
    };

    const handlePost = async () => {
        if (!user || (!text.trim() && !selectedImage)) return;
        setIsPosting(true);
        
        try {
            const finalMoodIcon = isCustomMood ? customEmoji : selectedMood.icon;
            const finalMoodLabel = isCustomMood ? customLabel : selectedMood.label;
            const finalMoodId = isCustomMood ? 'custom' : selectedMood.id;

            await addActivity({
                userId: user.uid,
                userName: playerProfile.name || 'Plyr',
                userPhoto: playerProfile.photo,
                type: 'post',
                title: `${finalMoodIcon} ${finalMoodLabel}`,
                description: text,
                metadata: {
                    mood: finalMoodId,
                    moodIcon: finalMoodIcon,
                    image: selectedImage || undefined,
                    videoUrl: videoLink || undefined,
                    location: location || undefined
                }
            });
            
            // Reset form
            setText('');
            setSelectedImage(null);
            setVideoLink('');
            setLocation('');
            setShowLocationInput(false);
            setShowVideoInput(false);
            if(fileInputRef.current) fileInputRef.current.value = '';
            
        } catch (e) {
            console.error(e);
            alert("Error al publicar estado");
        } finally {
            setIsPosting(false);
        }
    };

    const handleMoodSelect = (mood: typeof MOODS[0] | 'custom') => {
        if (mood === 'custom') {
            setIsCustomMood(true);
        } else {
            setIsCustomMood(false);
            setSelectedMood(mood);
        }
        setIsMoodSelectorOpen(false);
    };

    const styles: { [key: string]: React.CSSProperties } = {
        container: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.large,
            border: `1px solid ${theme.colors.border}`,
            padding: theme.spacing.medium,
            marginBottom: theme.spacing.large,
            boxShadow: theme.shadows.small
        },
        // Mood Section moved to top
        moodSection: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: theme.spacing.small,
            position: 'relative',
        },
        moodBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            border: 'none',
            background: theme.colors.background,
            color: theme.colors.primaryText,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
        },
        customMoodContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        },
        emojiInput: {
            width: '30px',
            height: '30px',
            textAlign: 'center',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '6px',
            backgroundColor: theme.colors.background,
            color: theme.colors.primaryText,
            fontSize: '1.2rem',
            padding: 0,
        },
        moodTextInput: {
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '6px',
            backgroundColor: theme.colors.background,
            color: theme.colors.primaryText,
            padding: '4px 8px',
            fontSize: '0.85rem',
            width: '120px',
        },
        cancelCustomBtn: {
            background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondaryText
        },
        // Main Input Area Wrapper
        inputWrapper: {
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${theme.colors.borderStrong}`,
            borderRadius: theme.borderRadius.medium,
            backgroundColor: theme.colors.background,
            padding: theme.spacing.medium,
            position: 'relative',
        },
        textarea: {
            width: '100%',
            border: 'none',
            background: 'transparent',
            color: theme.colors.primaryText,
            fontSize: '1rem',
            resize: 'none',
            outline: 'none',
            minHeight: '60px',
            fontFamily: theme.typography.fontFamily,
            marginBottom: '40px', // Space for bottom icons
        },
        bottomToolbar: {
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            display: 'flex',
            gap: '4px',
        },
        iconBtn: {
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.colors.secondaryText, // Muted color by default
            transition: 'color 0.2s, background-color 0.2s',
        },
        activeIconBtn: {
            color: theme.colors.accent2,
            backgroundColor: `${theme.colors.accent2}15`,
        },
        postBtnContainer: {
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: theme.spacing.medium,
        },
        postBtn: {
            backgroundColor: theme.colors.accent1,
            color: theme.colors.textOnAccent,
            border: 'none',
            padding: '8px 20px',
            borderRadius: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            opacity: (!text.trim() && !selectedImage) || isPosting ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        previewImage: {
            width: '100%',
            maxHeight: '200px',
            objectFit: 'cover',
            borderRadius: theme.borderRadius.medium,
            marginTop: theme.spacing.small,
            border: `1px solid ${theme.colors.border}`
        },
        extraInputContainer: {
            marginTop: theme.spacing.small,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.small,
            animation: 'fadeIn 0.2s ease',
            paddingTop: '8px',
            borderTop: `1px dashed ${theme.colors.border}`
        },
        extraInput: {
            flex: 1,
            padding: '6px 10px',
            borderRadius: theme.borderRadius.small,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.surface,
            color: theme.colors.primaryText,
            fontSize: '0.85rem'
        },
        moodDropdown: {
            position: 'absolute',
            top: '100%',
            left: 0,
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.medium,
            boxShadow: theme.shadows.large,
            zIndex: 10,
            padding: '8px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            width: '280px',
            marginTop: '4px'
        },
        moodOption: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            borderRadius: theme.borderRadius.small,
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            color: theme.colors.primaryText,
            fontSize: '0.85rem'
        },
        customOption: {
            gridColumn: '1 / -1',
            borderTop: `1px solid ${theme.colors.border}`,
            marginTop: '4px',
            paddingTop: '8px',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: theme.colors.accent2
        }
    };

    if (!user) return null;

    return (
        <div style={styles.container}>
            {/* Top: Mood Selector */}
            <div style={styles.moodSection}>
                {isCustomMood ? (
                    <div style={styles.customMoodContainer}>
                        <input 
                            type="text" 
                            value={customEmoji} 
                            onChange={(e) => setCustomEmoji(e.target.value)} 
                            style={styles.emojiInput}
                            maxLength={2}
                        />
                        <input 
                            type="text"
                            placeholder="Tu estado..."
                            value={customLabel}
                            onChange={(e) => setCustomLabel(e.target.value)}
                            style={styles.moodTextInput}
                            autoFocus
                        />
                        <button onClick={() => setIsCustomMood(false)} style={styles.cancelCustomBtn}>✕</button>
                    </div>
                ) : (
                    <>
                        <button 
                            style={styles.moodBtn}
                            onClick={() => setIsMoodSelectorOpen(!isMoodSelectorOpen)}
                        >
                            <span>{selectedMood.icon}</span>
                            <span>{selectedMood.label}</span>
                            <ChevronIcon size={14} isExpanded={isMoodSelectorOpen} />
                        </button>

                        {isMoodSelectorOpen && (
                            <div style={styles.moodDropdown}>
                                {MOODS.map(m => (
                                    <button 
                                        key={m.id} 
                                        style={{...styles.moodOption, backgroundColor: selectedMood.id === m.id ? theme.colors.background : 'transparent'}}
                                        onClick={() => handleMoodSelect(m)}
                                    >
                                        <span>{m.icon}</span> {m.label}
                                    </button>
                                ))}
                                <button 
                                    style={{...styles.moodOption, ...styles.customOption}}
                                    onClick={() => handleMoodSelect('custom')}
                                >
                                    ✏️ Personalizado
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Middle: Text Input with Nested Icons */}
            <div style={styles.inputWrapper}>
                <textarea 
                    style={styles.textarea}
                    placeholder={`¿Qué hay de nuevo, ${playerProfile.name}?`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                
                {selectedImage && (
                    <div style={{position: 'relative', marginBottom: '35px'}}>
                        <img src={selectedImage} style={styles.previewImage} alt="preview" />
                        <button 
                            onClick={() => setSelectedImage(null)}
                            style={{position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer'}}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Extra inputs if toggled */}
                {showLocationInput && (
                    <div style={{...styles.extraInputContainer, marginBottom: '35px'}}>
                        <GlobeIcon size={14} color={theme.colors.secondaryText} />
                        <input 
                            style={styles.extraInput} 
                            placeholder="Ubicación" 
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            autoFocus
                        />
                        <button onClick={() => setShowLocationInput(false)} style={{background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondaryText}}>×</button>
                    </div>
                )}

                {showVideoInput && (
                    <div style={{...styles.extraInputContainer, marginBottom: '35px'}}>
                        <LinkIcon size={14} color={theme.colors.secondaryText} />
                        <input 
                            style={styles.extraInput} 
                            placeholder="Link de video" 
                            value={videoLink}
                            onChange={e => setVideoLink(e.target.value)}
                            autoFocus
                        />
                        <button onClick={() => setShowVideoInput(false)} style={{background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondaryText}}>×</button>
                    </div>
                )}

                {/* Bottom Icons inside wrapper */}
                <div style={styles.bottomToolbar}>
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        style={{display: 'none'}} 
                        onChange={handleImageSelect}
                    />
                    <button 
                        style={{...styles.iconBtn, ...(selectedImage ? styles.activeIconBtn : {})}} 
                        title="Foto"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon size={18} />
                    </button>
                    <button 
                        style={{...styles.iconBtn, ...(showLocationInput ? styles.activeIconBtn : {})}} 
                        title="Ubicación"
                        onClick={() => setShowLocationInput(!showLocationInput)}
                    >
                        <GlobeIcon size={18} />
                    </button>
                    <button 
                        style={{...styles.iconBtn, ...(showVideoInput ? styles.activeIconBtn : {})}} 
                        title="Video Link"
                        onClick={() => setShowVideoInput(!showVideoInput)}
                    >
                        <LinkIcon size={18} />
                    </button>
                </div>
            </div>

            {/* Bottom: Post Button */}
            <div style={styles.postBtnContainer}>
                <button 
                    style={styles.postBtn} 
                    onClick={handlePost} 
                    disabled={(!text.trim() && !selectedImage) || isPosting}
                >
                    {isPosting ? <Loader /> : 'Publicar'}
                </button>
            </div>
        </div>
    );
};

export default PlyrStatusComposer;
