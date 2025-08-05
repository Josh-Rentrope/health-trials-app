// components/KeyInfoItem.tsx
import React from 'react';

type KeyInfoItemProps = {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
};

const KeyInfoItem: React.FC<KeyInfoItemProps> = ({ icon: Icon, title, children }) => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 text-purple-600 mt-1">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600 text-sm">{children}</p>
      </div>
    </div>
  );
};

export default KeyInfoItem;