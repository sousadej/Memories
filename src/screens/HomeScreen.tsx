import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { listTrips } from '../data/tripStore';
import { TripAlbum } from '../models/trip';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function formatTripDates(startDate: string, endDate: string) {
  if (!startDate && !endDate) return 'Dates TBD';
  if (startDate === endDate || !endDate) return startDate;
  return `${startDate} → ${endDate}`;
}

export function HomeScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<TripAlbum[]>([]);

  useEffect(() => {
    const refreshTrips = () => {
      listTrips().then(setTrips);
    };

    refreshTrips();
    const unsubscribe = navigation.addListener('focus', refreshTrips);

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Disposable trip albums</Text>
        <Text style={styles.title}>Capture now. Relive together later.</Text>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('CreateTrip')}>
          <Text style={styles.primaryButtonText}>Start a trip</Text>
        </Pressable>
      </View>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}>
            {item.coverPhotoUri ? <Image source={{ uri: item.coverPhotoUri }} style={styles.coverImage} /> : <View style={styles.cover} />}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>{item.location}</Text>
              <Text style={styles.cardMeta}>{formatTripDates(item.startDate, item.endDate)} • {item.photos.length} photos</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  hero: { backgroundColor: '#E0F2FE', borderRadius: 28, padding: 24, marginBottom: 20 },
  eyebrow: { color: '#0369A1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#0F172A', fontSize: 32, fontWeight: '800', marginVertical: 14 },
  primaryButton: { alignSelf: 'flex-start', backgroundColor: '#0F172A', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  list: { gap: 14, paddingBottom: 32 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, overflow: 'hidden', flexDirection: 'row', elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 12 },
  cover: { width: 92, backgroundColor: '#F97316' },
  coverImage: { width: 92, minHeight: 112 },
  cardBody: { padding: 16, flex: 1 },
  cardTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  cardMeta: { color: '#64748B', marginTop: 6 },
});
