export type Exercise = {
    id: number;
    attributes: {
      exercise_name: string;
      reps: number;
      json: Record<string, any>; // or define a custom type if you know the shape
      url: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  
  export type ExercisesResponse = {
    data: Exercise[];
    meta?: any;
};
  
export interface ExerciseStat {
  rep_done: number;
  score: number;
  location?: string; // Optional location field
  timestamp?: string; // When the exercise was performed
}

export interface ExerciseStats {
  [exerciseName: string]: ExerciseStat;
}

export interface WorkoutSummary {
  yoga_name: string;
  reps: number;
  score: number;
  time: number;
  exercises: ExerciseStats;
  summaryJson: string;
  location?: string; // Optional location field
}