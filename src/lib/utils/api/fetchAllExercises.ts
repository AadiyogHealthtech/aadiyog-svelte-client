// src/lib/api/fetchAltExercises.ts

interface ExerciseAttributes {
    name: string;
    reps: number;
    altUrl: string;
  }
  
  interface Exercise {
    id: number;
    attributes: ExerciseAttributes;
  }
  
  interface StrapiResponse {
    data: Exercise[];
  }
  
  interface CombinedExerciseData {
    name: string;
    reps: number;
    altData: any; // You can strongly type this based on your JSON structure
  }
  
  /**
   * Fetches all exercises from Strapi and loads altUrl JSONs
   */
  export const fetchAltExercises = async (token?: string): Promise<CombinedExerciseData[]> => {
    const apiUrl = 'https://v2.app.aadiyog.in/api/testings';
  
    try {
      // 1. Fetch exercise list from Strapi
      const res = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
        //   ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
  
      if (!res.ok) {
        throw new Error(`Failed to fetch exercises: ${res.statusText}`);
      }
  
      const strapiData: StrapiResponse = await res.json();
  
      // 2. Fetch all altUrl JSON files in parallel
      const results = await Promise.all(
        strapiData.data.map(async (exercise) => {
          const { name, reps, altUrl } = exercise.attributes;
  
          try {
            const jsonRes = await fetch(altUrl);
            if (!jsonRes.ok) throw new Error(`Failed to fetch altUrl: ${altUrl}`);
            const altData = await jsonRes.json();
  
            return { name, reps, altData };
          } catch (err) {
            console.error(`Error fetching altUrl for "${name}":`, err);
            return null;
          }
        })
      );
  
      // 3. Filter out any failed fetches
      return results.filter((item): item is CombinedExerciseData => item !== null);
    } catch (err) {
      console.error('[fetchAltExercises] Error:', err);
      return [];
    }
  };
  