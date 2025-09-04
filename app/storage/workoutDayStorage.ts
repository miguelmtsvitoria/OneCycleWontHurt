import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout } from '../models/WorkoutDay';

const MYWORKOUTS_STORAGE_KEY = 'MYWORKOUTS';

export const DEFAULT_WORKOUT_DAYS: Workout[] = [
	{
		name: 'Miguel\'s Push day',
		date: '2025-08-18',
		exercises: [
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 74,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 9,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Egyptian Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Egyptian Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 9,
				time: 0,
			},
			{
				exerciseName: '3/2 Lateral Raises',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: '3/2 Lateral Raises',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 6,
				time: 0,
			},
		]
	},
	{
		name: 'Miguel\'s Pull day',
		date: '2025-08-19',
		exercises: [
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Lat Pulldown',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Lat Pulldown',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Lat Pulldown',
				exerciseType: 'Rep',
				weight: 5,
				repetitions: 12,
				time: 0,
			},
		]
	},
	{
		name: 'Miguel\'s Annual Leg day',
		date: '2025-08-20',
		exercises: [
			{
				exerciseName: 'Barbell Squat',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: 'Barbell Squat',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
		]
	},
	{
		name: 'Miguel\'s Push day',
		date: '2025-08-22',
		exercises: [
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 80,
				repetitions: 7,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 9,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 7,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Egyptian Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Egyptian Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 9,
				time: 0,
			},
			{
				exerciseName: '3/2 Lateral Raises',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: '3/2 Lateral Raises',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 6,
				time: 0,
			},
		]
	},
	{
		name: 'Miguel\'s Pull day',
		date: '2025-08-23',
		exercises: [
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Lat Pulldown',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Lat Pulldown',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Lat Pulldown',
				exerciseType: 'Rep',
				weight: 5,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Incline Dumbbell Curl',
				exerciseType: 'Rep',
				weight: 12,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Incline Dumbbell Curl',
				exerciseType: 'Rep',
				weight: 12,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Incline Dumbbell Curl',
				exerciseType: 'Rep',
				weight: 12,
				repetitions: 8,
				time: 0,
			},
		]
	},
	{
		name: 'Miguel\'s Push day',
		date: '2025-08-25',
		exercises: [
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 80,
				repetitions: 6,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 9,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 7,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Egyptian Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Egyptian Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 9,
				time: 0,
			},		
		]
	},
	{
		name: 'Miguel\'s Pull day',
		date: '2025-08-26',
		exercises: [
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Lat Pulldown',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Lat Pulldown',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Lat Pulldown',
				exerciseType: 'Rep',
				weight: 5,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Incline Dumbbell Curl',
				exerciseType: 'Rep',
				weight: 12,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Incline Dumbbell Curl',
				exerciseType: 'Rep',
				weight: 12,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Incline Dumbbell Curl',
				exerciseType: 'Rep',
				weight: 12,
				repetitions: 8,
				time: 0,
			},
		]
	},
	{
		name: 'Miguel\'s Annual Leg day',
		date: '2025-08-28',
		exercises: [
			{
				exerciseName: 'Barbell Squat',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: 'Barbell Squat',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: 'Barbell Squat',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
		]
	},
	{
		name: 'Miguel\'s Push day',
		date: '2025-08-29',
		exercises: [
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 80,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 9,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 6,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Egyptian Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Egyptian Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 9,
				time: 0,
			},
			{
				exerciseName: '3/2 Lateral Raises',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: '3/2 Lateral Raises',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 6,
				time: 0,
			},
		]
	},
	{
		name: 'Running',
		date: '2025-08-30',
		exercises: [
			{
				exerciseName: 'Running',
				exerciseType: 'Distance',
				weight: 0,
				repetitions: 0,
				time: 32,
				distance: 5,
			},
		]
	},
	{
		name: 'Running',
		date: '2025-09-01',
		exercises: [
			{
				exerciseName: 'Running',
				exerciseType: 'Distance',
				weight: 0,
				repetitions: 0,
				time: 57.49,
				distance: 10,
			},
		]
	},
	{
		name: 'Miguel\'s Push day',
		date: '2025-09-01',
		exercises: [
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 80,
				repetitions: 7,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 6,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Seated Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Barbell Bench Press (Incline)',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Egyptian Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Egyptian Lateral Raises',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 9,
				time: 0,
			},
			{
				exerciseName: '3/2 Lateral Raises',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: '3/2 Lateral Raises',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 6,
				time: 0,
			},
		]
	},
	{
		name: 'Miguel\'s Pull day',
		date: '2025-09-02',
		exercises: [
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Pull Up',
				exerciseType: 'Calisthenics',
				weight: 0,
				repetitions: 6,
				time: 0,
			},
			{
				exerciseName: 'Lat Pulldown',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Lat Pulldown',
				exerciseType: 'Rep',
				weight: 6,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Lat Pulldown',
				exerciseType: 'Rep',
				weight: 5,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Incline Dumbbell Curl',
				exerciseType: 'Rep',
				weight: 12,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Incline Dumbbell Curl',
				exerciseType: 'Rep',
				weight: 12,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Incline Dumbbell Curl',
				exerciseType: 'Rep',
				weight: 12,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: 'Dumbbell Curl',
				exerciseType: 'Rep',
				weight: 12,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Dumbbell Curl',
				exerciseType: 'Rep',
				weight: 12,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Dumbbell Curl',
				exerciseType: 'Rep',
				weight: 12,
				repetitions: 8,
				time: 0,
			},
		]
	},
	{
		name: 'Miguel\'s Annual Leg day',
		date: '2025-09-03',
		exercises: [
			{
				exerciseName: 'Barbell Squat',
				exerciseType: 'Rep',
				weight: 50,
				repetitions: 10,
				time: 0,
			},
			{
				exerciseName: 'Barbell Squat',
				exerciseType: 'Rep',
				weight: 60,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: 'Barbell Squat',
				exerciseType: 'Rep',
				weight: 70,
				repetitions: 8,
				time: 0,
			},
			{
				exerciseName: 'Barbell Squat',
				exerciseType: 'Rep',
				weight: 80,
				repetitions: 5,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
			{
				exerciseName: 'Leg Extensions',
				exerciseType: 'Rep',
				weight: 8,
				repetitions: 12,
				time: 0,
			},
		]
	},
];

export async function clearAllMyWorkouts() {
	await AsyncStorage.removeItem(MYWORKOUTS_STORAGE_KEY);
}

export async function initializeDefaultWorkoutDays() {
	const existing = await loadMyWorkouts();
	if (existing.length === 0) {
		await saveMyWorkout(DEFAULT_WORKOUT_DAYS);
		return DEFAULT_WORKOUT_DAYS;
	}
	return existing;
}

export async function saveMyWorkout(exercises: Workout[]) {
	try {
		const json = JSON.stringify(exercises);
		await AsyncStorage.setItem(MYWORKOUTS_STORAGE_KEY, json);
	} catch (e) {
		console.error('Failed to save workouts:', e);
	}
}

export async function loadMyWorkouts(): Promise<Workout[]> {
	// clearAllMyWorkouts()
	try {
		const json = await AsyncStorage.getItem(MYWORKOUTS_STORAGE_KEY);
		return json ? JSON.parse(json) : [];
	} catch (e) {
		console.error('Failed to load workouts:', e);
		return [];
	}
}

export async function addMyWorkout(newWorkout: Workout) {
	const workouts = await loadMyWorkouts();
	const updated = [...workouts, newWorkout];
	await saveMyWorkout(updated);
	return updated;
}
