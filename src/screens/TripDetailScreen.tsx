import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { DISPOSABLE_FILTER_STYLE, DISPOSABLE_ROLL_LIMIT } from '../constants/camera';
import { developTripPhotos, getTrip, listTrips } from '../data/tripStore';
import { Photo, TripAlbum } from '../models/trip';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TripDetail'>;
type SectionMode = 'none' | 'day' | 'location';
type PhotoSection = { title: string; photos: Photo[] };
type ExportMode = 'album' | 'selection';

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function makeSafeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'trip-album';
}

function buildAlbumExportHtml(trip: TripAlbum, photos: Photo[]) {
  const photoCards = photos.map((photo, index) => `
    <figure>
      <img src="${escapeHtml(photo.localUri)}" alt="${escapeHtml(photo.caption || `${trip.title} photo ${index + 1}`)}" />
      <figcaption>
        <strong>${String(index + 1).padStart(2, '0')}</strong>
        <span>${escapeHtml(photo.caption || formatPhotoDay(photo.capturedAt))}</span>
      </figcaption>
    </figure>
  `).join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(trip.title)} album</title>
    <style>
      body { margin: 0; padding: 32px; background: #f8fafc; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      header { margin-bottom: 24px; }
      p { color: #475569; font-weight: 600; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
      figure { margin: 0; background: #fff; border-radius: 22px; overflow: hidden; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08); }
      img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
      figcaption { display: flex; gap: 10px; padding: 12px; font-weight: 700; }
      strong { color: #f97316; }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(trip.title)}</h1>
      <p>${escapeHtml(trip.location)} • ${escapeHtml(formatTripDates(trip.startDate, trip.endDate))}</p>
      ${trip.description ? `<p>${escapeHtml(trip.description)}</p>` : ''}
    </header>
    <main class="grid">${photoCards}</main>
  </body>
</html>`;
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
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [shareStatus, setShareStatus] = useState<string>();

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
  const shareablePhotos = useMemo(() => sortedTripPhotos.filter((photo) => photo.revealed), [sortedTripPhotos]);
  const selectedSharePhotos = useMemo(() => shareablePhotos.filter((photo) => selectedPhotoIds.includes(photo.id)), [selectedPhotoIds, shareablePhotos]);
  const isAlbumComplete = sortedTripPhotos.length > 0 && undevelopedCount === 0;

  async function developRoll() {
    if (!trip) return;
    await developTripPhotos(trip.id);
    refreshTrip();
  }

  function toggleSelectedPhoto(photoId: string) {
    setSelectedPhotoIds((currentIds) => (
      currentIds.includes(photoId) ? currentIds.filter((id) => id !== photoId) : [...currentIds, photoId]
    ));
  }

  async function shareAlbum(mode: ExportMode) {
    if (!trip) return;

    const photosToShare = mode === 'selection' ? selectedSharePhotos : shareablePhotos;

    if (!isAlbumComplete) {
      setShareStatus('Finish developing every photo before sharing this completed album.');
      return;
    }

    if (photosToShare.length === 0) {
      setShareStatus('Select at least one developed photo to export.');
      return;
    }

    setShareStatus('Preparing shareable album…');

    const html = buildAlbumExportHtml(trip, photosToShare);
    const fileName = `${makeSafeFileName(trip.title)}-${mode === 'selection' ? 'selection' : 'album'}.html`;
    const exportDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

    if (!exportDirectory) {
      setShareStatus('Album export storage is not available on this device.');
      return;
    }

    const fileUri = `${exportDirectory}${fileName}`;

    try {
      await FileSystem.writeAsStringAsync(fileUri, html, { encoding: FileSystem.EncodingType.UTF8 });
      const canUseNativeSharing = await Sharing.isAvailableAsync();

      if (canUseNativeSharing) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: `Share ${trip.title}`,
          mimeType: 'text/html',
          UTI: 'public.html',
        });
      } else {
        await Share.share({
          title: `${trip.title} album`,
          message: `${trip.title}\n${formatTripDates(trip.startDate, trip.endDate)}\n${photosToShare.map((photo, index) => `${index + 1}. ${photo.caption || formatPhotoDay(photo.capturedAt)} — ${photo.localUri}`).join('\n')}`,
          url: fileUri,
        });
      }

      setShareStatus(`Exported ${photosToShare.length} photo${photosToShare.length === 1 ? '' : 's'} in album order.`);
    } catch {
      setShareStatus('Album export failed. Please try again.');
    }
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
        <View style={styles.sharePanel}>
          <View style={styles.shareHeader}>
            <View style={styles.shareHeaderCopy}>
              <Text style={styles.shareTitle}>Share completed album</Text>
              <Text style={styles.shareMeta}>{isAlbumComplete ? `${shareablePhotos.length} photos ready to export` : 'Develop the full album to unlock sharing'}</Text>
            </View>
            <Pressable style={[styles.shareButton, !isAlbumComplete && styles.disabledButton]} disabled={!isAlbumComplete} onPress={() => shareAlbum('album')}>
              <Text style={styles.shareButtonText}>Share album</Text>
            </Pressable>
          </View>
          <Text style={styles.shareHelp}>Exports a shareable HTML collage through the native iOS or Android share sheet while preserving the album title and capture-time photo order.</Text>
          {isAlbumComplete ? (
            <>
              <View style={styles.selectionActions}>
                <Text style={styles.selectionCount}>{selectedSharePhotos.length} selected</Text>
                <Pressable onPress={() => setSelectedPhotoIds(shareablePhotos.map((photo) => photo.id))}>
                  <Text style={styles.selectionLink}>Select all</Text>
                </Pressable>
                <Pressable onPress={() => setSelectedPhotoIds([])}>
                  <Text style={styles.selectionLink}>Clear</Text>
                </Pressable>
              </View>
              <Pressable style={[styles.selectionShareButton, selectedSharePhotos.length === 0 && styles.disabledButton]} disabled={selectedSharePhotos.length === 0} onPress={() => shareAlbum('selection')}>
                <Text style={styles.selectionShareButtonText}>Share selected photos</Text>
              </Pressable>
            </>
          ) : null}
          {shareStatus ? <Text style={styles.shareStatus}>{shareStatus}</Text> : null}
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
                  {isAlbumComplete ? (
                    <Pressable style={[styles.selectBadge, selectedPhotoIds.includes(photo.id) && styles.selectBadgeActive]} onPress={() => toggleSelectedPhoto(photo.id)}>
                      <Text style={[styles.selectBadgeText, selectedPhotoIds.includes(photo.id) && styles.selectBadgeTextActive]}>{selectedPhotoIds.includes(photo.id) ? 'Selected' : 'Select'}</Text>
                    </Pressable>
                  ) : null}
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
  sharePanel: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, marginBottom: 20, gap: 12, elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 10 },
  shareHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  shareHeaderCopy: { flex: 1 },
  shareTitle: { color: '#0F172A', fontSize: 20, fontWeight: '900' },
  shareMeta: { color: '#64748B', fontWeight: '700', marginTop: 4 },
  shareButton: { backgroundColor: '#2563EB', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  shareButtonText: { color: '#FFFFFF', fontWeight: '900' },
  shareHelp: { color: '#475569', lineHeight: 20, fontWeight: '600' },
  shareStatus: { color: '#2563EB', fontWeight: '800' },
  selectionActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  selectionCount: { color: '#0F172A', fontWeight: '900' },
  selectionLink: { color: '#2563EB', fontWeight: '900' },
  selectionShareButton: { backgroundColor: '#DBEAFE', borderRadius: 16, padding: 12, alignItems: 'center' },
  selectionShareButtonText: { color: '#1D4ED8', fontWeight: '900' },
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
  selectBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(15, 23, 42, 0.72)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  selectBadgeActive: { backgroundColor: '#2563EB' },
  selectBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  selectBadgeTextActive: { color: '#DBEAFE' },
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
