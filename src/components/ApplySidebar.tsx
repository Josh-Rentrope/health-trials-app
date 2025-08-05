// components/ApplySidebar.tsx
import React from 'react';
import { DollarSign, Calendar, Clock, Share2, ArrowRight } from 'lucide-react';
import Button from './ui/Button';

type SidebarInfoItemProps = {
  icon: React.ElementType;
  label: string;
  value: string;
};

const SidebarInfoItem: React.FC<SidebarInfoItemProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between text-gray-600">
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </div>
    <span className="font-semibold text-gray-800">{value}</span>
  </div>
);

const ApplySidebar: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md space-y-6 h-fit">
      <h2 className="text-xl font-bold text-gray-900">Apply to Trial</h2>
      
      <div className="space-y-4">
        <SidebarInfoItem icon={DollarSign} label="Compensation" value="Varies" />
        <SidebarInfoItem icon={Calendar} label="Number of Visits" value="Unknown" />
        <SidebarInfoItem icon={Clock} label="Duration" value="Up to 5 years" />
      </div>

      <div className="space-y-3">
        <Button>
          <div className="flex items-center justify-center gap-2">
            Apply Today <ArrowRight className="w-5 h-5" />
          </div>
        </Button>
        <p className="text-center text-sm text-purple-600 font-semibold">
          144 Participants Needed
        </p>
      </div>

      <Button variant="secondary">
        <div className="flex items-center justify-center gap-2">
          <Share2 className="w-5 h-5" /> Share
        </div>
      </Button>
    </div>
  );
};

export default ApplySidebar;