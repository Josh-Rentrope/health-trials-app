// lib/data.ts
// In a real app, this would fetch from a database or a CMS.
import { Trial } from './types';

const mockTrialData: Trial = {
  id: 'NCT04445449',
  slug: 'nivolumab-anal-cancer',
  title: 'Nivolumab for Anal Cancer',
  recruitingStatus: 'Recruiting',
  sponsor: 'National Cancer Institute (NCI)',
  phase: 3,
  summary: "This phase III trial investigates how well nivolumab after combined modality therapy works in treating patients with high risk stage II-IIIB anal cancer...",
  eligibility: {
    age: '18+ Years',
    sex: 'Any',
    inclusion: [
      "Histologically confirmed squamous cell carcinoma of the anal canal",
      "High-risk clinical stage II (T2N1, T3N0) or stage IIIA-B (T2N2, T3N1, T4N0-2) disease",
      "ECOG performance status of 0-1",
    ],
    exclusion: [
      "Prior systemic chemotherapy for invasive anal cancer",
      "Presence of distant metastatic disease",
      "Active known or suspected autoimmune disease",
    ],
  },
  locations: [
    { id: '1', name: 'Wake Forest Baptist Health', city: 'Winston-Salem', state: 'NC', country: 'USA', zip: '27157', status: 'Recruiting', coords: { lat: 36.1032, lng: -80.2783 } },
    { id: '2', name: 'Duke University Medical Center', city: 'Durham', state: 'NC', country: 'USA', zip: '27710', status: 'Recruiting', coords: { lat: 36.0076, lng: -78.9392 } },
    { id: '3', name: 'UNC Lineberger Comprehensive Cancer Center', city: 'Chapel Hill', state: 'NC', country: 'USA', zip: '27599', status: 'Not yet recruiting', coords: { lat: 35.9049, lng: -79.0469 } },
  ],
  team: [
    { name: 'Dr. Emily Carter', role: 'Principal Investigator', imageUrl: '/placeholder.jpg' },
    { name: 'Dr. Ben Hanson', role: 'Clinical Research Coordinator', imageUrl: '/placeholder.jpg' },
  ],
  faqs: [
    { question: 'What is the purpose of this trial?', answer: 'The purpose is to test the efficacy of Nivolumab...' },
    { question: 'How long will I be in the trial?', answer: 'Participation can last up to 5 years, including follow-up.' },
  ],
};

export async function getTrialBySlug(slug: string): Promise<Trial | null> {
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  if (slug === mockTrialData.slug) {
    return mockTrialData;
  }
  return null;
}