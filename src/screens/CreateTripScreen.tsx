import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { saveTrip } from '../data/tripStore';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateTrip'>;

export function CreateTripScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  async function createTrip() {
    const trip = await saveTrip({
      title: title.trim() || 'Untitled trip',
      description: description.trim(),
      location: location.trim() || 'Location TBD',
      startDate: startDate.trim(),
      endDate: endDate.trim(),
    });

    navigation.replace('TripDetail', { tripId: trip.id });
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>New roll</Text>
        <Text style={styles.title}>Design a trip album before the first photo.</Text>
        <Text style={styles.copy}>Name the memory, pick the place, then every disposable-style shot lands exactly where it belongs.</Text>
      </View>
      <View style={styles.formCard}>
        <TextInput style={styles.input} placeholder="Trip name" placeholderTextColor="#C2410C" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#C2410C" value={description} onChangeText={setDescription} />
        <TextInput style={styles.input} placeholder="Destination" placeholderTextColor="#C2410C" value={location} onChangeText={setLocation} />
        <View style={styles.dateRow}>
          <TextInput style={[styles.input, styles.dateInput]} placeholder="Start" placeholderTextColor="#C2410C" value={startDate} onChangeText={setStartDate} />
          <TextInput style={[styles.input, styles.dateInput]} placeholder="End" placeholderTextColor="#C2410C" value={endDate} onChangeText={setEndDate} />
        </View>
        <Pressable style={styles.button} onPress={createTrip}>
          <Text style={styles.buttonText}>Create beautiful album</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#431407', padding: 20, paddingTop: 88, gap: 18 },
  headerCard: { backgroundColor: '#FFF7ED', borderRadius: 34, padding: 24, shadowColor: '#1C1917', shadowOpacity: 0.2, shadowRadius: 22 },
  eyebrow: { color: '#EA580C', fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: '#431407', fontSize: 32, fontWeight: '900', letterSpacing: -0.7, lineHeight: 36, marginTop: 10 },
  copy: { color: '#7C2D12', fontSize: 16, fontWeight: '700', lineHeight: 23, marginTop: 10 },
  formCard: { backgroundColor: 'rgba(255, 237, 213, 0.92)', borderRadius: 30, gap: 12, padding: 16 },
  input: { backgroundColor: '#FFF7ED', borderColor: 'rgba(253, 186, 116, 0.9)', borderRadius: 20, borderWidth: 1, color: '#431407', fontSize: 16, fontWeight: '700', padding: 16 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInput: { flex: 1 },
  button: { alignItems: 'center', backgroundColor: '#FDBA74', borderRadius: 22, marginTop: 4, padding: 17 },
  buttonText: { color: '#431407', fontSize: 16, fontWeight: '900' },
});
