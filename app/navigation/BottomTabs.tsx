import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';
import { useWorkoutContext } from '../context/WorkoutContext';
import ExercisesScreen from '../screens/ExercisesScreen';
import LogScreen from '../screens/LogScreen';
import MyWorkoutScreen from '../screens/MyWorkoutScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
    const { workoutActive } = useWorkoutContext();

    return (
        <Tab.Navigator
            initialRouteName="MyWorkout"
            screenOptions={({ route }) => {
                let iconName = '';
                if (route.name === 'Exercises') iconName = 'barbell-outline';
                else if (route.name === 'Workouts') iconName = 'repeat-outline';
                else if (route.name === 'MyWorkout') iconName = 'pulse-outline';
                else if (route.name === 'Log') iconName = 'document-text-outline';
                else if (route.name === 'Statistics') iconName = 'stats-chart-outline';

                const isMyWorkout = route.name === 'MyWorkout';
                const isDisabled = workoutActive ? !isMyWorkout : isMyWorkout;

                return {
                    tabBarIcon: ({ color, size, focused }) => {
                        if (isMyWorkout) {
                            return (
                                <Ionicons
                                    name={iconName as keyof typeof Ionicons.glyphMap}
                                    size={32}
                                    color={focused ? 'white' : '#888'}
                                />
                            );
                        }
                        return (
                            <Ionicons
                                name={iconName as keyof typeof Ionicons.glyphMap}
                                size={size}
                                color={isDisabled ? '#aaa' : color}
                            />
                        );
                    },
                    tabBarButton: (props) => {
                        if (isMyWorkout) {
                            // @ts-ignore
                            const { accessibilityState, onPress, ...rest } = props;
                            const focused = accessibilityState?.selected;
                            return (
                                <TouchableOpacity
                                    {...rest}
                                    onPress={onPress}
                                    disabled={isDisabled}
                                    style={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: 32,
                                        backgroundColor: isDisabled ? '#e0e0e0' : '#ff4343ff',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        alignSelf: 'center', // <-- Add this line
                                        marginTop: -20,
                                        borderWidth: 3,
                                        borderColor: isDisabled ? '#c9c9c9ff' : '#9c0000ff',
                                        opacity: 1,
                                    }}
                                >
                                    <Ionicons
                                        name={iconName as keyof typeof Ionicons.glyphMap}
                                        size={32}
                                        color={isDisabled ? '#c9c9c9ff' : '#9c0000ff'}
                                    />
                                </TouchableOpacity>
                            );
                        }
                        return (
                            <TouchableOpacity
                                {...props}
                                disabled={isDisabled}
                                style={{
                                    opacity: isDisabled ? 0.5 : 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    ...(isDisabled ? { pointerEvents: 'none' } : {}),
                                }}
                            />
                        );
                    },
                    tabBarActiveTintColor: 'red',
                    tabBarInactiveTintColor: 'gray',
                    tabBarStyle: {
                        backgroundColor: '#e0e0e0',
                        borderTopColor: '#ccc',
                        height: 80,
                    },
                };
            }}
        >
            <Tab.Screen name="Exercises" component={ExercisesScreen} />
            <Tab.Screen name="Workouts" component={WorkoutsScreen} />
            <Tab.Screen name="MyWorkout" component={MyWorkoutScreen} />
            <Tab.Screen name="Log" component={LogScreen} />
            <Tab.Screen name="Statistics" component={StatisticsScreen} />
        </Tab.Navigator>
    );
}