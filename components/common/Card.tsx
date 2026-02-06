import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  title,
}) => {
  return (
    <div className={styles.card} style={style}>
      {title && (
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>{title}</div>
        </div>
      )}
      <div className={title ? styles.cardContentWithTitle : styles.cardContent}>
        {children}
      </div>
    </div>
  );
};

export default Card;
