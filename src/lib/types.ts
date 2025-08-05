// lib/types.ts
export interface Trial {
  id: string;
  slug: string;
  title: string;
  recruitingStatus: string;
  sponsor: string;
  phase: number;
  locations: Location[];
  summary: string;
  eligibility: {
    age: string;
    sex: string;
    inclusion: string[];
    exclusion: string[];
  };
  team: {
    name: string;
    role: string;
    imageUrl: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  status: string;
  coords: { lat: number; lng: number };
}