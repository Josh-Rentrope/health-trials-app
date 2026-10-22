// components/trial/ViewToggle.tsx
'use client';

import React from 'react';
import { List, Map } from 'lucide-react';


type ViewToggleProps = {
  viewMode: 'list' | 'map';
  setViewMode: (mode: 'list' | 'map') => void;
};

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, setViewMode }) => {
  const baseClasses = 'p-2 rounded-md transition-colors';
  const activeClasses = 'bg-accent text-white';
  const inactiveClasses = 'bg-gray-200 text-gray-600 hover:bg-gray-300';

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => setViewMode('list')}
        className={[baseClasses, viewMode === 'list' ? activeClasses : inactiveClasses].join(" ")}
        aria-label="List view"
      >
        <List size={20} />
      </button>
      <button
        onClick={() => setViewMode('map')}
        className={[baseClasses, viewMode === 'map' ? activeClasses : inactiveClasses].join(" ")}
        aria-label="Map view"
      >
        <Map size={20} />
      </button>
    </div>
  );
};