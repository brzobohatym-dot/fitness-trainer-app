-- Fitness Trainer App - Nové tabulky
-- Spustit v Supabase SQL Editor

-- ============================================
-- FÁZE 1: Statistiky a měření
-- ============================================

-- Osobní rekordy (PR)
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight DECIMAL(6,2) NOT NULL,
  reps INTEGER NOT NULL,
  one_rep_max DECIMAL(6,2),
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Měření těla
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  measured_at DATE DEFAULT CURRENT_DATE,
  body_weight DECIMAL(5,2),
  chest_cm DECIMAL(5,1),
  waist_cm DECIMAL(5,1),
  hips_cm DECIMAL(5,1),
  bicep_left_cm DECIMAL(5,1),
  bicep_right_cm DECIMAL(5,1),
  thigh_left_cm DECIMAL(5,1),
  thigh_right_cm DECIMAL(5,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fotogalerie progresu
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'front' CHECK (photo_type IN ('front', 'back', 'side', 'other')),
  taken_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FÁZE 2: Nástroje pro trenéra
-- ============================================

-- Kalendář naplánovaných tréninků
CREATE TABLE IF NOT EXISTS scheduled_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES training_plans(id) ON DELETE SET NULL,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'missed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FÁZE 3: Chat a zprávy
-- ============================================

-- Konverzace
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainer_id, client_id)
);

-- Zprávy
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FÁZE 4: Push notifikace
-- ============================================

-- Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Notifikace
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXY
-- ============================================

CREATE INDEX IF NOT EXISTS idx_personal_records_client ON personal_records(client_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(exercise_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_client ON body_measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(measured_at);
CREATE INDEX IF NOT EXISTS idx_progress_photos_client ON progress_photos(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_client ON scheduled_workouts(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_trainer ON scheduled_workouts(trainer_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_date ON scheduled_workouts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_conversations_trainer ON conversations(trainer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Personal Records policies
CREATE POLICY "Clients can view their own records"
  ON personal_records FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Trainers can view their clients' records"
  ON personal_records FOR SELECT
  USING (
    client_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

CREATE POLICY "Clients can insert their own records"
  ON personal_records FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their own records"
  ON personal_records FOR UPDATE
  USING (client_id = auth.uid());

CREATE POLICY "Clients can delete their own records"
  ON personal_records FOR DELETE
  USING (client_id = auth.uid());

-- Body Measurements policies
CREATE POLICY "Clients can view their own measurements"
  ON body_measurements FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Trainers can view their clients' measurements"
  ON body_measurements FOR SELECT
  USING (
    client_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

CREATE POLICY "Clients can insert their own measurements"
  ON body_measurements FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their own measurements"
  ON body_measurements FOR UPDATE
  USING (client_id = auth.uid());

CREATE POLICY "Clients can delete their own measurements"
  ON body_measurements FOR DELETE
  USING (client_id = auth.uid());

-- Progress Photos policies
CREATE POLICY "Clients can view their own photos"
  ON progress_photos FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Trainers can view their clients' photos"
  ON progress_photos FOR SELECT
  USING (
    client_id IN (SELECT id FROM profiles WHERE trainer_id = auth.uid())
  );

CREATE POLICY "Clients can insert their own photos"
  ON progress_photos FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their own photos"
  ON progress_photos FOR UPDATE
  USING (client_id = auth.uid());

CREATE POLICY "Clients can delete their own photos"
  ON progress_photos FOR DELETE
  USING (client_id = auth.uid());

-- Scheduled Workouts policies
CREATE POLICY "Trainers can view their scheduled workouts"
  ON scheduled_workouts FOR SELECT
  USING (trainer_id = auth.uid());

CREATE POLICY "Clients can view their scheduled workouts"
  ON scheduled_workouts FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Trainers can insert scheduled workouts"
  ON scheduled_workouts FOR INSERT
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "Trainers can update their scheduled workouts"
  ON scheduled_workouts FOR UPDATE
  USING (trainer_id = auth.uid());

CREATE POLICY "Trainers can delete their scheduled workouts"
  ON scheduled_workouts FOR DELETE
  USING (trainer_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (trainer_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "Trainers can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (trainer_id = auth.uid() OR client_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE trainer_id = auth.uid() OR client_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations
      WHERE trainer_id = auth.uid() OR client_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Push Subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- System can insert notifications (using service role)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- REALTIME
-- ============================================

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- FUNKCE: Automatický výpočet 1RM
-- ============================================

CREATE OR REPLACE FUNCTION calculate_one_rep_max()
RETURNS TRIGGER AS $$
BEGIN
  -- Epley formula: 1RM = weight * (1 + reps/30)
  IF NEW.reps > 0 AND NEW.reps <= 10 THEN
    NEW.one_rep_max := ROUND(NEW.weight * (1 + NEW.reps::decimal / 30), 2);
  ELSE
    NEW.one_rep_max := NEW.weight;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_1rm_on_insert
  BEFORE INSERT ON personal_records
  FOR EACH ROW EXECUTE FUNCTION calculate_one_rep_max();

CREATE TRIGGER calculate_1rm_on_update
  BEFORE UPDATE ON personal_records
  FOR EACH ROW EXECUTE FUNCTION calculate_one_rep_max();

-- ============================================
-- FUNKCE: Aktualizace last_message_at
-- ============================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_message_on_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();
