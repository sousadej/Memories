import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { CameraScreen } from './src/screens/CameraScreen';
import { CreateTripScreen } from './src/screens/CreateTripScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TripDetailScreen } from './src/screens/TripDetailScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerTransparent: true,
          headerBlurEffect: 'systemThinMaterialLight',
          headerShadowVisible: false,
          headerTintColor: '#FFF7ED',
          headerTitleStyle: { color: '#FFF7ED', fontWeight: '900' },
          contentStyle: { backgroundColor: '#431407' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Memories' }} />
        <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Trip Album' }} />
        <Stack.Screen name="Camera" component={CameraScreen} options={{ title: 'Disposable Camera' }} />
        <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ title: 'New Trip' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
