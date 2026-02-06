import React from 'react';
import styles from './SegmentedControl.module.css';

interface SegmentedControlProps {
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, selectedValue, onSelect }) => {
  return (
    <div className={styles.container}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`${styles.button} ${selectedValue === option.value ? styles.buttonActive : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
