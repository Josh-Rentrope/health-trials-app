import { Quote } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  details: string; // e.g., "Ewing Sarcoma Patient, 27 Years Old · Massachusetts"
  source: 'Patient' | 'Researcher' | 'Foundation';
}

export const TestimonialCard = ({ quote, author, details, source }: TestimonialCardProps) => {
  return (
    <div className="flex flex-col rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex-grow">
        <Quote className="h-6 w-6 text-muted-foreground" />
        <p className="mt-4 text-lg italic text-foreground">&quot;{quote}&quot;</p>
      </div>
      <div className="mt-6 border-t pt-4">
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-muted-foreground">{details}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-blue-600">{source}</p>
      </div>
    </div>
  );
};