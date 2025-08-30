import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout } from '../models/Workout';

const WORKOUT_STORAGE_KEY = 'WORKOUTS';

export const DEFAULT_WORKOUT_NAMES: Workout[] = [
	{
		name: 'Miguel\'s Push day',
		exercises: [
			'Barbell Bench Press', 'Barbell Bench Press', 'Barbell Bench Press',
			'Seated Lateral Raises', 'Seated Lateral Raises',
			'Barbell Bench Press (Incline)', 'Barbell Bench Press (Incline)', 'Barbell Bench Press (Incline)',
			'Egyptian Lateral Raises', 'Egyptian Lateral Raises',
			'3/2 Lateral Raises', '3/2 Lateral Raises',
			'Cable Pushdowns', 'Cable Pushdowns', 'Cable Pushdowns'
		]
	},
	{
		name: 'Miguel\'s Pull day',
		exercises: [
			'Pull Up', 'Pull Up', 'Pull Up',
			'Lat Pulldown', 'Lat Pulldown', 'Lat Pulldown',
			'Incline Dumbbell Curl', 'Incline Dumbbell Curl', 'Incline Dumbbell Curl',
			'Dumbbell Curl', 'Dumbbell Curl', 'Dumbbell Curl',
		]
	},
	{
		name: 'Miguel\'s Annual Leg day',
		exercises: [
			'Barbell Squat', 'Barbell Squat', 'Barbell Squat',
			'Leg Extensions', 'Leg Extensions', 'Leg Extensions',
			'Leg Extensions', 'Leg Extensions', 'Leg Extensions',
			'Lunges', 'Lunges',
			'Lunges', 'Lunges',
		]
	},
	{
		name: 'Running',
		exercises: [
			'Running',
		]
	},
];

export async function clearAllWorkouts() {
	await AsyncStorage.removeItem(WORKOUT_STORAGE_KEY);
}

export async function initializeDefaultWorkouts() {
	const existing = await loadWorkouts();
	if (existing.length === 0) {
		await saveWorkout(DEFAULT_WORKOUT_NAMES);
		return DEFAULT_WORKOUT_NAMES;
	}
	return existing;
}

export async function saveWorkout(exercises: Workout[]) {
	try {
		const json = JSON.stringify(exercises);
		await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, json);
	} catch (e) {
		console.error('Failed to save workouts:', e);
	}
}

export async function loadWorkouts(): Promise<Workout[]> {
	try {
		const json = await AsyncStorage.getItem(WORKOUT_STORAGE_KEY);
		return json ? JSON.parse(json) : [];
	} catch (e) {
		console.error('Failed to load workouts:', e);
		return [];
	}
}

export async function addWorkout(newWorkout: Workout) {
	const workouts = await loadWorkouts();
	const updated = [...workouts, newWorkout];
	await saveWorkout(updated);
	return updated;
}

export async function updateWorkout(index: number, updatedWorkout: Workout) {
    const workouts = await loadWorkouts();
    if (index < 0 || index >= workouts.length) return;
    workouts[index] = updatedWorkout;
    await saveWorkout(workouts);
    return workouts;
}
