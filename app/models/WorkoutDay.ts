
export interface Workout {
  name: string;
  exercises: WorkoutExercise[];
  date: string; // ISO format '2025-06-04'
}

export interface WorkoutExercise {
  exerciseName: string;
  exerciseType: string
  weight?: number;       // for type === 'Rep'
  repetitions?: number;  // for type === 'Rep' or 'Calisthenics'
  time?: number;         // for type === 'Time' or 'Distance'
  distance?: number;     // for type === 'Distance'
}