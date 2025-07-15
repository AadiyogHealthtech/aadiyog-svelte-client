  import { writable } from 'svelte/store';
  export interface ExerciseState {
    reps: number;
    score: number;
    currentExercise: string;
    currentPhase: string | null;
    lastUpdate: number;
  }

  export const exerciseState = writable<ExerciseState>({
    reps: 0,
    score: 0,
    currentExercise: '',
    currentPhase: null,
    lastUpdate: 0
  });

  export function updateExerciseState(update: Partial<ExerciseState>) {
    exerciseState.update(state => ({
      ...state,
      ...update,
      lastUpdate: Date.now()
    }));
  }
