// components/trials/Toolbar.tsx
'use client';

import React from 'react';
import { List, Map } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type ToolbarProps = {
  view: 'list' | 'map';
  setView: (view: 'list' | 'map') => void;
  resultCount: number;
};

export const Toolbar: React.FC<ToolbarProps> = ({ view, setView, resultCount }) => {
  const baseButtonStyles = "p-2 rounded-md transition-colors";
  const activeButtonStyles = "bg-purple-100 text-purple-700";
  const inactiveButtonStyles = "bg-white text-gray-500 hover:bg-gray-100";

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="text-gray-500 w-full md:w-auto">
        <span className="font-medium text-gray-700">Search</span> | Anal Carcinoma
      </div>
      <div className="flex items-center gap-4 w-full md:w-auto">
        <p className="text-sm text-gray-600 flex-grow">
          Showing 1-{resultCount} of {resultCount} results
        </p>
        <div className="flex items-center border rounded-md p-1">
          <button 
            onClick={() => setView('list')}
            className={`${baseButtonStyles} ${view === 'list' ? activeButtonStyles : inactiveButtonStyles}`}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView('map')}
            className={`${baseButtonStyles} ${view === 'map' ? activeButtonStyles : inactiveButtonStyles}`}
            aria-label="Map view"
          >
            <Map className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};