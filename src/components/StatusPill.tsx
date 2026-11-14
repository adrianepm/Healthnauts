import React from 'react';
import { StatusLevel } from '../types';
import { getStatusInfo } from '../lib/status';
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

interface StatusPillProps {
  level: StatusLevel;
  customText?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  level,
  customText,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const info = getStatusInfo(level);

  const renderIcon = () => {
    const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;
    switch (info.iconName) {
      case 'CheckCircle':
        return <CheckCircle2 size={iconSize} className="shrink-0" />;
      case 'AlertTriangle':
        return <AlertTriangle size={iconSize} className="shrink-0" />;
      case 'AlertOctagon':
        return <AlertOctagon size={iconSize} className="shrink-0" />;
      case 'HelpCircle':
      default:
        return <HelpCircle size={iconSize} className="shrink-0" />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full transition-all duration-200 ${info.badgeClass} ${sizeClasses} ${className}`}
      title={info.label}
    >
      {showIcon && renderIcon()}
      <span className="truncate">{customText || info.label.split('·')[0].trim()}</span>
    </span>
  );
};
