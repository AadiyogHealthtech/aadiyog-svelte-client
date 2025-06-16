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