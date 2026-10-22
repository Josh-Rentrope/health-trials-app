import { ChevronDown } from 'lucide-react';

interface FaqItemProps {
  question: string;
  // answer can be a string or more complex JSX with links, etc.
  children: React.ReactNode; 
}

export const FaqItem = ({ question, children }: FaqItemProps) => {
  return (
    <details className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-ink">
        {question}
        <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="pb-4 text-[14px] leading-6 text-muted">
        {children}
      </div>
    </details>
  );
};