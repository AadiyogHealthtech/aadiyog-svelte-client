import { apiFetch } from "./fetchFromDb";
import type { ExercisesResponse, Exercise  } from "./types";

export const fetchExercises = async (): Promise<ExercisesResponse> => {
  return apiFetch<ExercisesResponse>('api/testings');
};