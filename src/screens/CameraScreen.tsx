import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DISPOSABLE_FILTER_STYLE, DISPOSABLE_ROLL_LIMIT } from '../constants/camera';
import { getTrip, savePhoto } from '../data/tripStore';
import { TripAlbum } from '../models/trip';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

function formatDatestamp(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getDate()).padStart(2, '0')} '${String(date.getFullYear()).slice(-2)}`;
}

export function CameraScreen({ navigation, route }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [trip, setTrip] = useState<TripAlbum>();
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCaptureStamp, setLastCaptureStamp] = useState(formatDatestamp(new Date()));
  const tripId = route.params?.tripId;

  useEffect(() => {
    if (!tripId) return;
    getTrip(tripId).then(setTrip);
  }, [tripId]);

  const shotsRemaining = useMemo(() => {
    const usedShots = trip?.photos.length ?? 0;
    return Math.max(0, DISPOSABLE_ROLL_LIMIT - usedShots);
  }, [trip?.photos.length]);

  if (!permission) {
    return <View style={styles.center}><Text>Loading camera permissions…</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionTitle}>Camera access keeps the trip roll moving.</Text>
        <Text style={styles.permissionCopy}>Every shot is saved straight to this trip and stays hidden until you develop the roll.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  async function takePhoto() {
    if (!cameraRef.current || !tripId || shotsRemaining === 0 || isCapturing) return;
    setIsCapturing(true);
    const capturedAt = new Date();
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.72, skipProcessing: false });

    if (photo?.uri) {
      await savePhoto({
        tripId,
        localUri: photo.uri,
        filterStyle: DISPOSABLE_FILTER_STYLE,
        caption: 'Undeveloped disposable shot',
        capturedAt: capturedAt.toISOString(),
        revealed: false,
      });
      setLastCaptureStamp(formatDatestamp(capturedAt));
      const refreshedTrip = await getTrip(tripId);
      setTrip(refreshedTrip);
    }

    setIsCapturing(false);
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.filmTreatment} pointerEvents="none">
          <View style={styles.lightLeak} />
          <View style={styles.vignette} />
          <Text style={styles.dateStamp}>{lastCaptureStamp}</Text>
        </View>
        <View style={styles.overlay}>
          <View style={styles.topPlate}>
            <Text style={styles.counter}>{shotsRemaining} / {DISPOSABLE_ROLL_LIMIT}</Text>
            <Text style={styles.tripName}>{trip?.title ?? 'Trip roll'}</Text>
          </View>
          {shotsRemaining === 0 ? <Text style={styles.limitMessage}>Roll full — develop this trip to see the photos.</Text> : null}
          <Pressable
            accessibilityLabel="Take photo"
            disabled={shotsRemaining === 0 || isCapturing}
            style={[styles.shutter, (shotsRemaining === 0 || isCapturing) && styles.shutterDisabled]}
            onPress={takePhoto}
          />
          <Text style={styles.hint}>No instant preview. The surprise stays sealed until development.</Text>
        </View>
      </CameraView>
      <Pressable style={styles.doneButton} onPress={() => navigation.goBack()}>
        <Text style={styles.doneButtonText}>Back to album</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  permissionTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  permissionCopy: { color: '#475569', fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#0F172A', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
  buttonText: { color: '#FFFFFF', fontWeight: '800' },
  camera: { flex: 1 },
  filmTreatment: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(120, 90, 44, 0.12)' },
  lightLeak: { position: 'absolute', top: -70, right: -35, width: 190, height: 250, borderRadius: 120, backgroundColor: 'rgba(251, 146, 60, 0.32)' },
  vignette: { ...StyleSheet.absoluteFillObject, borderWidth: 26, borderColor: 'rgba(2, 6, 23, 0.28)' },
  dateStamp: { position: 'absolute', right: 24, bottom: 132, color: '#F97316', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(2, 6, 23, 0.12)' },
  topPlate: { alignItems: 'center', gap: 8 },
  counter: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', backgroundColor: 'rgba(15, 23, 42, 0.72)', padding: 12, borderRadius: 999, overflow: 'hidden' },
  tripName: { color: '#FEF3C7', fontWeight: '800' },
  limitMessage: { color: '#FFFFFF', fontWeight: '900', backgroundColor: 'rgba(185, 28, 28, 0.72)', padding: 12, borderRadius: 16, marginHorizontal: 24, textAlign: 'center' },
  shutter: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#FFFFFF', borderWidth: 8, borderColor: '#CBD5E1' },
  shutterDisabled: { opacity: 0.35 },
  hint: { color: '#E2E8F0', fontWeight: '700', marginHorizontal: 28, textAlign: 'center' },
  doneButton: { position: 'absolute', left: 24, top: 44, backgroundColor: 'rgba(15, 23, 42, 0.72)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  doneButtonText: { color: '#FFFFFF', fontWeight: '800' },
});
