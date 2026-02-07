-- Fitness Trainer App Database Schema
-- Run this in Supabase SQL Editor to set up your database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('trainer', 'client')) DEFAULT 'trainer',
  trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('strength', 'cardio', 'mobility', 'stretching', 'warmup')) DEFAULT 'strength',
  muscle_group TEXT NOT NULL CHECK (muscle_group IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body')) DEFAULT 'full_body',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training plans table
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan exercises (junction table)
CREATE TABLE IF NOT EXISTS plan_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10',
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  notes TEXT
);

-- Client plans (assignment of plans to clients)
CREATE TABLE IF NOT EXISTS client_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date DATE,
  end_date DATE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercises_trainer ON exercises(trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_trainer ON training_plans(trainer_id);
CREATE INDEX IF NOT EXISTS idx_plan_exercises_plan ON plan_exercises(plan_id);
CREATE INDEX IF NOT EXISTS idx_client_plans_client ON client_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_trainer ON profiles(trainer_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_plans ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Trainers can view their clients"
  ON profiles FOR SELECT
  USING (trainer_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Exercises policies
CREATE POLICY "Trainers can view their own exercises"
  ON exercises FOR SELECT
  USING (trainer_id = auth.uid());

CREATE POLICY "Clients can view exercises from their assigned plans"
  ON exercises FOR SELECT
  USING (
    id IN (
      SELECT pe.exercise_id FROM plan_exercises pe
      JOIN client_plans cp ON cp.plan_id = pe.plan_id
      WHERE cp.client_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can insert their own exercises"
  ON exercises FOR INSERT
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "Trainers can update their own exercises"
  ON exercises FOR UPDATE
  USING (trainer_id = auth.uid());

CREATE POLICY "Trainers can delete their own exercises"
  ON exercises FOR DELETE
  USING (trainer_id = auth.uid());

-- Training plans policies
CREATE POLICY "Trainers can view their own plans"
  ON training_plans FOR SELECT
  USING (trainer_id = auth.uid());

CREATE POLICY "Clients can view their assigned plans"
  ON training_plans FOR SELECT
  USING (
    id IN (SELECT plan_id FROM client_plans WHERE client_id = auth.uid())
  );

CREATE POLICY "Trainers can insert their own plans"
  ON training_plans FOR INSERT
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "Trainers can update their own plans"
  ON training_plans FOR UPDATE
  USING (trainer_id = auth.uid());

CREATE POLICY "Trainers can delete their own plans"
  ON training_plans FOR DELETE
  USING (trainer_id = auth.uid());

-- Plan exercises policies
CREATE POLICY "Trainers can view plan exercises for their plans"
  ON plan_exercises FOR SELECT
  USING (
    plan_id IN (SELECT id FROM training_plans WHERE trainer_id = auth.uid())
  );

CREATE POLICY "Clients can view plan exercises for their assigned plans"
  ON plan_exercises FOR SELECT
  USING (
    plan_id IN (SELECT plan_id FROM client_plans WHERE client_id = auth.uid())
  );

CREATE POLICY "Trainers can insert plan exercises for their plans"
  ON plan_exercises FOR INSERT
  WITH CHECK (
    plan_id IN (SELECT id FROM training_plans WHERE trainer_id = auth.uid())
  );

CREATE POLICY "Trainers can update plan exercises for their plans"
  ON plan_exercises FOR UPDATE
  USING (
    plan_id IN (SELECT id FROM training_plans WHERE trainer_id = auth.uid())
  );

CREATE POLICY "Trainers can delete plan exercises for their plans"
  ON plan_exercises FOR DELETE
  USING (
    plan_id IN (SELECT id FROM training_plans WHERE trainer_id = auth.uid())
  );

-- Client plans policies
CREATE POLICY "Trainers can view assignments for their clients"
  ON client_plans FOR SELECT
  USING (
    client_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

CREATE POLICY "Clients can view their own assignments"
  ON client_plans FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Trainers can assign plans to their clients"
  ON client_plans FOR INSERT
  WITH CHECK (
    client_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

CREATE POLICY "Trainers can update assignments for their clients"
  ON client_plans FOR UPDATE
  USING (
    client_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

CREATE POLICY "Trainers can delete assignments for their clients"
  ON client_plans FOR DELETE
  USING (
    client_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'trainer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
