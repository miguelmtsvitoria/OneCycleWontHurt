import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WorkoutProvider } from './context/WorkoutContext'; // Add this import
import BottomTabs from './navigation/BottomTabs';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WorkoutProvider>
        <BottomTabs />
      </WorkoutProvider>
    </GestureHandlerRootView>
  );
}
