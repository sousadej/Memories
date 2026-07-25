import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DISPOSABLE_FILTER_STYLE, DISPOSABLE_ROLL_LIMIT } from '../constants/camera';
import { developTripPhotos, getTrip, listTrips } from '../data/tripStore';
import { Photo, TripAlbum } from '../models/trip';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TripDetail'>;

function formatTripDates(startDate: string, endDate: string) {
  if (!startDate && !endDate) return 'Dates TBD';
  if (startDate === endDate || !endDate) return startDate;
  return `${startDate} → ${endDate}`;
}

function formatPhotoDate(capturedAt: string) {
  const date = new Date(capturedAt);
  return `${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getDate()).padStart(2, '0')} '${String(date.getFullYear()).slice(-2)}`;
}

function PhotoFrame({ photo }: { photo: Photo }) {
  if (!photo.revealed) {
    return (
      <View style={styles.hiddenPhoto}>
        <Text style={styles.hiddenPhotoText}>Undeveloped</Text>
      </View>
    );
  }

  return (
    <View style={styles.photoWrap}>
      <Image source={{ uri: photo.localUri }} style={styles.photo} />
      {photo.filterStyle === DISPOSABLE_FILTER_STYLE ? (
        <View style={styles.retroOverlay} pointerEvents="none">
          <View style={styles.albumLightLeak} />
          <View style={styles.albumVignette} />
          <Text style={styles.albumDateStamp}>{formatPhotoDate(photo.capturedAt)}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function TripDetailScreen({ navigation, route }: Props) {
  const [trip, setTrip] = useState<TripAlbum>();

  const refreshTrip = () => {
    getTrip(route.params.tripId)
      .then((selectedTrip) => selectedTrip ?? listTrips().then((allTrips) => allTrips[0]))
      .then(setTrip);
  };

  useEffect(() => {
    refreshTrip();
    const unsubscribe = navigation.addListener('focus', refreshTrip);

    return unsubscribe;
  }, [navigation, route.params.tripId]);

  const undevelopedCount = useMemo(() => trip?.photos.filter((photo) => !photo.revealed).length ?? 0, [trip?.photos]);
  const shotsRemaining = Math.max(0, DISPOSABLE_ROLL_LIMIT - (trip?.photos.length ?? 0));

  async function developRoll() {
    if (!trip) return;
    await developTripPhotos(trip.id);
    refreshTrip();
  }

  if (!trip) {
    return <View style={styles.loading}><Text>Loading trip…</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.banner}>
        {trip.coverPhotoUri ? <Image source={{ uri: trip.coverPhotoUri }} style={styles.bannerImage} /> : null}
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>{trip.title}</Text>
          <Text style={styles.bannerMeta}>{trip.location}</Text>
          <Text style={styles.bannerMeta}>{formatTripDates(trip.startDate, trip.endDate)}</Text>
        </View>
      </View>
      {trip.description ? <Text style={styles.description}>{trip.description}</Text> : null}
      <View style={styles.rollPanel}>
        <Text style={styles.rollTitle}>Disposable roll</Text>
        <Text style={styles.rollMeta}>{shotsRemaining} exposures left of {DISPOSABLE_ROLL_LIMIT} • {undevelopedCount} undeveloped</Text>
        <View style={styles.rollActions}>
          <Pressable style={[styles.cameraButton, shotsRemaining === 0 && styles.disabledButton]} disabled={shotsRemaining === 0} onPress={() => navigation.navigate('Camera', { tripId: trip.id })}>
            <Text style={styles.cameraButtonText}>Open trip camera</Text>
          </Pressable>
          <Pressable style={[styles.developButton, undevelopedCount === 0 && styles.disabledButton]} disabled={undevelopedCount === 0} onPress={developRoll}>
            <Text style={styles.developButtonText}>Develop roll</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Developed memories</Text>
      <View style={styles.grid}>
        {trip.photos.map((photo) => (
          <View key={photo.id} style={styles.photoCard}>
            <PhotoFrame photo={photo} />
            <Text style={styles.caption}>{photo.caption || new Date(photo.capturedAt).toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  container: { padding: 20, paddingBottom: 40 },
  banner: { borderRadius: 30, minHeight: 190, justifyContent: 'flex-end', overflow: 'hidden', backgroundColor: '#F97316' },
  bannerImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bannerOverlay: { flex: 1, justifyContent: 'flex-end', padding: 24, backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  bannerTitle: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  bannerMeta: { color: '#FFF7ED', fontSize: 16, marginTop: 6 },
  description: { color: '#475569', fontSize: 16, fontWeight: '600', marginTop: 16 },
  rollPanel: { backgroundColor: '#FEF3C7', borderRadius: 24, marginVertical: 20, padding: 16, gap: 12 },
  rollTitle: { color: '#92400E', fontSize: 20, fontWeight: '900' },
  rollMeta: { color: '#78350F', fontWeight: '800' },
  rollActions: { flexDirection: 'row', gap: 10 },
  cameraButton: { flex: 1, backgroundColor: '#0F172A', borderRadius: 18, padding: 14, alignItems: 'center' },
  cameraButtonText: { color: '#FFFFFF', fontWeight: '800' },
  developButton: { flex: 1, backgroundColor: '#F97316', borderRadius: 18, padding: 14, alignItems: 'center' },
  developButtonText: { color: '#FFFFFF', fontWeight: '900' },
  disabledButton: { opacity: 0.45 },
  sectionTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden' },
  photoWrap: { width: '100%', aspectRatio: 1, backgroundColor: '#1F2937' },
  photo: { width: '100%', height: '100%', opacity: 0.88 },
  retroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(120, 90, 44, 0.12)' },
  albumLightLeak: { position: 'absolute', top: -34, right: -22, width: 92, height: 120, borderRadius: 60, backgroundColor: 'rgba(251, 146, 60, 0.25)' },
  albumVignette: { ...StyleSheet.absoluteFillObject, borderWidth: 14, borderColor: 'rgba(2, 6, 23, 0.22)' },
  albumDateStamp: { position: 'absolute', right: 8, bottom: 8, color: '#F97316', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  hiddenPhoto: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#CBD5E1' },
  hiddenPhotoText: { color: '#475569', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  caption: { color: '#475569', padding: 10, fontWeight: '600' },
});
