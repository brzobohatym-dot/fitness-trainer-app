export type UserRole = 'trainer' | 'client'
export type ExerciseType = 'strength' | 'cardio' | 'mobility' | 'stretching' | 'warmup'
export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full_body'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type PhotoType = 'front' | 'back' | 'side' | 'other'
export type WorkoutStatus = 'scheduled' | 'completed' | 'cancelled' | 'missed'

export interface Profile {
  id: string
  email: string | null
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
  group_label: string
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

export interface WorkoutLog {
  id: string
  client_id: string
  plan_id: string
  fatigue_level: number
  muscle_pain: number
  mood: number
  notes: string | null
  created_at: string
}

export interface ExerciseLog {
  id: string
  workout_log_id: string
  plan_exercise_id: string
  set_number: number
  weight: number
  reps_completed: number | null
  created_at: string
}

// Nové typy - Fáze 1: Statistiky a měření

export interface PersonalRecord {
  id: string
  client_id: string
  exercise_id: string
  weight: number
  reps: number
  one_rep_max: number | null
  achieved_at: string
  workout_log_id: string | null
  created_at: string
  exercise?: Exercise
}

export interface BodyMeasurement {
  id: string
  client_id: string
  measured_at: string
  body_weight: number | null
  chest_cm: number | null
  waist_cm: number | null
  hips_cm: number | null
  bicep_left_cm: number | null
  bicep_right_cm: number | null
  thigh_left_cm: number | null
  thigh_right_cm: number | null
  notes: string | null
  file_url: string | null
  created_at: string
}

export interface ProgressPhoto {
  id: string
  client_id: string
  photo_url: string
  photo_type: PhotoType
  taken_at: string
  notes: string | null
  created_at: string
}

// Nové typy - Fáze 2: Nástroje pro trenéra

export interface ScheduledWorkout {
  id: string
  client_id: string
  plan_id: string | null
  trainer_id: string
  scheduled_date: string
  scheduled_time: string | null
  status: WorkoutStatus
  notes: string | null
  created_at: string
  client?: Profile
  plan?: TrainingPlan
}

// Nové typy - Fáze 3: Chat a zprávy

export interface Conversation {
  id: string
  trainer_id: string
  client_id: string
  last_message_at: string
  created_at: string
  trainer?: Profile
  client?: Profile
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
  sender?: Profile
}

// Nové typy - Fáze 4: Push notifikace

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  link: string | null
  read_at: string | null
  created_at: string
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
      workout_logs: {
        Row: WorkoutLog
        Insert: Omit<WorkoutLog, 'id' | 'created_at'>
        Update: Partial<Omit<WorkoutLog, 'id' | 'created_at'>>
      }
      exercise_logs: {
        Row: ExerciseLog
        Insert: Omit<ExerciseLog, 'id' | 'created_at'>
        Update: Partial<Omit<ExerciseLog, 'id' | 'created_at'>>
      }
      personal_records: {
        Row: PersonalRecord
        Insert: Omit<PersonalRecord, 'id' | 'created_at' | 'one_rep_max'>
        Update: Partial<Omit<PersonalRecord, 'id' | 'created_at'>>
      }
      body_measurements: {
        Row: BodyMeasurement
        Insert: Omit<BodyMeasurement, 'id' | 'created_at'>
        Update: Partial<Omit<BodyMeasurement, 'id' | 'created_at'>>
      }
      progress_photos: {
        Row: ProgressPhoto
        Insert: Omit<ProgressPhoto, 'id' | 'created_at'>
        Update: Partial<Omit<ProgressPhoto, 'id' | 'created_at'>>
      }
      scheduled_workouts: {
        Row: ScheduledWorkout
        Insert: Omit<ScheduledWorkout, 'id' | 'created_at'>
        Update: Partial<Omit<ScheduledWorkout, 'id' | 'created_at'>>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at' | 'last_message_at'>
        Update: Partial<Omit<Conversation, 'id' | 'created_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
      push_subscriptions: {
        Row: PushSubscription
        Insert: Omit<PushSubscription, 'id' | 'created_at'>
        Update: Partial<Omit<PushSubscription, 'id' | 'created_at'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
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

export const photoTypeLabels: Record<PhotoType, string> = {
  front: 'Zepředu',
  back: 'Zezadu',
  side: 'Z boku',
  other: 'Jiné',
}

export const workoutStatusLabels: Record<WorkoutStatus, string> = {
  scheduled: 'Naplánováno',
  completed: 'Dokončeno',
  cancelled: 'Zrušeno',
  missed: 'Zmeškaný',
}
