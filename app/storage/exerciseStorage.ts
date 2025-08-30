import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from '../models/Exercise';

const EXERCISE_STORAGE_KEY = 'EXERCISES';

const DEFAULT_EXERCISES: Exercise[] = [
	{
		name: 'Pull Up',
		category: 'Back',
		type: 'Calisthenics',
	},
	{
		name: 'Weighted Pull Up',
		category: 'Back',
		type: 'Rep',
	},
	{
		name: 'Lat Pulldown',
		category: 'Back',
		type: 'Rep',
	},
	{
		name: 'Barbell Row',
		category: 'Back',
		type: 'Rep'
	},
	{
		name: 'Cable Pulldown',
		category: 'Back',
		type: 'Rep'
	},
	{
		name: 'Dumbbell Row',
		category: 'Back',
		type: 'Rep'
	},
	{
		name: 'Straight Arm Pulldown',
		category: 'Back',
		type: 'Rep'
	},
	{
		name: 'Hyperextensions',
		category: 'Back',
		type: 'Calisthenics'
	},

	{
		name: 'Barbell Bench Press',
		category: 'Chest',
		type: 'Rep'
	},
	{
		name: 'Barbell Bench Press (Incline)',
		category: 'Chest',
		type: 'Rep'
	},
	{
		name: 'Barbell Bench Press (Decline)',
		category: 'Chest',
		type: 'Rep'
	},
	{
		name: 'Dumbbell Bench Press',
		category: 'Chest',
		type: 'Rep'
	},
	{
		name: 'Dumbbell Bench Press (Incline)',
		category: 'Chest',
		type: 'Rep'
	},
	{
		name: 'Dumbbell Bench Press (Decline)',
		category: 'Chest',
		type: 'Rep'
	},
	{
		name: 'Pushups',
		category: 'Chest',
		type: 'Calisthenics'
	},
	{
		name: 'Dumbbell Flies',
		category: 'Chest',
		type: 'Rep'
	},
	{
		name: 'Machine Flies',
		category: 'Chest',
		type: 'Rep'
	},
	{
		name: 'Cable Flies',
		category: 'Chest',
		type: 'Rep'
	},
	{
		name: 'Chest Focused Dips',
		category: 'Chest',
		type: 'Calisthenics'
	},
	{
		name: 'Chest Focused Dips (Weighted)',
		category: 'Chest',
		type: 'Rep'
	},
	{
		name: 'Deadlift',
		category: 'Legs',
		type: 'Rep'
	},
	{
		name: 'Barbell Squat',
		category: 'Legs',
		type: 'Rep'
	},
	{
		name: 'Barbell Front Squat',
		category: 'Legs',
		type: 'Rep'
	},
	{
		name: 'Barbell Lunges',
		category: 'Legs',
		type: 'Rep'
	},
	{
		name: 'Lunges',
		category: 'Legs',
		type: 'Calisthenics'
	},
	{
		name: 'Weighted Lunges',
		category: 'Legs',
		type: 'Calisthenics'
	},
	{
		name: 'Bulgarian Split Squat',
		category: 'Legs',
		type: 'Rep'
	},
	{
		name: 'Leg Extensions',
		category: 'Legs',
		type: 'Rep'
	},
	{
		name: 'Leg Curls',
		category: 'Legs',
		type: 'Rep'
	},
	{
		name: 'Leg Press',
		category: 'Legs',
		type: 'Rep'
	},
	{
		name: 'Romanian Deadlift',
		category: 'Legs',
		type: 'Rep'
	},
	{
		name: 'Calf Raises',
		category: 'Legs',
		type: 'Rep'
	},
	{
		name: 'Machine Calf Raises',
		category: 'Legs',
		type: 'Rep'
	},

	{
		name: 'Standing Lateral Raises',
		category: 'Shoulders',
		type: 'Rep'
	},
	{
		name: 'Seated Lateral Raises',
		category: 'Shoulders',
		type: 'Rep'
	},
	{
		name: 'Machine Lateral Raises',
		category: 'Shoulders',
		type: 'Rep'
	},
	{
		name: 'Cable Lateral Raises',
		category: 'Shoulders',
		type: 'Rep'
	},
	{
		name: '3/2 Lateral Raises',
		category: 'Shoulders',
		type: 'Rep'
	},
	{
		name: 'Egyptian Lateral Raises',
		category: 'Shoulders',
		type: 'Rep'
	},
	{
		name: 'Barbell Overhead Press',
		category: 'Shoulders',
		type: 'Rep'
	},
	{
		name: 'Dumbbell Overhead Press',
		category: 'Shoulders',
		type: 'Rep'
	},
	{
		name: 'Arnold Press',
		category: 'Shoulders',
		type: 'Rep'
	},
	{
		name: 'Face Pulls',
		category: 'Shoulders',
		type: 'Rep'
	},
	{
		name: 'Rear Delt Flyes',
		category: 'Shoulders',
		type: 'Rep'
	},
	{
		name: 'Rear Delt Cable Flyes',
		category: 'Shoulders',
		type: 'Rep'
	},

	{
		name: 'Tricep Cable Extensions',
		category: 'Triceps',
		type: 'Rep'
	},
	{
		name: 'Cable Pushdowns',
		category: 'Triceps',
		type: 'Rep'
	},
	{
		name: 'Dumbbell Skullcrushers',
		category: 'Triceps',
		type: 'Rep'
	},
	{
		name: 'Barbell Skullcrushers',
		category: 'Triceps',
		type: 'Rep'
	},
	{
		name: 'Tricep Focused Dips (Weighted)',
		category: 'Triceps',
		type: 'Rep'
	},
	{
		name: 'Tricep Focused Dips',
		category: 'Triceps',
		type: 'Calisthenics'
	},

	{
		name: 'Dumbbell Curl',
		category: 'Biceps',
		type: 'Rep'
	},
	{
		name: 'Barbell Curl',
		category: 'Biceps',
		type: 'Rep'
	},
	{
		name: 'Cable Curl',
		category: 'Biceps',
		type: 'Rep'
	},
	{
		name: 'Hammer Curl',
		category: 'Biceps',
		type: 'Rep'
	},
	{
		name: 'Incline Dumbbell Curl',
		category: 'Biceps',
		type: 'Rep'
	},
	{
		name: 'Preacher Curl',
		category: 'Biceps',
		type: 'Rep'
	},

	{
		name: 'Sit Ups',
		category: 'Abs',
		type: 'Calisthenics'
	},
	{
		name: 'Lying Leg Raises',
		category: 'Abs',
		type: 'Calisthenics'
	},
	{
		name: 'Hanging Leg Raises',
		category: 'Abs',
		type: 'Calisthenics'
	},
	{
		name: 'Cable Crunches',
		category: 'Abs',
		type: 'Rep'
	},
	{
		name: 'Plank',
		category: 'Abs',
		type: 'Time'
	},

	{
		name: 'Running',
		category: 'Cardio',
		type: 'Distance'
	},
	{
		name: 'Cycling',
		category: 'Cardio',
		type: 'Distance'
	},
	{
		name: 'Walking',
		category: 'Cardio',
		type: 'Distance'
	},
	{
		name: 'Stair Master',
		category: 'Cardio',
		type: 'Time'
	},
];

export async function clearAllExercises() {
	await AsyncStorage.removeItem(EXERCISE_STORAGE_KEY);
}

export async function initializeDefaultExercises() {
	const existing = await loadExercises();
	if (existing.length === 0) {
		await saveExercises(DEFAULT_EXERCISES);
		return DEFAULT_EXERCISES;
	}
	return existing;
}

export async function saveExercises(exercises: Exercise[]) {
	try {
		const json = JSON.stringify(exercises);
		await AsyncStorage.setItem(EXERCISE_STORAGE_KEY, json);
	} catch (e) {
		console.error('Failed to save exercises:', e);
	}
}

export async function loadExercises(): Promise<Exercise[]> {
	// clearAllExercises()
	try {
		const json = await AsyncStorage.getItem(EXERCISE_STORAGE_KEY);
		return json ? JSON.parse(json) : [];
	} catch (e) {
		console.error('Failed to load exercises:', e);
		return [];
	}
}

export async function addExercise(newExercise: Exercise) {
	const exercises = await loadExercises();
	const updated = [...exercises, newExercise];
	await saveExercises(updated);
	return updated;
}
