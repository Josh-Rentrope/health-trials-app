// components/trials/FilterSidebar.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { SlidersHorizontal, Search, BarChart } from 'lucide-react';
// --- FIX: Import the new setViewMode function and ViewMode type ---
import { useTrialStore, ViewMode } from '@/stores/trialStore';

const demographicOptions = [
    { value: 'v021_raw_value', label: '% 65 and over' },
    { value: 'v001_raw_value', label: 'Premature Death Rate' },
    { value: 'v011_raw_value', label: 'Adult Obesity Rate' },
    { value: 'v009_raw_value', label: 'Adult Smoking Rate' },
    { value: 'v057_raw_value', label: 'Children in Poverty Rate' },
    { value: 'v043_raw_value', label: '% Uninsured' },
];

export const FilterSidebar: React.FC<any> = ({ isLoading }) => {
  // --- FIX: Get viewMode and setViewMode from the store ---
  const { filters, setFilters, resetFilters, viewMode, setViewMode } = useTrialStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ [name]: value });
  };
  
  const handleClear = () => {
    resetFilters();
  };

  const handleTabClick = (tab: ViewMode) => {
    setViewMode(tab);
  };

  const renderTrialFilters = () => (
    <>
      <div className="space-y-2">
        <label htmlFor="condition" className="font-semibold text-gray-800 text-sm">Condition or Disease</label>
        <input type="text" name="condition" id="condition" value={filters.condition} onChange={handleInputChange} className="w-full border-gray-300 text-gray-500 rounded-md shadow-sm"/>
      </div>
      {/* ... other trial filters like status, phase, location ... */}
    </>
  );

  const renderCorrelationFilters = () => (
      <>
        <div className="space-y-2">
            <label htmlFor="correlationCondition" className="font-semibold text-gray-800 text-sm">Condition of Interest</label>
            <input type="text" name="correlationCondition" id="correlationCondition" value={filters.correlationCondition} onChange={handleInputChange} className="w-full border-gray-300 text-gray-500 rounded-md shadow-sm"/>
        </div>
        <div className="space-y-2">
            <label htmlFor="demographicVariable" className="font-semibold text-gray-800 text-sm">Demographic Focus</label>
            <select name="demographicVariable" id="demographicVariable" value={filters.demographicVariable} onChange={handleInputChange} className="w-full border-gray-300 text-gray-800 rounded-md shadow-sm">
                <option value="">Select a demographic</option>
                {demographicOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
      </>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" /> Filters
        </h3>
        <button onClick={handleClear} className="text-sm text-purple-600 hover:underline">
            Clear All
        </button>
      </div>

      <div className="flex border-b">
          {/* --- FIX: Use handleTabClick to update global state --- */}
          <button onClick={() => handleTabClick('trials')} className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 ${viewMode === 'trials' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Search size={16} /> Trial Search
          </button>
          <button onClick={() => handleTabClick('correlation')} className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 ${viewMode === 'correlation' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500 hover:bg-gray-100'}`}>
              <BarChart size={16} /> Correlation Map
          </button>
      </div>
      
      <div className="p-6 space-y-6">
          {viewMode === 'trials' ? renderTrialFilters() : renderCorrelationFilters()}
      </div>
    </div>
  );
};
