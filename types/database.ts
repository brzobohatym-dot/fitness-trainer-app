export type UserRole = 'trainer' | 'client'
export type ExerciseType = 'strength' | 'cardio' | 'mobility' | 'stretching' | 'warmup'
export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full_body'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  trainer_id: string | null
  created_at: string
}

export interface Exercise {
  id: string
  trainer_id: string
  name: string
  description: string | null
  youtube_url: string | null
  exercise_type: ExerciseType
  muscle_group: MuscleGroup
  difficulty: Difficulty
  created_at: string
}

export interface TrainingPlan {
  id: string
  trainer_id: string
  name: string
  description: string | null
  is_template: boolean
  created_at: string
}

export interface PlanExercise {
  id: string
  plan_id: string
  exercise_id: string
  order_index: number
  sets: number
  reps: string
  rest_seconds: number
  notes: string | null
  exercise?: Exercise
}

export interface ClientPlan {
  id: string
  plan_id: string
  client_id: string
  assigned_at: string
  start_date: string | null
  end_date: string | null
  plan?: TrainingPlan
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      exercises: {
        Row: Exercise
        Insert: Omit<Exercise, 'id' | 'created_at'>
        Update: Partial<Omit<Exercise, 'id' | 'trainer_id' | 'created_at'>>
      }
      training_plans: {
        Row: TrainingPlan
        Insert: Omit<TrainingPlan, 'id' | 'created_at'>
        Update: Partial<Omit<TrainingPlan, 'id' | 'trainer_id' | 'created_at'>>
      }
      plan_exercises: {
        Row: PlanExercise
        Insert: Omit<PlanExercise, 'id'>
        Update: Partial<Omit<PlanExercise, 'id' | 'plan_id'>>
      }
      client_plans: {
        Row: ClientPlan
        Insert: Omit<ClientPlan, 'id' | 'assigned_at'>
        Update: Partial<Omit<ClientPlan, 'id' | 'assigned_at'>>
      }
    }
  }
}

// Helper type for Supabase query results
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

// Labels for UI
export const exerciseTypeLabels: Record<ExerciseType, string> = {
  strength: 'Síla',
  cardio: 'Kardio',
  mobility: 'Mobilita',
  stretching: 'Strečink',
  warmup: 'Zahřátí',
}

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  chest: 'Prsa',
  back: 'Záda',
  legs: 'Nohy',
  shoulders: 'Ramena',
  arms: 'Ruce',
  core: 'Core',
  full_body: 'Celé tělo',
}

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: 'Začátečník',
  intermediate: 'Středně pokročilý',
  advanced: 'Pokročilý',
}

export const roleLabels: Record<UserRole, string> = {
  trainer: 'Trenér',
  client: 'Klient',
}
