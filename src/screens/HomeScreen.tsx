import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { FlatList, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
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
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80' }}
      style={styles.container}
      imageStyle={styles.backdrop}
    >
      <View style={styles.hero}>
        <View style={styles.heroGlass}>
          <Text style={styles.eyebrow}>Disposable trip albums</Text>
          <Text style={styles.title}>Capture now. Relive together later.</Text>
          <Text style={styles.subtitle}>Beautiful rolls for every trip, organized before they ever hit your camera roll.</Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('CreateTrip')}>
            <Text style={styles.primaryButtonText}>Start a trip</Text>
          </Pressable>
        </View>
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#431407', padding: 20, paddingTop: 88 },
  backdrop: { opacity: 0.28 },
  hero: { borderRadius: 34, marginBottom: 20, overflow: 'hidden' },
  heroGlass: { backgroundColor: 'rgba(255, 247, 237, 0.92)', borderColor: 'rgba(255, 255, 255, 0.55)', borderWidth: 1, padding: 24 },
  eyebrow: { color: '#EA580C', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: '#431407', fontSize: 36, fontWeight: '900', letterSpacing: -1, marginTop: 12 },
  subtitle: { color: '#7C2D12', fontSize: 16, fontWeight: '700', lineHeight: 23, marginTop: 10 },
  primaryButton: { alignSelf: 'flex-start', backgroundColor: '#FDBA74', borderRadius: 999, marginTop: 18, paddingHorizontal: 20, paddingVertical: 13, shadowColor: '#7C2D12', shadowOpacity: 0.2, shadowRadius: 12 },
  primaryButtonText: { color: '#431407', fontWeight: '900' },
  list: { gap: 16, paddingBottom: 32 },
  card: { backgroundColor: '#FFF7ED', borderColor: 'rgba(255, 237, 213, 0.75)', borderRadius: 28, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', elevation: 4, shadowColor: '#1C1917', shadowOpacity: 0.18, shadowRadius: 18 },
  cover: { width: 104, backgroundColor: '#FDBA74' },
  coverImage: { width: 104, minHeight: 124 },
  cardBody: { padding: 18, flex: 1 },
  cardTitle: { color: '#431407', fontSize: 19, fontWeight: '900' },
  cardMeta: { color: '#9A3412', fontWeight: '700', marginTop: 7 },
});
