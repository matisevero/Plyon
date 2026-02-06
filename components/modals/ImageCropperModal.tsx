
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { CloseIcon } from '../icons/CloseIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { Loader } from '../Loader';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedImage: string) => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const { theme } = useTheme();
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  // --- Drag Logic ---
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    setOffset({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // --- Crop Logic ---
  const handleSave = async () => {
      if (!imageRef.current) return;
      setIsProcessing(true);

      // Create an off-screen canvas for the high-res crop
      const canvas = document.createElement('canvas');
      const size = 400; // Output size
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (ctx) {
          // Fill background (optional, but good for transparency)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);

          // We need to map the visual offset/zoom to the canvas coordinate system.
          // The visual container is usually smaller (e.g. 250px) than the output (400px).
          // We assume the visual preview is a "window" into the image.
          
          const img = imageRef.current;
          
          // Center origin
          ctx.translate(size / 2, size / 2);
          
          // Apply User Transformations
          // Note: We need to scale the offset by the ratio of OutputSize / VisualSize
          // Assuming the visual container is roughly 280px (based on styles below)
          const visualSize = 280; 
          const ratio = size / visualSize;

          ctx.translate(offset.x * ratio, offset.y * ratio);
          ctx.scale(zoom, zoom);
          
          // Draw image centered
          // We draw the image such that its center aligns with the current context origin
          // We need to figure out the scaling of the image relative to the visual container first.
          // In the CSS, the image is rendered 'naturally' but scaled by 'zoom'.
          // Here we draw it natural size, but the context is already zoomed.
          // However, we need to respect the aspect ratio fit.
          
          let drawWidth = img.naturalWidth;
          let drawHeight = img.naturalHeight;
          
          // Visual containment logic approximation:
          // In CSS, we usually object-fit: contain or cover? 
          // Here we will draw the image "as is" relative to the center.
          // If the image is huge, zoom=1 might still be huge. 
          // We should normalize the image to fit the box initially.
          
          const scaleToFit = Math.min(size / drawWidth, size / drawHeight);
          // Apply initial scale-to-fit so zoom=1 means "fit to box" roughly
          // But actually, for profile pics, usually we want "cover".
          const scaleToCover = Math.max(size / drawWidth, size / drawHeight);
          
          ctx.scale(scaleToCover, scaleToCover);

          ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          onCropComplete(dataUrl);
      }
      
      setIsProcessing(false);
      onClose();
  };

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 4000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
        backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
        width: '100%', maxWidth: '400px',
        display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s ease',
        border: `1px solid ${theme.colors.border}`,
        overflow: 'hidden'
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: theme.spacing.medium, borderBottom: `1px solid ${theme.colors.border}`,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    content: {
        padding: theme.spacing.large,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.large,
    },
    cropArea: {
        width: '280px', height: '280px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000',
        borderRadius: theme.borderRadius.medium,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none', // Prevent scrolling on mobile while dragging
    },
    image: {
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
        transformOrigin: 'center',
        pointerEvents: 'none', // Let events bubble to container
        maxWidth: '100%',
        maxHeight: '100%',
        // Initial centering trick:
        position: 'absolute',
        top: '50%', left: '50%',
        // We use a separate transform for the centering to avoid conflict with user offset
        // Actually, easiest is to translate(-50%, -50%) on the wrapper or here
        // Let's do it in the style object construction below
        marginTop: '-50%', marginLeft: '-50%', // Rough centering attempt for varying aspect ratios? 
        // Better: Object-fit cover behavior via CSS is hard to combine with custom transform/drag.
        // Simplified: Just render img naturally centered, user scales/moves it.
        minWidth: '100%', minHeight: '100%',
        objectFit: 'cover' 
    },
    mask: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        // Circle mask with dark overlay outside
        background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.7) 51%)',
        pointerEvents: 'none',
        zIndex: 10
    },
    controls: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    slider: {
        width: '100%',
        accentColor: theme.colors.accent1,
        height: '6px',
        borderRadius: '3px',
    },
    sliderLabel: {
        display: 'flex', justifyContent: 'space-between',
        fontSize: '0.8rem', color: theme.colors.secondaryText
    },
    footer: {
        padding: theme.spacing.medium,
        borderTop: `1px solid ${theme.colors.border}`,
        display: 'flex', gap: theme.spacing.medium
    },
    button: {
        flex: 1, padding: '12px', borderRadius: theme.borderRadius.medium,
        fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        border: 'none'
    }
  };

  // Improved Image Style for centering
  const imgStyle: React.CSSProperties = {
      position: 'absolute',
      left: '50%', top: '50%',
      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
      maxHeight: 'none', maxWidth: 'none', // Allow it to overflow
      // We want the image to cover the box initially
      height: '100%', // Base size
      width: 'auto',  // Preserve Aspect Ratio based on height
      minWidth: '100%', // Ensure it covers width
      userSelect: 'none',
      pointerEvents: 'none'
  };

  // Determine if width or height should be 100% based on aspect ratio would require onLoad
  // For simplicity, we default to min-width/height 100% so it covers.

  return createPortal(
    <div style={styles.backdrop}>
        <style>{`@keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        <div style={styles.modal}>
            <div style={styles.header}>
                <h3 style={styles.title}>Encuadrar Foto</h3>
                <button onClick={onClose} style={{background: 'none', border: 'none', cursor: 'pointer'}}><CloseIcon color={theme.colors.primaryText} /></button>
            </div>
            
            <div style={styles.content}>
                <div 
                    style={styles.cropArea}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchEnd={handleMouseUp}
                    ref={containerRef}
                >
                    <img 
                        ref={imageRef}
                        src={imageSrc} 
                        alt="Crop target" 
                        style={imgStyle}
                        draggable={false}
                    />
                    <div style={styles.mask} />
                </div>

                <div style={styles.controls}>
                    <div style={styles.sliderLabel}>
                        <span>Zoom</span>
                        <span>{(zoom * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="3" 
                        step="0.05" 
                        value={zoom} 
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        style={styles.slider}
                    />
                    <p style={{textAlign: 'center', fontSize: '0.8rem', color: theme.colors.secondaryText, margin: 0}}>
                        Arrastra para mover • Usa el slider para acercar
                    </p>
                </div>
            </div>

            <div style={styles.footer}>
                <button 
                    onClick={onClose} 
                    style={{...styles.button, backgroundColor: 'transparent', border: `1px solid ${theme.colors.borderStrong}`, color: theme.colors.primaryText}}
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSave} 
                    disabled={isProcessing}
                    style={{...styles.button, backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent}}
                >
                    {isProcessing ? <Loader /> : <><CheckIcon size={18} /> Guardar Foto</>}
                </button>
            </div>
        </div>
    </div>,
    document.body
  );
};

export default ImageCropperModal;
