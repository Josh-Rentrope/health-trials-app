// components/trial/FaqSection.tsx
import { Section } from '@/components/ui/Section';
import { Accordion } from '@/components/ui/Accordion'; // This is a Client Component
import { Trial } from '@/lib/types';

type FaqSectionProps = {
  faqs: Trial['faqs'];
};

export const FaqSection: React.FC<FaqSectionProps> = ({ faqs }) => {
  return (
    <Section title="Frequently Asked Questions">
      <div>
        {faqs.map((faq, index) => (
          <Accordion key={index} title={faq.question}>
            <p>{faq.answer}</p>
          </Accordion>
        ))}
      </div>
    </Section>
  );
};