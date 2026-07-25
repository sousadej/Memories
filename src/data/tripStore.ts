import { Photo, Trip, TripAlbum } from '../models/trip';

const TRIPS_KEY = 'memories:trips';
const PHOTOS_KEY = 'memories:photos';

const seedTrips: Trip[] = [
  {
    id: 'pacific-coast',
    title: 'Pacific Coast Weekend',
    description: 'Cliffs, fog, and campfire stories from a long weekend on Highway 1.',
    startDate: '2026-06-12',
    endDate: '2026-06-15',
    location: 'Big Sur, California',
    coverPhotoUri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    createdAt: '2026-06-01T16:00:00.000Z',
  },
  {
    id: 'tokyo-spring',
    title: 'Tokyo Spring Roll',
    description: 'Cherry blossoms, late-night ramen, and neon walks through the city.',
    startDate: '2026-04-02',
    endDate: '2026-04-09',
    location: 'Tokyo, Japan',
    coverPhotoUri: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
    createdAt: '2026-03-20T09:30:00.000Z',
  },
];

const seedPhotos: Photo[] = [
  {
    id: 'p1',
    tripId: 'pacific-coast',
    localUri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    capturedAt: '2026-06-12T02:15:00.000Z',
    filterStyle: 'warm-film',
    caption: 'Golden hour overlook',
    revealed: true,
  },
  {
    id: 'p2',
    tripId: 'pacific-coast',
    localUri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    capturedAt: '2026-06-13T17:45:00.000Z',
    filterStyle: 'coastal-fade',
    caption: 'Morning beach walk',
    revealed: true,
  },
  {
    id: 't1',
    tripId: 'tokyo-spring',
    localUri: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
    capturedAt: '2026-04-03T12:20:00.000Z',
    filterStyle: 'neon',
    caption: 'Shibuya lights',
    revealed: true,
  },
];

type LocalStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function getStorage(): LocalStorageLike | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage as LocalStorageLike;
}

function readCollection<T>(key: string, fallback: T[]): T[] {
  const storage = getStorage();

  if (!storage) {
    return fallback;
  }

  const rawValue = storage.getItem(key);

  if (!rawValue) {
    storage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T[];
  } catch {
    storage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

function writeCollection<T>(key: string, value: T[]) {
  const storage = getStorage();

  if (storage) {
    storage.setItem(key, JSON.stringify(value));
  }
}

export async function listTrips(): Promise<TripAlbum[]> {
  const trips = readCollection<Trip>(TRIPS_KEY, seedTrips);
  const photos = readCollection<Photo>(PHOTOS_KEY, seedPhotos);

  return trips
    .map((trip) => ({
      ...trip,
      photos: photos.filter((photo) => photo.tripId === trip.id),
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getTrip(tripId: string): Promise<TripAlbum | undefined> {
  const trips = await listTrips();
  return trips.find((trip) => trip.id === tripId);
}

export async function saveTrip(input: Omit<Trip, 'id' | 'createdAt' | 'coverPhotoUri'> & { coverPhotoUri?: string }): Promise<Trip> {
  const createdAt = new Date().toISOString();
  const trip: Trip = {
    ...input,
    id: `trip-${Date.now()}`,
    coverPhotoUri: input.coverPhotoUri ?? '',
    createdAt,
  };
  const trips = readCollection<Trip>(TRIPS_KEY, seedTrips);
  writeCollection(TRIPS_KEY, [trip, ...trips]);
  return trip;
}

export async function savePhoto(input: Omit<Photo, 'id' | 'capturedAt' | 'revealed'> & { capturedAt?: string; revealed?: boolean }): Promise<Photo> {
  const photo: Photo = {
    ...input,
    id: `photo-${Date.now()}`,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    revealed: input.revealed ?? false,
  };
  const photos = readCollection<Photo>(PHOTOS_KEY, seedPhotos);
  writeCollection(PHOTOS_KEY, [photo, ...photos]);
  return photo;
}

export async function developTripPhotos(tripId: string): Promise<Photo[]> {
  const photos = readCollection<Photo>(PHOTOS_KEY, seedPhotos);
  const developedPhotos = photos.map((photo) => (
    photo.tripId === tripId ? { ...photo, revealed: true } : photo
  ));
  writeCollection(PHOTOS_KEY, developedPhotos);
  return developedPhotos.filter((photo) => photo.tripId === tripId);
}
