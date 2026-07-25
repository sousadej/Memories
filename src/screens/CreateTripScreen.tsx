import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateTrip'>;

export function CreateTripScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start a shared roll</Text>
      <TextInput style={styles.input} placeholder="Trip name" placeholderTextColor="#94A3B8" />
      <TextInput style={styles.input} placeholder="Destination" placeholderTextColor="#94A3B8" />
      <TextInput style={styles.input} placeholder="Dates" placeholderTextColor="#94A3B8" />
      <Pressable style={styles.button} onPress={() => navigation.navigate('Home')}>
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
