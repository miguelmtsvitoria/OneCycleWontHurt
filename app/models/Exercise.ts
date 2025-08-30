export type ExerciseCategory = 'Back' | 'Chest' | 'Legs' | 'Shoulders' | 'Triceps' | 'Biceps' | 'Cardio' | 'Abs';
export type ExerciseType = 'Rep' | 'Time' | 'Distance' | 'Calisthenics';


export interface Exercise {
  name: string;
  category: ExerciseCategory;
  type: ExerciseType;
}
