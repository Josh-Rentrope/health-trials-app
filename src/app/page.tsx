// app/trials/page.tsx
import { getAllTrials } from '@/lib/data';
import { TrialsClientPage } from '@/components/trial/TrialsClientPage';

export default async function TrialsPage() {
  const trials = await getAllTrials();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/*
          We fetch data in a Server Component and pass it to a Client Component.
          This is a powerful pattern for keeping data fetching on the server while
          enabling client-side interactivity.
        */}
        {/* <TrialsClientPage trials={trials} /> */}
      </div>
    </div>
  );
}