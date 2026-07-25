import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { savePhoto } from '../data/tripStore';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

export function CameraScreen({ route }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [shotsRemaining, setShotsRemaining] = useState(27);

  if (!permission) {
    return <View style={styles.center}><Text>Loading camera permissions…</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionTitle}>Camera access keeps the trip roll moving.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  async function takePhoto() {
    if (!cameraRef.current || shotsRemaining === 0 || !route.params?.tripId) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.75 });

    if (photo?.uri) {
      await savePhoto({
        tripId: route.params.tripId,
        localUri: photo.uri,
        filterStyle: 'classic-disposable',
        caption: 'Freshly captured memory',
      });
    }

    setShotsRemaining((count) => Math.max(0, count - 1));
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <Text style={styles.counter}>{shotsRemaining} exposures left</Text>
          <Pressable accessibilityLabel="Take photo" style={styles.shutter} onPress={takePhoto} />
          <Text style={styles.hint}>Photos stay hidden until the trip roll is developed.</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  permissionTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#0F172A', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
  buttonText: { color: '#FFFFFF', fontWeight: '800' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(2, 6, 23, 0.18)' },
  counter: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', backgroundColor: 'rgba(15, 23, 42, 0.65)', padding: 12, borderRadius: 999 },
  shutter: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#FFFFFF', borderWidth: 8, borderColor: '#CBD5E1' },
  hint: { color: '#E2E8F0', fontWeight: '700', marginHorizontal: 28, textAlign: 'center' },
});
