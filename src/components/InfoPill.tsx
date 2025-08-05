// components/InfoPill.tsx
import React from 'react';

type InfoPillProps = {
  icon: React.ElementType;
  text: string;
  highlight?: boolean;
};

const InfoPill: React.FC<InfoPillProps> = ({ icon: Icon, text, highlight = false }) => {
  const baseClasses = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium';
  const colorClasses = highlight
    ? 'bg-purple-100 text-purple-800'
    : 'bg-gray-100 text-gray-700';

  return (
    <div className={`${baseClasses} ${colorClasses}`}>
      <Icon className="w-4 h-4" />
      <span>{text}</span>
    </div>
  );
};

export default InfoPill;