// src/lib/api.ts

export interface ExerciseAttributes {
    name: string;
    reps: number;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    altUrl: string;
  }
  
  export interface Exercise {
    id: number;
    attributes: ExerciseAttributes;
  }
  
  export interface ApiResponse {
    data: Exercise[];
    meta: {
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  }
  
  export async function fetchExercises(): Promise<Exercise[]> {
    const response = await fetch('https://v2.app.aadiyog.in/api/testings');
  
    if (!response.ok) {
      throw new Error(`Failed to fetch exercises: ${response.statusText}`);
    }
  
    const json: ApiResponse = await response.json();
    return json.data;
  }
  