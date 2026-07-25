import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DISPOSABLE_FILTER_STYLE, DISPOSABLE_ROLL_LIMIT } from '../constants/camera';
import { developTripPhotos, getTrip, listTrips } from '../data/tripStore';
import { Photo, TripAlbum } from '../models/trip';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TripDetail'>;
type SectionMode = 'none' | 'day' | 'location';
type PhotoSection = { title: string; photos: Photo[] };

type PhotoWithLocation = Photo & { location?: string };

function formatTripDates(startDate: string, endDate: string) {
  if (!startDate && !endDate) return 'Dates TBD';
  if (startDate === endDate || !endDate) return startDate;
  return `${startDate} → ${endDate}`;
}

function formatPhotoDate(capturedAt: string) {
  const date = new Date(capturedAt);
  return `${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getDate()).padStart(2, '0')} '${String(date.getFullYear()).slice(-2)}`;
}

function formatPhotoDay(capturedAt: string) {
  return new Date(capturedAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getPhotoLocation(photo: Photo, fallbackLocation: string) {
  return (photo as PhotoWithLocation).location?.trim() || fallbackLocation || 'Unknown location';
}

function buildPhotoSections(photos: Photo[], sectionMode: SectionMode, fallbackLocation: string): PhotoSection[] {
  if (sectionMode === 'none') {
    return [{ title: 'All photos', photos }];
  }

  const groupedPhotos = photos.reduce<Record<string, Photo[]>>((groups, photo) => {
    const title = sectionMode === 'day' ? formatPhotoDay(photo.capturedAt) : getPhotoLocation(photo, fallbackLocation);
    return {
      ...groups,
      [title]: [...(groups[title] ?? []), photo],
    };
  }, {});

  return Object.entries(groupedPhotos).map(([title, sectionPhotos]) => ({ title, photos: sectionPhotos }));
}

function PhotoFrame({ photo }: { photo: Photo }) {
  if (!photo.revealed) {
    return (
      <View style={styles.hiddenPhoto}>
        <Text style={styles.hiddenPhotoText}>Developing</Text>
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
  const [sectionMode, setSectionMode] = useState<SectionMode>('day');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo>();

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

  const sortedTripPhotos = useMemo(
    () => [...(trip?.photos ?? [])].sort((left, right) => left.capturedAt.localeCompare(right.capturedAt)),
    [trip?.photos],
  );
  const photoSections = useMemo(
    () => buildPhotoSections(sortedTripPhotos, sectionMode, trip?.location ?? ''),
    [sectionMode, sortedTripPhotos, trip?.location],
  );
  const undevelopedCount = useMemo(() => sortedTripPhotos.filter((photo) => !photo.revealed).length, [sortedTripPhotos]);
  const developedCount = sortedTripPhotos.length - undevelopedCount;
  const shotsRemaining = Math.max(0, DISPOSABLE_ROLL_LIMIT - sortedTripPhotos.length);

  async function developRoll() {
    if (!trip) return;
    await developTripPhotos(trip.id);
    refreshTrip();
  }

  if (!trip) {
    return <View style={styles.loading}><Text>Loading trip…</Text></View>;
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.banner}>
          {trip.coverPhotoUri ? <Image source={{ uri: trip.coverPhotoUri }} style={styles.bannerImage} /> : null}
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerLabel}>Trip album</Text>
            <Text style={styles.bannerTitle}>{trip.title}</Text>
            <Text style={styles.bannerMeta}>{trip.location}</Text>
            <Text style={styles.bannerMeta}>{formatTripDates(trip.startDate, trip.endDate)}</Text>
          </View>
        </View>
        {trip.description ? <Text style={styles.description}>{trip.description}</Text> : null}
        <View style={styles.rollPanel}>
          <View>
            <Text style={styles.rollTitle}>{undevelopedCount > 0 ? 'Album developing' : 'Album ready'}</Text>
            <Text style={styles.rollMeta}>{developedCount} developed • {undevelopedCount} developing • {shotsRemaining} exposures left</Text>
          </View>
          {undevelopedCount > 0 ? <Text style={styles.developState}>Delayed reveal is on. Develop this album when you are ready to unlock the hidden frames.</Text> : null}
          <View style={styles.rollActions}>
            <Pressable style={[styles.cameraButton, shotsRemaining === 0 && styles.disabledButton]} disabled={shotsRemaining === 0} onPress={() => navigation.navigate('Camera', { tripId: trip.id })}>
              <Text style={styles.cameraButtonText}>Open trip camera</Text>
            </Pressable>
            <Pressable style={[styles.developButton, undevelopedCount === 0 && styles.disabledButton]} disabled={undevelopedCount === 0} onPress={developRoll}>
              <Text style={styles.developButtonText}>Develop album</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trip photos</Text>
          <Text style={styles.sectionMeta}>{sortedTripPhotos.length} sorted by capture time</Text>
        </View>
        <View style={styles.segmentedControl}>
          {(['day', 'location', 'none'] as SectionMode[]).map((mode) => (
            <Pressable key={mode} style={[styles.segmentButton, sectionMode === mode && styles.segmentButtonActive]} onPress={() => setSectionMode(mode)}>
              <Text style={[styles.segmentText, sectionMode === mode && styles.segmentTextActive]}>{mode === 'none' ? 'Grid' : `By ${mode}`}</Text>
            </Pressable>
          ))}
        </View>
        {sortedTripPhotos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptyText}>Open the trip camera to start filling this dedicated album.</Text>
          </View>
        ) : photoSections.map((section) => (
          <View key={section.title} style={styles.photoSection}>
            {sectionMode !== 'none' ? <Text style={styles.photoSectionTitle}>{section.title}</Text> : null}
            <View style={styles.grid}>
              {section.photos.map((photo) => (
                <Pressable key={photo.id} style={styles.photoCard} onPress={() => photo.revealed && setSelectedPhoto(photo)} disabled={!photo.revealed}>
                  <PhotoFrame photo={photo} />
                  <Text style={styles.caption} numberOfLines={2}>{photo.caption || new Date(photo.capturedAt).toLocaleString()}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <Modal animationType="fade" transparent visible={Boolean(selectedPhoto)} onRequestClose={() => setSelectedPhoto(undefined)}>
        <View style={styles.viewerBackdrop}>
          <Pressable style={styles.viewerClose} onPress={() => setSelectedPhoto(undefined)}>
            <Text style={styles.viewerCloseText}>Close</Text>
          </Pressable>
          {selectedPhoto ? <Image source={{ uri: selectedPhoto.localUri }} style={styles.viewerImage} resizeMode="contain" /> : null}
          {selectedPhoto ? <Text style={styles.viewerCaption}>{selectedPhoto.caption || formatPhotoDay(selectedPhoto.capturedAt)}</Text> : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  container: { padding: 20, paddingBottom: 40, backgroundColor: '#F8FAFC' },
  banner: { borderRadius: 30, minHeight: 230, justifyContent: 'flex-end', overflow: 'hidden', backgroundColor: '#F97316' },
  bannerImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bannerOverlay: { flex: 1, justifyContent: 'flex-end', padding: 24, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  bannerLabel: { color: '#FED7AA', fontSize: 12, fontWeight: '900', letterSpacing: 1.4, marginBottom: 8, textTransform: 'uppercase' },
  bannerTitle: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  bannerMeta: { color: '#FFF7ED', fontSize: 16, marginTop: 6, fontWeight: '700' },
  description: { color: '#475569', fontSize: 16, fontWeight: '600', marginTop: 16, lineHeight: 22 },
  rollPanel: { backgroundColor: '#FEF3C7', borderRadius: 24, marginVertical: 20, padding: 16, gap: 12 },
  rollTitle: { color: '#92400E', fontSize: 20, fontWeight: '900' },
  rollMeta: { color: '#78350F', fontWeight: '800', marginTop: 4 },
  developState: { color: '#92400E', fontWeight: '700', lineHeight: 20 },
  rollActions: { flexDirection: 'row', gap: 10 },
  cameraButton: { flex: 1, backgroundColor: '#0F172A', borderRadius: 18, padding: 14, alignItems: 'center' },
  cameraButtonText: { color: '#FFFFFF', fontWeight: '800' },
  developButton: { flex: 1, backgroundColor: '#F97316', borderRadius: 18, padding: 14, alignItems: 'center' },
  developButtonText: { color: '#FFFFFF', fontWeight: '900' },
  disabledButton: { opacity: 0.45 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end' },
  sectionTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800' },
  sectionMeta: { color: '#64748B', fontWeight: '700' },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 18, padding: 4, marginVertical: 14 },
  segmentButton: { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  segmentButtonActive: { backgroundColor: '#FFFFFF' },
  segmentText: { color: '#64748B', fontWeight: '800' },
  segmentTextActive: { color: '#0F172A' },
  photoSection: { marginBottom: 18 },
  photoSectionTitle: { color: '#334155', fontSize: 16, fontWeight: '900', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden', elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 10 },
  photoWrap: { width: '100%', aspectRatio: 1, backgroundColor: '#1F2937' },
  photo: { width: '100%', height: '100%', opacity: 0.9 },
  retroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(120, 90, 44, 0.12)' },
  albumLightLeak: { position: 'absolute', top: -34, right: -22, width: 92, height: 120, borderRadius: 60, backgroundColor: 'rgba(251, 146, 60, 0.25)' },
  albumVignette: { ...StyleSheet.absoluteFillObject, borderWidth: 14, borderColor: 'rgba(2, 6, 23, 0.22)' },
  albumDateStamp: { position: 'absolute', right: 8, bottom: 8, color: '#F97316', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  hiddenPhoto: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#CBD5E1' },
  hiddenPhotoText: { color: '#475569', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  caption: { color: '#475569', padding: 10, fontWeight: '600' },
  emptyState: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 22, alignItems: 'center' },
  emptyTitle: { color: '#0F172A', fontSize: 18, fontWeight: '900' },
  emptyText: { color: '#64748B', marginTop: 6, textAlign: 'center', fontWeight: '600' },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.96)', justifyContent: 'center', padding: 20 },
  viewerClose: { position: 'absolute', top: 48, right: 20, zIndex: 1, backgroundColor: 'rgba(255, 255, 255, 0.14)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  viewerCloseText: { color: '#FFFFFF', fontWeight: '900' },
  viewerImage: { width: '100%', height: '78%' },
  viewerCaption: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 18 },
});
