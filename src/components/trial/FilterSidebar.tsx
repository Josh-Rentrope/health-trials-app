// components/trials/FilterSidebar.tsx
'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { SlidersHorizontal, Search, BarChart, Mic, Loader2 } from 'lucide-react';
// --- FIX: Import the new setViewMode function and ViewMode type ---
import { useTrialStore, ViewMode } from '@/stores/trialStore';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';


const demographicOptions = [
    { value: 'v021_raw_value', label: '% 65 and over' },
    { value: 'v001_raw_value', label: 'Premature Death Rate' },
    { value: 'v011_raw_value', label: 'Adult Obesity Rate' },
    { value: 'v009_raw_value', label: 'Adult Smoking Rate' },
    { value: 'v057_raw_value', label: 'Children in Poverty Rate' },
    { value: 'v043_raw_value', label: '% Uninsured' },
];

type CheckboxGroupProps = {
  title: string;
  options: Record<string, string>;
  selected: string[];
  onChange: (key: string) => void;
};

const CheckboxGroup = ({ title, options, selected, onChange }: CheckboxGroupProps) => (
  <div>
    <h4 className="font-semibold text-ink mb-2">{title}</h4>
    <div className="space-y-2">
      {Object.entries(options).map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 text-ink">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
            checked={selected.includes(key)}
            onChange={() => onChange(key)}
          />
          {label as string}
        </label>
      ))}
    </div>
  </div>
);


type FilterSidebarProps = {
  isLoading?: boolean;
  isCollapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
};

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ isLoading }) => {
  // --- FIX: Get viewMode and setViewMode from the store ---
  const { filters, setFilters, resetFilters, viewMode, setViewMode , isCollapsed, setCollapsed } = useTrialStore();

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

  const renderTrialFilters = () => (
    <>
      <div className="space-y-2">
            <label htmlFor="condition" className="font-semibold text-ink text-sm">Condition or Disease</label>
            <div className="flex items-center gap-2">
              <input type="text" name="condition" id="condition" value={filters.condition} onChange={handleInputChange} className="w-full border-gray-300 text-gray-500 rounded-md shadow-sm"/>
              {browserSupportsSpeechRecognition && (
                <button onClick={handleListen} className="p-2 border rounded-md hover:bg-gray-100">
                  {listening ? <Loader2 className="animate-spin" /> : <Mic />}
                </button>
              )}
            </div>
          </div>
          
          {/* <div className="space-y-2">
            <label htmlFor="location" className="font-semibold text-ink text-sm">Location</label>
            <input type="text" name="location" id="location" value={filters.location} onChange={handleInputChange} className="w-full border-gray-300 text-gray-500 rounded-md shadow-sm"/>
          </div>
           */}
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

          <Button onClick={handleApply} disabled={isLoading} className="w-full">
            {isLoading ? 'Searching...' : 'Apply Filters'}
          </Button>
        
    </>
  ); 
  
  const handleApply = () => {
    
    // Collapse the sidebar when filters are applied in map view
    if (setCollapsed) {
      setCollapsed(true);
    }
  };

  const handleToggleCollapse = () => {
    // Only allow toggling if the setCollapsed function is provided (i.e., in map view)
    if (setCollapsed) {
      setCollapsed(!isCollapsed);
    }
  };

  const renderCorrelationFilters = () => (
      <>
        <div className="space-y-2">
            <label htmlFor="correlationCondition" className="font-semibold text-ink text-sm">Condition of Interest</label>
            <input type="text" name="correlationCondition" id="correlationCondition" value={filters.correlationCondition} onChange={handleInputChange} className="w-full border-gray-300 text-gray-500 rounded-md shadow-sm"/>
        </div>
        <div className="space-y-2">
            <label htmlFor="demographicVariable" className="font-semibold text-ink text-sm">Demographic Focus</label>
            <select name="demographicVariable" id="demographicVariable" value={filters.demographicVariable} onChange={handleInputChange} className="w-full border-gray-300 text-ink rounded-md shadow-sm">
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
      <div
        className={`flex justify-between items-center p-6 ${setCollapsed ? 'cursor-pointer' : ''}`}
        onClick={handleToggleCollapse}
      >
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" /> Filters
        </h3>
        <button onClick={handleClear} className="text-sm text-accent hover:underline">
            Clear All
        </button>
      </div>

      {/* Collapsible Content Wrapper */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isCollapsed ? 'max-h-0' : 'max-h-[1000px]' // Animate max-height for smooth collapse
        }`}
      >
        <div className="flex border-b">
            {/* --- FIX: Use handleTabClick to update global state --- */}
            <button onClick={() => handleTabClick('trials')} className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 ${viewMode === 'trials' ? 'text-accent border-b-2 border-accent bg-accent-soft text-accent' : 'text-muted hover:bg-canvas'}`}>
                <Search size={16} /> Trial Search
            </button>
            <button onClick={() => handleTabClick('correlation')} className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 ${viewMode === 'correlation' ? 'text-accent border-b-2 border-accent bg-accent-soft text-accent' : 'text-muted hover:bg-canvas'}`}>
                <BarChart size={16} /> Correlation Map
            </button>
        </div>
        
        <div className="p-6 space-y-6">
            {viewMode === 'trials' ? renderTrialFilters() : renderCorrelationFilters()}
        </div>
      </div>
    </div>
  );
};
