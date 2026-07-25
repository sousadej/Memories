import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { trips } from '../data/trips';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TripDetail'>;

export function TripDetailScreen({ navigation, route }: Props) {
  const trip = trips.find((item) => item.id === route.params.tripId) ?? trips[0];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.banner, { backgroundColor: trip.coverColor }]}>
        <Text style={styles.bannerTitle}>{trip.title}</Text>
        <Text style={styles.bannerMeta}>{trip.location}</Text>
        <Text style={styles.bannerMeta}>{trip.dates}</Text>
      </View>
      <Pressable style={styles.cameraButton} onPress={() => navigation.navigate('Camera', { tripId: trip.id })}>
        <Text style={styles.cameraButtonText}>Open trip camera</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>Developed memories</Text>
      <View style={styles.grid}>
        {trip.photos.map((photo) => (
          <View key={photo.id} style={styles.photoCard}>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            <Text style={styles.caption}>{photo.capturedAt}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  banner: { borderRadius: 30, minHeight: 190, justifyContent: 'flex-end', padding: 24 },
  bannerTitle: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  bannerMeta: { color: '#FFF7ED', fontSize: 16, marginTop: 6 },
  cameraButton: { backgroundColor: '#0F172A', borderRadius: 18, marginVertical: 20, padding: 16, alignItems: 'center' },
  cameraButtonText: { color: '#FFFFFF', fontWeight: '800' },
  sectionTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 1 },
  caption: { color: '#475569', padding: 10, fontWeight: '600' },
});
