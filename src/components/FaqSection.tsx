// components/FaqSection.tsx
'use client';

import React, { useState } from 'react';

const FaqSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const fullText = "This phase III trial investigates how well nivolumab after combined modality therapy works in treating patients with high risk stage II-IIIB anal cancer. Immunotherapy with monoclonal antibodies, such as nivolumab, may help the body's immune system attack the cancer, and may interfere with the ability of tumor cells to grow and spread.";
  const truncatedText = "This phase III trial investigates how well nivolumab after combined modality therapy works in treating patients with high risk stage II-IIIB anal cancer. Immunotherapy with monoclonal antibodies, such as...";

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        What You Need to Know Before You Apply
      </h2>
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">What is the purpose of this trial?</h3>
        <p className="text-gray-600 leading-relaxed">
          {isExpanded ? fullText : truncatedText}
        </p>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-purple-600 font-semibold hover:underline"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </div>
      {/* You can add more questions here */}
    </div>
  );
};

export default FaqSection;