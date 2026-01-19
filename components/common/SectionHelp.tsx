
import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { HelpIcon } from '../icons/HelpIcon';
import TutorialModal from '../modals/TutorialModal';
import { TutorialStep } from '../../types';

interface SectionHelpProps {
  steps: TutorialStep[];
}

const SectionHelp: React.FC<SectionHelpProps> = ({ steps }) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.colors.secondaryText,
                    marginLeft: '8px',
                    padding: '4px',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.secondaryText}15`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                aria-label="Ayuda de sección"
                title="Ver guía de esta sección"
                type="button"
            >
                <HelpIcon size={18} />
            </button>
            <TutorialModal 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)} 
                steps={steps}
            />
        </>
    );
};

export default SectionHelp;
