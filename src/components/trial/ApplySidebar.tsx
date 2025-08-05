// components/trial/ApplySidebar.tsx
'use client';

import { Button } from '@/components/ui/Button';
import { Share2 } from 'lucide-react';
import React from 'react';

export const ApplySidebar: React.FC = () => {
  const handleApply = () => {
    // In a real app, this would open a form modal or navigate to an application page
    alert('Navigating to application form!');
  };

  return (
    <div className="sticky top-8 bg-white p-6 rounded-lg border border-gray-200 shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Apply to Trial</h2>
      <p className="text-sm text-gray-600">
        Based on the information you provide, a member of the research team will contact you.
      </p>
      <Button onClick={handleApply}>
        Apply Today
      </Button>
      <Button variant="secondary">
        <div className="flex items-center justify-center gap-2">
          <Share2 className="w-4 h-4" /> Share
        </div>
      </Button>
    </div>
  );
};