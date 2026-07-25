export type Trip = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  coverPhotoUri: string;
  createdAt: string;
};

export type Photo = {
  id: string;
  tripId: string;
  localUri: string;
  capturedAt: string;
  filterStyle: string;
  caption: string;
  revealed: boolean;
};

export type TripAlbum = Trip & {
  photos: Photo[];
};
