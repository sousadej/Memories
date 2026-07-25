import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getTrip, listTrips } from '../data/tripStore';
import { TripAlbum } from '../models/trip';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TripDetail'>;

function formatTripDates(startDate: string, endDate: string) {
  if (!startDate && !endDate) return 'Dates TBD';
  if (startDate === endDate || !endDate) return startDate;
  return `${startDate} → ${endDate}`;
}

export function TripDetailScreen({ navigation, route }: Props) {
  const [trip, setTrip] = useState<TripAlbum>();

  useEffect(() => {
    const refreshTrip = () => {
      getTrip(route.params.tripId)
        .then((selectedTrip) => selectedTrip ?? listTrips().then((allTrips) => allTrips[0]))
        .then(setTrip);
    };

    refreshTrip();
    const unsubscribe = navigation.addListener('focus', refreshTrip);

    return unsubscribe;
  }, [navigation, route.params.tripId]);

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
      <Pressable style={styles.cameraButton} onPress={() => navigation.navigate('Camera', { tripId: trip.id })}>
        <Text style={styles.cameraButtonText}>Open trip camera</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>Developed memories</Text>
      <View style={styles.grid}>
        {trip.photos.map((photo) => (
          <View key={photo.id} style={styles.photoCard}>
            {photo.revealed ? <Image source={{ uri: photo.localUri }} style={styles.photo} /> : <View style={styles.hiddenPhoto}><Text style={styles.hiddenPhotoText}>Hidden</Text></View>}
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
  cameraButton: { backgroundColor: '#0F172A', borderRadius: 18, marginVertical: 20, padding: 16, alignItems: 'center' },
  cameraButtonText: { color: '#FFFFFF', fontWeight: '800' },
  sectionTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 1 },
  hiddenPhoto: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#CBD5E1' },
  hiddenPhotoText: { color: '#475569', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  caption: { color: '#475569', padding: 10, fontWeight: '600' },
});
