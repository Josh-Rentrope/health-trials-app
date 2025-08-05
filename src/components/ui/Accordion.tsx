// components/ui/Accordion.tsx
'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type AccordionProps = {
  title: string;
  children: React.ReactNode;
};

export const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left"
      >
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <ChevronDown
          className={`w-5 h-5 text-purple-600 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="mt-3 text-gray-600 prose prose-sm max-w-none">
          {children}
        </div>
      )}
    </div>
  );
};