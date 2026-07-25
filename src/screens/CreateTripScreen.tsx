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
      <Text style={styles.title}>Start a shared roll</Text>
      <TextInput style={styles.input} placeholder="Trip name" placeholderTextColor="#94A3B8" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#94A3B8" value={description} onChangeText={setDescription} />
      <TextInput style={styles.input} placeholder="Destination" placeholderTextColor="#94A3B8" value={location} onChangeText={setLocation} />
      <TextInput style={styles.input} placeholder="Start date" placeholderTextColor="#94A3B8" value={startDate} onChangeText={setStartDate} />
      <TextInput style={styles.input} placeholder="End date" placeholderTextColor="#94A3B8" value={endDate} onChangeText={setEndDate} />
      <Pressable style={styles.button} onPress={createTrip}>
        <Text style={styles.buttonText}>Create trip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 14 },
  title: { color: '#0F172A', fontSize: 32, fontWeight: '900', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  button: { backgroundColor: '#0EA5E9', borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});
