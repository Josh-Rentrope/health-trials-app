// components/trials/FilterSidebar.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FilterState } from '@/lib/api';
import { Loader2, Mic, SlidersHorizontal } from 'lucide-react';
import { useTrialStore } from '@/stores/trialStore';

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

type FilterSidebarProps = {
  onFilterChange?: (filters: FilterState) => void;
  isLoading?: boolean;
};

const initialFilters: FilterState = {
  condition: '',
  location: 'United States',
  status: [],
  phase: [],
  bounds: null
};

const CheckboxGroup = ({ title, options, selected, onChange }: any) => (
  <div>
    <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
    <div className="space-y-2">
      {Object.entries(options).map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 text-gray-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            checked={selected.includes(key)}
            onChange={() => onChange(key)}
          />
          {label as string}
        </label>
      ))}
    </div>
  </div>
);



export const FilterSidebar: React.FC<FilterSidebarProps> = ({ onFilterChange, isLoading }) => {
  const { filters, setFilters } = useTrialStore();

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();


  useEffect(() => {
    if (transcript) {
      setFilters({ condition: transcript });
    }
  }, [transcript, setFilters]);

  const handleListen = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: false });
    }
  };

  const handleCheckboxChange = (category: 'status' | 'phase', value: string) => {
    const currentValues = filters[category];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    // Update the global store with the new array for the specific category
    setFilters({ [category]: newValues });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Update the global store with the new value for the specific input
    setFilters({ [name]: value });
  };
  
  const handleClear = () => {
    // Reset the filters in the global store to their initial state
    setFilters(initialFilters);
    resetTranscript();
  }


  const handleApply = () => {
    if(onFilterChange){
      onFilterChange(filters);
    }
    
  };
  

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" /> Filters
        </h3>
        <button onClick={handleClear} className="text-sm text-purple-600 hover:underline">Clear All</button>
      </div>

      <div className="space-y-2">
        <label htmlFor="condition" className="font-semibold text-gray-800 text-sm">Condition or Disease</label>
        <div className="flex items-center gap-2">
          <input type="text" name="condition" id="condition" value={filters.condition} onChange={handleInputChange} className="w-full border-gray-300 text-gray-500 rounded-md shadow-sm"/>
          {browserSupportsSpeechRecognition && (
            <button onClick={handleListen} className="p-2 border rounded-md hover:bg-gray-100">
              {listening ? <Loader2 className="animate-spin" /> : <Mic />}
            </button>
          )}
        </div>
        
      </div>
      <div className="space-y-2">
        <label htmlFor="location" className="font-semibold text-gray-800 text-sm">Location</label>
        <input type="text" name="location" id="location" value={filters.location} onChange={handleInputChange} className="w-full border-gray-300 text-gray-500 rounded-md shadow-sm"/>
      </div>
      
      <CheckboxGroup
        title="Recruitment Status"
        options={{ RECRUITING: "Recruiting", NOT_YET_RECRUITING: "Not yet recruiting", COMPLETED: "Completed" }}
        selected={filters.status}
        onChange={(value: string) => handleCheckboxChange('status', value)}
      />

      <CheckboxGroup
        title="Trial Phase"
        options={{ PHASE_1: "Phase 1", PHASE_2: "Phase 2", PHASE_3: "Phase 3", PHASE_4: "Phase 4" }}
        selected={filters.phase}
        onChange={(value: string) => handleCheckboxChange('phase', value)}
      />

      <Button onClick={handleApply} disabled={isLoading}>
        {isLoading ? 'Searching...' : 'Apply Filters'}
      </Button>
    </div>
  );
};