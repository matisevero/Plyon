import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  title,
}) => {
  const { theme } = useTheme();

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    boxShadow: theme.shadows.medium,
    border: `1px solid ${theme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    ...style,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${theme.spacing.medium} ${theme.spacing.large}`,
    borderBottom: `1px solid ${theme.colors.border}`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.large,
    fontWeight: 600,
    color: theme.colors.primaryText,
    margin: 0,
    borderLeft: `4px solid ${theme.colors.accent1}`,
    paddingLeft: theme.spacing.medium,
  };

  const contentStyle: React.CSSProperties = {
    padding: title ? `${theme.spacing.medium} ${theme.spacing.large} ${theme.spacing.large}` : theme.spacing.large,
  };

  return (
    <div style={cardStyle}>
      {title && (
        <div style={headerStyle}>
          <h3 style={titleStyle}>{title}</h3>
        </div>
      )}
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

export default Card;