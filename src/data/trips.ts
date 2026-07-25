export type TripPhoto = {
  id: string;
  uri: string;
  capturedAt: string;
};

export type Trip = {
  id: string;
  title: string;
  location: string;
  dates: string;
  coverColor: string;
  photoCount: number;
  photos: TripPhoto[];
};

export const trips: Trip[] = [
  {
    id: 'pacific-coast',
    title: 'Pacific Coast Weekend',
    location: 'Big Sur, California',
    dates: 'Jun 12–15, 2026',
    coverColor: '#F97316',
    photoCount: 18,
    photos: [
      { id: 'p1', uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', capturedAt: 'Golden hour overlook' },
      { id: 'p2', uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', capturedAt: 'Morning beach walk' },
    ],
  },
  {
    id: 'tokyo-spring',
    title: 'Tokyo Spring Roll',
    location: 'Tokyo, Japan',
    dates: 'Apr 2–9, 2026',
    coverColor: '#EC4899',
    photoCount: 32,
    photos: [
      { id: 't1', uri: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', capturedAt: 'Shibuya lights' },
    ],
  },
];
