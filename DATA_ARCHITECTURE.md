# Physiotherapy Application - Complete Data Architecture

## Table of Contents
1. [Supabase Database Schema](#1-supabase-database-schema)
2. [JSON Data Templates](#2-json-data-templates)
3. [API Endpoint Specifications](#3-api-endpoint-specifications)
4. [Additional Pages Identification](#4-additional-pages-identification)
5. [Data Flow Documentation](#5-data-flow-documentation)

---

## 1. Supabase Database Schema

### 1.1 Core Tables

#### `profiles`
User profile information (extends Supabase auth.users)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('patient', 'physiotherapist')),
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_online ON profiles(is_online);
```

**RLS Policies:**
```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can view other users' public profiles
CREATE POLICY "Public profiles are viewable by all users"
  ON profiles FOR SELECT
  USING (true);
```

#### `patient_profiles`
Extended patient-specific information

```sql
CREATE TABLE patient_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  injury_type TEXT,
  diagnosis TEXT,
  treatment_history JSONB,
  recovery_start_date DATE,
  current_stage TEXT,
  goals JSONB,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patient_profiles_injury_type ON patient_profiles(injury_type);
```

**RLS Policies:**
```sql
-- Patients can view their own profile
CREATE POLICY "Patients can view own profile"
  ON patient_profiles FOR SELECT
  USING (auth.uid() = id);

-- Physiotherapists can view their assigned patients
CREATE POLICY "Physiotherapists can view assigned patients"
  ON patient_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patient_physiotherapist_assignments
      WHERE patient_id = patient_profiles.id
      AND physiotherapist_id = auth.uid()
    )
  );

-- Patients can update their own profile
CREATE POLICY "Patients can update own profile"
  ON patient_profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### `physiotherapist_profiles`
Extended physiotherapist-specific information

```sql
CREATE TABLE physiotherapist_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  license_number TEXT UNIQUE,
  specialization TEXT[],
  years_of_experience INTEGER,
  bio TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  consultation_fee DECIMAL(10,2),
  availability_schedule JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_physiotherapist_specialization ON physiotherapist_profiles USING GIN(specialization);
```

**RLS Policies:**
```sql
-- Physiotherapists can view their own profile
CREATE POLICY "Physiotherapists can view own profile"
  ON physiotherapist_profiles FOR SELECT
  USING (auth.uid() = id);

-- Public profiles are viewable
CREATE POLICY "Physiotherapist profiles are viewable"
  ON physiotherapist_profiles FOR SELECT
  USING (true);

-- Physiotherapists can update their own profile
CREATE POLICY "Physiotherapists can update own profile"
  ON physiotherapist_profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### `patient_physiotherapist_assignments`
Assigns patients to physiotherapists

```sql
CREATE TABLE patient_physiotherapist_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  physiotherapist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, physiotherapist_id)
);

CREATE INDEX idx_assignments_patient ON patient_physiotherapist_assignments(patient_id);
CREATE INDEX idx_assignments_physiotherapist ON patient_physiotherapist_assignments(physiotherapist_id);
CREATE INDEX idx_assignments_status ON patient_physiotherapist_assignments(status);
```

**RLS Policies:**
```sql
-- Patients can view their own assignments
CREATE POLICY "Patients can view own assignments"
  ON patient_physiotherapist_assignments FOR SELECT
  USING (auth.uid() = patient_id);

-- Physiotherapists can view their patient assignments
CREATE POLICY "Physiotherapists can view assigned patients"
  ON patient_physiotherapist_assignments FOR SELECT
  USING (auth.uid() = physiotherapist_id);
```

### 1.2 Treatment Plans

#### `treatment_plans`
Main treatment plan documents (PDF attachments)

```sql
CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  physiotherapist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  pdf_url TEXT, -- Supabase Storage URL
  pdf_filename TEXT,
  pdf_size BIGINT,
  imported_from TEXT, -- External source identifier
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  start_date DATE,
  end_date DATE,
  duration_weeks INTEGER,
  metadata JSONB, -- Extracted PDF metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_physiotherapist ON treatment_plans(physiotherapist_id);
CREATE INDEX idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX idx_treatment_plans_dates ON treatment_plans(start_date, end_date);
```

**RLS Policies:**
```sql
-- Patients can view their own treatment plans
CREATE POLICY "Patients can view own treatment plans"
  ON treatment_plans FOR SELECT
  USING (auth.uid() = patient_id);

-- Physiotherapists can view assigned patients' plans
CREATE POLICY "Physiotherapists can view assigned treatment plans"
  ON treatment_plans FOR SELECT
  USING (
    auth.uid() = physiotherapist_id OR
    EXISTS (
      SELECT 1 FROM patient_physiotherapist_assignments
      WHERE patient_id = treatment_plans.patient_id
      AND physiotherapist_id = auth.uid()
    )
  );

-- Patients and assigned physiotherapists can update plans
CREATE POLICY "Authorized users can update treatment plans"
  ON treatment_plans FOR UPDATE
  USING (
    auth.uid() = patient_id OR
    auth.uid() = physiotherapist_id OR
    EXISTS (
      SELECT 1 FROM patient_physiotherapist_assignments
      WHERE patient_id = treatment_plans.patient_id
      AND physiotherapist_id = auth.uid()
    )
  );
```

#### `treatment_plan_sections`
Sections extracted from PDF (for structured mission creation)

```sql
CREATE TABLE treatment_plan_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  section_type TEXT CHECK (section_type IN ('exercise', 'medication', 'therapy', 'checkup', 'other')),
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER,
  frequency TEXT, -- e.g., "daily", "3x per week"
  duration_minutes INTEGER,
  instructions JSONB,
  extracted_data JSONB, -- AI/PDF parsing results
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sections_plan ON treatment_plan_sections(treatment_plan_id);
CREATE INDEX idx_sections_type ON treatment_plan_sections(section_type);
```

### 1.3 Missions & Tasks

#### `missions`
Daily missions derived from treatment plans

```sql
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE SET NULL,
  treatment_plan_section_id UUID REFERENCES treatment_plan_sections(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('exercise', 'medication', 'therapy', 'check', 'other')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  due_datetime TIMESTAMPTZ,
  duration_minutes INTEGER,
  points INTEGER DEFAULT 0, -- Gamification scoring
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'overdue')),
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  completion_evidence JSONB, -- Photos, videos, etc.
  recurrence_pattern JSONB, -- For recurring missions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_missions_patient ON missions(patient_id);
CREATE INDEX idx_missions_scheduled_date ON missions(scheduled_date);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_type ON missions(mission_type);
CREATE INDEX idx_missions_plan ON missions(treatment_plan_id);
CREATE INDEX idx_missions_due_datetime ON missions(due_datetime);
```

**RLS Policies:**
```sql
-- Patients can view their own missions
CREATE POLICY "Patients can view own missions"
  ON missions FOR SELECT
  USING (auth.uid() = patient_id);

-- Physiotherapists can view assigned patients' missions
CREATE POLICY "Physiotherapists can view assigned missions"
  ON missions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patient_physiotherapist_assignments
      WHERE patient_id = missions.patient_id
      AND physiotherapist_id = auth.uid()
    )
  );

-- Patients can update their own missions
CREATE POLICY "Patients can update own missions"
  ON missions FOR UPDATE
  USING (auth.uid() = patient_id);
```

### 1.4 Calendar & Events

#### `calendar_events`
Calendar events synchronized with missions

```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('therapy', 'checkup', 'exercise', 'consultation', 'appointment', 'other')),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  location TEXT,
  therapist_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_all_day BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE format
  external_calendar_id TEXT, -- For Google/Outlook sync
  external_calendar_sync_enabled BOOLEAN DEFAULT false,
  reminder_minutes INTEGER[], -- Array of reminder times in minutes before
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_patient ON calendar_events(patient_id);
CREATE INDEX idx_calendar_events_datetime ON calendar_events(start_datetime, end_datetime);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_events_mission ON calendar_events(mission_id);
```

**RLS Policies:**
```sql
-- Patients can view their own calendar events
CREATE POLICY "Patients can view own calendar events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = patient_id);

-- Physiotherapists can view assigned patients' events
CREATE POLICY "Physiotherapists can view assigned calendar events"
  ON calendar_events FOR SELECT
  USING (
    auth.uid() = therapist_id OR
    EXISTS (
      SELECT 1 FROM patient_physiotherapist_assignments
      WHERE patient_id = calendar_events.patient_id
      AND physiotherapist_id = auth.uid()
    )
  );
```

### 1.5 Progress Tracking

#### `progress_records`
Progress tracking records

```sql
CREATE TABLE progress_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  record_date DATE NOT NULL,
  pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
  mobility_score INTEGER CHECK (mobility_score BETWEEN 0 AND 100),
  notes TEXT,
  measurements JSONB, -- Flexible measurement data
  photos JSONB, -- Array of photo URLs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, record_date)
);

CREATE INDEX idx_progress_patient ON progress_records(patient_id);
CREATE INDEX idx_progress_date ON progress_records(record_date);
CREATE INDEX idx_progress_mission ON progress_records(mission_id);
```

#### `weekly_progress_summary`
Aggregated weekly progress data

```sql
CREATE TABLE weekly_progress_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_missions INTEGER DEFAULT 0,
  completed_missions INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2),
  total_points_earned INTEGER DEFAULT 0,
  average_pain_level DECIMAL(3,1),
  average_mobility_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, week_start_date)
);

CREATE INDEX idx_weekly_progress_patient ON weekly_progress_summary(patient_id);
CREATE INDEX idx_weekly_progress_dates ON weekly_progress_summary(week_start_date, week_end_date);
```

### 1.6 Gamification

#### `badges`
Badge definitions

```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  badge_type TEXT CHECK (badge_type IN ('achievement', 'milestone', 'streak', 'social', 'special')),
  criteria JSONB, -- Conditions to earn badge
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_badges_type ON badges(badge_type);
```

#### `user_badges`
Badges earned by users

```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
```

#### `user_scores`
User point accumulation and leaderboard

```sql
CREATE TABLE user_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  weekly_points INTEGER DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  missions_completed INTEGER DEFAULT 0,
  last_activity_date DATE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_scores_points ON user_scores(total_points DESC);
CREATE INDEX idx_user_scores_streak ON user_scores(current_streak DESC);
```

#### `merchandise`
Reward merchandise catalog

```sql
CREATE TABLE merchandise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  points_cost INTEGER NOT NULL,
  category TEXT,
  stock_quantity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merchandise_points ON merchandise(points_cost);
CREATE INDEX idx_merchandise_active ON merchandise(is_active);
```

#### `merchandise_redemptions`
User merchandise redemption history

```sql
CREATE TABLE merchandise_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchandise_id UUID NOT NULL REFERENCES merchandise(id) ON DELETE RESTRICT,
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address JSONB,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_redemptions_user ON merchandise_redemptions(user_id);
CREATE INDEX idx_redemptions_status ON merchandise_redemptions(status);
```

### 1.7 Social & Community

#### `friendships`
Friend connections

```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CHECK (requester_id != addressee_id),
  UNIQUE(requester_id, addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
```

#### `posts`
Community posts (lobby)

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images JSONB, -- Array of image URLs
  post_type TEXT DEFAULT 'general' CHECK (post_type IN ('general', 'milestone', 'question', 'tip')),
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_pinned ON posts(is_pinned);
```

**RLS Policies:**
```sql
-- All authenticated users can view posts
CREATE POLICY "Authenticated users can view posts"
  ON posts FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create their own posts
CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);
```

#### `post_likes`
Post likes

```sql
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);
```

#### `post_comments`
Post comments

```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON post_comments(post_id);
CREATE INDEX idx_comments_author ON post_comments(author_id);
CREATE INDEX idx_comments_parent ON post_comments(parent_comment_id);
```

### 1.8 Collaborative Sessions

#### `collaboration_rooms`
Room-based collaborative treatment sessions

```sql
CREATE TABLE collaboration_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_type TEXT DEFAULT 'treatment' CHECK (room_type IN ('treatment', 'support', 'social')),
  max_participants INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE SET NULL,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_creator ON collaboration_rooms(creator_id);
CREATE INDEX idx_rooms_active ON collaboration_rooms(is_active);
CREATE INDEX idx_rooms_scheduled ON collaboration_rooms(scheduled_start);
```

#### `room_participants`
Users in collaboration rooms

```sql
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'participant', 'observer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_online BOOLEAN DEFAULT true,
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_participants_room ON room_participants(room_id);
CREATE INDEX idx_participants_user ON room_participants(user_id);
CREATE INDEX idx_participants_online ON room_participants(is_online);
```

#### `room_messages`
Chat messages in collaboration rooms

```sql
CREATE TABLE room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachments JSONB,
  reply_to_message_id UUID REFERENCES room_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_room ON room_messages(room_id, created_at DESC);
CREATE INDEX idx_messages_author ON room_messages(author_id);
```

#### `room_media_sessions`
Voice/video session metadata

```sql
CREATE TABLE room_media_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
  session_type TEXT CHECK (session_type IN ('voice', 'video', 'screen_share')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  recording_url TEXT,
  metadata JSONB
);

CREATE INDEX idx_media_room ON room_media_sessions(room_id);
```

### 1.9 Knowledge Base

#### `knowledge_articles`
Educational articles

```sql
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  category TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  read_time_minutes INTEGER,
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_articles_category ON knowledge_articles(category);
CREATE INDEX idx_articles_published ON knowledge_articles(is_published, published_at DESC);
CREATE INDEX idx_articles_author ON knowledge_articles(author_id);
```

### 1.10 Triggers & Functions

#### Update timestamp trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (apply to other tables)
```

#### Mission completion score update

```sql
CREATE OR REPLACE FUNCTION update_user_score_on_mission_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE user_scores
    SET 
      total_points = total_points + NEW.points,
      weekly_points = weekly_points + NEW.points,
      monthly_points = monthly_points + NEW.points,
      missions_completed = missions_completed + 1,
      last_activity_date = NEW.scheduled_date,
      xp = xp + NEW.points,
      updated_at = NOW()
    WHERE user_id = NEW.patient_id;
    
    -- Update streak
    UPDATE user_scores
    SET 
      current_streak = CASE 
        WHEN last_activity_date = NEW.scheduled_date - INTERVAL '1 day' 
        THEN current_streak + 1
        ELSE 1
      END,
      longest_streak = GREATEST(longest_streak, 
        CASE 
          WHEN last_activity_date = NEW.scheduled_date - INTERVAL '1 day' 
          THEN current_streak + 1
          ELSE 1
        END)
    WHERE user_id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_completion_score_trigger
  AFTER UPDATE ON missions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_score_on_mission_complete();
```

#### Post likes count trigger

```sql
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();
```

---

## 2. JSON Data Templates

### 2.1 Profile JSON

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "patient@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://storage.supabase.co/avatars/john.jpg",
  "role": "patient",
  "phone": "+1234567890",
  "date_of_birth": "1990-05-15",
  "gender": "male",
  "is_online": true,
  "last_seen_at": "2024-11-01T10:30:00Z",
  "created_at": "2024-09-15T08:00:00Z",
  "updated_at": "2024-11-01T10:30:00Z"
}
```

### 2.2 Patient Profile JSON

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "injury_type": "Knee Rehabilitation",
  "diagnosis": "ACL reconstruction post-surgery",
  "treatment_history": {
    "surgery_date": "2024-08-15",
    "surgery_type": "ACL Reconstruction",
    "previous_treatments": ["Physical therapy", "Pain management"]
  },
  "recovery_start_date": "2024-09-15",
  "current_stage": "phase_2_weeks_6_12",
  "goals": {
    "short_term": ["Reduce swelling", "Improve range of motion"],
    "long_term": ["Full knee function", "Return to sports"]
  },
  "preferences": {
    "reminder_enabled": true,
    "notification_time": "08:00",
    "preferred_language": "en"
  }
}
```

### 2.3 Treatment Plan JSON

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "physiotherapist_id": "770e8400-e29b-41d4-a716-446655440002",
  "title": "Post-ACL Reconstruction Recovery Plan",
  "description": "6-week intensive rehabilitation program",
  "pdf_url": "https://storage.supabase.co/treatment-plans/plan-001.pdf",
  "pdf_filename": "ACL_Recovery_Plan_2024.pdf",
  "pdf_size": 2456789,
  "imported_from": "external_hospital_system",
  "status": "active",
  "start_date": "2024-09-15",
  "end_date": "2024-10-27",
  "duration_weeks": 6,
  "metadata": {
    "extracted_date": "2024-09-15T10:00:00Z",
    "total_sections": 15,
    "extraction_confidence": 0.92
  },
  "created_at": "2024-09-15T10:00:00Z",
  "updated_at": "2024-09-15T10:00:00Z"
}
```

### 2.4 Mission JSON

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "treatment_plan_id": "660e8400-e29b-41d4-a716-446655440001",
  "treatment_plan_section_id": "990e8400-e29b-41d4-a716-446655440004",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Morning Knee Stretching",
  "description": "Perform 15-minute knee joint stretching exercises",
  "mission_type": "exercise",
  "scheduled_date": "2024-11-01",
  "scheduled_time": "07:00:00",
  "due_datetime": "2024-11-01T09:00:00Z",
  "duration_minutes": 15,
  "points": 50,
  "status": "completed",
  "completed_at": "2024-11-01T07:15:00Z",
  "completion_notes": "Completed all stretches successfully",
  "completion_evidence": {
    "photos": ["https://storage.supabase.co/evidence/photo1.jpg"],
    "video_url": null
  },
  "recurrence_pattern": {
    "frequency": "daily",
    "days_of_week": [1, 2, 3, 4, 5, 6, 7],
    "end_date": "2024-10-27"
  },
  "created_at": "2024-09-15T10:00:00Z",
  "updated_at": "2024-11-01T07:15:00Z"
}
```

### 2.5 Calendar Event JSON

```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "mission_id": "880e8400-e29b-41d4-a716-446655440003",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Physical Therapy Session",
  "description": "Weekly physical therapy with Dr. Li",
  "event_type": "therapy",
  "start_datetime": "2024-11-01T14:00:00Z",
  "end_datetime": "2024-11-01T15:00:00Z",
  "location": "Rehabilitation Center A, Room 101",
  "therapist_id": "770e8400-e29b-41d4-a716-446655440002",
  "is_all_day": false,
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=FR;COUNT=6",
  "external_calendar_id": "cal-event-12345",
  "external_calendar_sync_enabled": true,
  "reminder_minutes": [1440, 60],
  "created_at": "2024-09-15T10:00:00Z",
  "updated_at": "2024-09-15T10:00:00Z"
}
```

### 2.6 Progress Record JSON

```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440006",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "mission_id": "880e8400-e29b-41d4-a716-446655440003",
  "record_date": "2024-11-01",
  "pain_level": 3,
  "mobility_score": 75,
  "notes": "Significant improvement in range of motion today",
  "measurements": {
    "knee_flexion_degrees": 120,
    "knee_extension_degrees": 0,
    "walking_distance_meters": 500
  },
  "photos": [
    "https://storage.supabase.co/progress/photo1.jpg",
    "https://storage.supabase.co/progress/photo2.jpg"
  ],
  "created_at": "2024-11-01T20:00:00Z",
  "updated_at": "2024-11-01T20:00:00Z"
}
```

### 2.7 Badge JSON

```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440007",
  "name": "Week Warrior",
  "description": "Complete all missions for 7 consecutive days",
  "icon_url": "https://storage.supabase.co/badges/week-warrior.svg",
  "badge_type": "streak",
  "criteria": {
    "type": "streak",
    "days": 7,
    "completion_rate": 100
  },
  "points_reward": 200,
  "created_at": "2024-09-15T10:00:00Z"
}
```

### 2.8 User Score JSON

```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440008",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_points": 3500,
  "weekly_points": 450,
  "monthly_points": 1800,
  "current_streak": 5,
  "longest_streak": 12,
  "missions_completed": 87,
  "last_activity_date": "2024-11-01",
  "level": 5,
  "xp": 3500,
  "updated_at": "2024-11-01T20:00:00Z"
}
```

### 2.9 Post JSON

```json
{
  "id": "ee0e8400-e29b-41d4-a716-446655440009",
  "author_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Completed all my knee rehab exercises today, feeling much better than yesterday! Keep going everyone 💪",
  "images": [
    "https://storage.supabase.co/posts/image1.jpg"
  ],
  "post_type": "milestone",
  "is_pinned": false,
  "likes_count": 12,
  "comments_count": 3,
  "created_at": "2024-11-01T09:30:00Z",
  "updated_at": "2024-11-01T09:30:00Z"
}
```

### 2.10 Collaboration Room JSON

```json
{
  "id": "ff0e8400-e29b-41d4-a716-446655440010",
  "name": "Knee Rehab Support Group - Week 6",
  "description": "Weekly group session for knee rehabilitation patients",
  "creator_id": "770e8400-e29b-41d4-a716-446655440002",
  "room_type": "treatment",
  "max_participants": 8,
  "is_public": true,
  "is_active": true,
  "treatment_plan_id": "660e8400-e29b-41d4-a716-446655440001",
  "scheduled_start": "2024-11-05T14:00:00Z",
  "scheduled_end": "2024-11-05T15:30:00Z",
  "created_at": "2024-10-28T10:00:00Z",
  "updated_at": "2024-10-28T10:00:00Z"
}
```

### 2.11 Room Message JSON

```json
{
  "id": "110e8400-e29b-41d4-a716-446655440011",
  "room_id": "ff0e8400-e29b-41d4-a716-446655440010",
  "author_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Great session today everyone!",
  "message_type": "text",
  "attachments": null,
  "reply_to_message_id": null,
  "created_at": "2024-11-05T14:45:00Z"
}
```

---

## 3. API Endpoint Specifications

### 3.1 Authentication Endpoints

#### `POST /api/auth/register`
Register new user (patient or physiotherapist)

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "secure_password",
  "full_name": "John Doe",
  "role": "patient",
  "additional_data": {
    "injury_type": "Knee Rehabilitation",
    "phone": "+1234567890"
  }
}
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@example.com",
    "role": "patient"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

#### `POST /api/auth/login`
User login

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "secure_password"
}
```

**Response:** Same as register

#### `POST /api/auth/logout`
User logout

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### `POST /api/auth/refresh`
Refresh access token

**Request Body:**
```json
{
  "refresh_token": "..."
}
```

### 3.2 Profile Endpoints

#### `GET /api/profile/me`
Get current user profile

**Response:**
```json
{
  "profile": { /* Profile JSON */ },
  "patient_profile": { /* Patient Profile JSON if role is patient */ },
  "physiotherapist_profile": { /* Physiotherapist Profile JSON if role is physiotherapist */ }
}
```

#### `PUT /api/profile/me`
Update current user profile

**Request Body:**
```json
{
  "full_name": "John Doe Updated",
  "avatar_url": "https://...",
  "phone": "+1234567890"
}
```

#### `GET /api/profile/{user_id}`
Get public profile by ID

**Response:**
```json
{
  "profile": { /* Public Profile JSON */ }
}
```

### 3.3 Dashboard Endpoints

#### `GET /api/dashboard/summary`
Get dashboard summary data

**Response:**
```json
{
  "user": {
    "recovery_day": 48,
    "current_streak": 5,
    "total_points": 3500
  },
  "today_stats": {
    "total_missions": 5,
    "completed_missions": 2,
    "completion_rate": 40
  },
  "recent_friends": [ /* Friend JSON Array */ ],
  "recent_posts": [ /* Post JSON Array */ ],
  "weekly_progress": { /* Weekly Progress Summary JSON */ }
}
```

### 3.4 Treatment Plan Endpoints

#### `POST /api/treatment-plans`
Create/upload treatment plan (with PDF)

**Request Body (multipart/form-data):**
```
file: <PDF File>
title: "Post-ACL Reconstruction Recovery Plan"
description: "6-week intensive rehabilitation program"
start_date: "2024-09-15"
end_date: "2024-10-27"
physiotherapist_id: "770e8400-e29b-41d4-a716-446655440002"
```

**Response:**
```json
{
  "treatment_plan": { /* Treatment Plan JSON */ },
  "sections": [ /* Treatment Plan Section JSON Array */ ]
}
```

#### `GET /api/treatment-plans`
Get user's treatment plans

**Query Parameters:**
- `status`: filter by status (draft, active, completed, archived)
- `page`: page number
- `limit`: items per page

**Response:**
```json
{
  "treatment_plans": [ /* Treatment Plan JSON Array */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "total_pages": 1
  }
}
```

#### `GET /api/treatment-plans/{plan_id}`
Get specific treatment plan

**Response:**
```json
{
  "treatment_plan": { /* Treatment Plan JSON */ },
  "sections": [ /* Treatment Plan Section JSON Array */ ],
  "missions": [ /* Mission JSON Array */ ]
}
```

#### `POST /api/treatment-plans/{plan_id}/import`
Import treatment plan from PDF (extract and create missions)

**Request Body:**
```json
{
  "auto_create_missions": true,
  "mission_points": 50,
  "start_date": "2024-11-01"
}
```

**Response:**
```json
{
  "message": "Treatment plan imported successfully",
  "missions_created": 45,
  "sections_extracted": 15
}
```

#### `DELETE /api/treatment-plans/{plan_id}`
Delete treatment plan

### 3.5 Mission Endpoints

#### `GET /api/missions`
Get user's missions

**Query Parameters:**
- `date`: filter by date (YYYY-MM-DD)
- `status`: filter by status
- `type`: filter by mission_type
- `page`: page number
- `limit`: items per page

**Response:**
```json
{
  "missions": [ /* Mission JSON Array */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

#### `GET /api/missions/today`
Get today's missions

**Response:**
```json
{
  "missions": [ /* Mission JSON Array */ ],
  "stats": {
    "total": 5,
    "completed": 2,
    "pending": 2,
    "overdue": 1
  }
}
```

#### `GET /api/missions/{mission_id}`
Get specific mission

**Response:**
```json
{
  "mission": { /* Mission JSON */ }
}
```

#### `PUT /api/missions/{mission_id}/complete`
Mark mission as completed

**Request Body:**
```json
{
  "completion_notes": "Completed all stretches successfully",
  "evidence": {
    "photos": ["https://storage.supabase.co/evidence/photo1.jpg"]
  }
}
```

**Response:**
```json
{
  "mission": { /* Updated Mission JSON */ },
  "points_earned": 50,
  "level_up": false,
  "badges_earned": [ /* Badge JSON Array */ ]
}
```

#### `PUT /api/missions/{mission_id}`
Update mission (reschedule, edit details)

**Request Body:**
```json
{
  "scheduled_date": "2024-11-02",
  "scheduled_time": "08:00:00"
}
```

#### `DELETE /api/missions/{mission_id}`
Delete mission

### 3.6 Calendar Endpoints

#### `GET /api/calendar/events`
Get calendar events

**Query Parameters:**
- `start_date`: start date (YYYY-MM-DD)
- `end_date`: end date (YYYY-MM-DD)
- `event_type`: filter by type

**Response:**
```json
{
  "events": [ /* Calendar Event JSON Array */ ]
}
```

#### `POST /api/calendar/events`
Create calendar event

**Request Body:**
```json
{
  "mission_id": "880e8400-e29b-41d4-a716-446655440003",
  "title": "Physical Therapy Session",
  "start_datetime": "2024-11-01T14:00:00Z",
  "end_datetime": "2024-11-01T15:00:00Z",
  "location": "Rehabilitation Center A",
  "therapist_id": "770e8400-e29b-41d4-a716-446655440002"
}
```

#### `PUT /api/calendar/events/{event_id}/sync`
Sync event with external calendar (Google/Outlook)

**Request Body:**
```json
{
  "provider": "google",
  "sync_enabled": true
}
```

### 3.7 Progress Endpoints

#### `GET /api/progress`
Get progress records

**Query Parameters:**
- `start_date`: start date
- `end_date`: end date
- `mission_id`: filter by mission

**Response:**
```json
{
  "progress_records": [ /* Progress Record JSON Array */ ],
  "summary": {
    "average_pain_level": 3.2,
    "average_mobility_score": 72.5,
    "total_records": 30
  }
}
```

#### `POST /api/progress`
Create progress record

**Request Body:**
```json
{
  "mission_id": "880e8400-e29b-41d4-a716-446655440003",
  "record_date": "2024-11-01",
  "pain_level": 3,
  "mobility_score": 75,
  "notes": "Significant improvement",
  "measurements": {
    "knee_flexion_degrees": 120
  }
}
```

#### `GET /api/progress/weekly`
Get weekly progress summary

**Query Parameters:**
- `week_start`: week start date (YYYY-MM-DD)

**Response:**
```json
{
  "weekly_summary": { /* Weekly Progress Summary JSON */ },
  "daily_records": [ /* Progress Record JSON Array */ ]
}
```

### 3.8 Gamification Endpoints

#### `GET /api/gamification/scores/me`
Get current user scores

**Response:**
```json
{
  "scores": { /* User Score JSON */ },
  "rank": 15,
  "percentile": 85
}
```

#### `GET /api/gamification/leaderboard`
Get leaderboard

**Query Parameters:**
- `period`: weekly, monthly, all_time
- `limit`: number of entries

**Response:**
```json
{
  "leaderboard": [
    {
      "user": { /* Profile JSON */ },
      "scores": { /* User Score JSON */ },
      "rank": 1
    }
  ],
  "user_rank": 15
}
```

#### `GET /api/gamification/badges`
Get all badges

**Response:**
```json
{
  "badges": [ /* Badge JSON Array */ ]
}
```

#### `GET /api/gamification/badges/me`
Get user's earned badges

**Response:**
```json
{
  "earned_badges": [
    {
      "badge": { /* Badge JSON */ },
      "earned_at": "2024-10-15T10:00:00Z"
    }
  ]
}
```

#### `GET /api/gamification/merchandise`
Get merchandise catalog

**Query Parameters:**
- `category`: filter by category
- `max_points`: filter by max points cost

**Response:**
```json
{
  "merchandise": [ /* Merchandise JSON Array */ ]
}
```

#### `POST /api/gamification/merchandise/{merchandise_id}/redeem`
Redeem merchandise

**Request Body:**
```json
{
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  }
}
```

**Response:**
```json
{
  "redemption": { /* Merchandise Redemption JSON */ },
  "remaining_points": 3000
}
```

### 3.9 Social Endpoints

#### `GET /api/friends`
Get user's friends

**Query Parameters:**
- `status`: pending, accepted
- `search`: search by name

**Response:**
```json
{
  "friends": [
    {
      "friendship": { /* Friendship JSON */ },
      "profile": { /* Profile JSON */ },
      "patient_profile": { /* Patient Profile JSON */ }
    }
  ]
}
```

#### `POST /api/friends/request`
Send friend request

**Request Body:**
```json
{
  "addressee_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### `PUT /api/friends/{friendship_id}/accept`
Accept friend request

#### `PUT /api/friends/{friendship_id}/reject`
Reject friend request

#### `DELETE /api/friends/{friendship_id}`
Remove friendship

#### `GET /api/friends/discover`
Discover potential friends (similar missions, injury types)

**Query Parameters:**
- `injury_type`: filter by injury type
- `limit`: number of suggestions

**Response:**
```json
{
  "suggestions": [
    {
      "profile": { /* Profile JSON */ },
      "match_reasons": ["Same injury type", "Similar recovery stage"]
    }
  ]
}
```

### 3.10 Community (Lobby) Endpoints

#### `GET /api/posts`
Get community posts

**Query Parameters:**
- `page`: page number
- `limit`: items per page
- `post_type`: filter by type
- `author_id`: filter by author

**Response:**
```json
{
  "posts": [
    {
      "post": { /* Post JSON */ },
      "author": { /* Profile JSON */ },
      "liked": false,
      "comments": [ /* Post Comment JSON Array */ ]
    }
  ],
  "pagination": { /* Pagination JSON */ }
}
```

#### `POST /api/posts`
Create post

**Request Body:**
```json
{
  "content": "Great progress today!",
  "images": ["https://storage.supabase.co/posts/image1.jpg"],
  "post_type": "milestone"
}
```

#### `POST /api/posts/{post_id}/like`
Like/unlike post

**Response:**
```json
{
  "liked": true,
  "likes_count": 13
}
```

#### `GET /api/posts/{post_id}/comments`
Get post comments

**Response:**
```json
{
  "comments": [ /* Post Comment JSON Array */ ]
}
```

#### `POST /api/posts/{post_id}/comments`
Add comment

**Request Body:**
```json
{
  "content": "Great work!",
  "parent_comment_id": null
}
```

### 3.11 Collaboration Room Endpoints

#### `GET /api/rooms`
Get collaboration rooms

**Query Parameters:**
- `is_active`: filter active rooms
- `room_type`: filter by type
- `participant_id`: rooms user is in

**Response:**
```json
{
  "rooms": [
    {
      "room": { /* Collaboration Room JSON */ },
      "participants": [ /* Room Participant JSON Array */ ],
      "participant_count": 5
    }
  ]
}
```

#### `POST /api/rooms`
Create collaboration room

**Request Body:**
```json
{
  "name": "Knee Rehab Support Group",
  "description": "Weekly group session",
  "room_type": "treatment",
  "max_participants": 8,
  "is_public": true,
  "treatment_plan_id": "660e8400-e29b-41d4-a716-446655440001",
  "scheduled_start": "2024-11-05T14:00:00Z",
  "scheduled_end": "2024-11-05T15:30:00Z"
}
```

#### `GET /api/rooms/{room_id}`
Get room details

**Response:**
```json
{
  "room": { /* Collaboration Room JSON */ },
  "participants": [ /* Room Participant JSON Array */ ],
  "messages": [ /* Room Message JSON Array */ ],
  "active_media_sessions": [ /* Room Media Session JSON Array */ ]
}
```

#### `POST /api/rooms/{room_id}/join`
Join room

**Response:**
```json
{
  "participant": { /* Room Participant JSON */ },
  "room": { /* Collaboration Room JSON */ }
}
```

#### `POST /api/rooms/{room_id}/leave`
Leave room

#### `GET /api/rooms/{room_id}/messages`
Get room messages

**Query Parameters:**
- `limit`: number of messages
- `before`: get messages before timestamp

**Response:**
```json
{
  "messages": [ /* Room Message JSON Array */ ],
  "has_more": true
}
```

#### `POST /api/rooms/{room_id}/messages`
Send message to room

**Request Body:**
```json
{
  "content": "Hello everyone!",
  "message_type": "text",
  "reply_to_message_id": null
}
```

#### `POST /api/rooms/{room_id}/media/start`
Start voice/video session

**Request Body:**
```json
{
  "session_type": "video"
}
```

**Response:**
```json
{
  "session": { /* Room Media Session JSON */ },
  "webrtc_config": { /* WebRTC configuration */ }
}
```

### 3.12 Knowledge Base Endpoints

#### `GET /api/knowledge/articles`
Get knowledge articles

**Query Parameters:**
- `category`: filter by category
- `search`: search term
- `page`: page number
- `limit`: items per page

**Response:**
```json
{
  "articles": [ /* Knowledge Article JSON Array */ ],
  "pagination": { /* Pagination JSON */ }
}
```

#### `GET /api/knowledge/articles/{article_id}`
Get article details

**Response:**
```json
{
  "article": { /* Knowledge Article JSON */ },
  "author": { /* Profile JSON */ },
  "related_articles": [ /* Knowledge Article JSON Array */ ]
}
```

#### `POST /api/knowledge/articles/{article_id}/view`
Increment view count

---

## 4. Additional Pages Identification

Based on the requirements and existing pages, the following additional pages are needed:

### 4.1 Authentication Pages
- `/auth/login` - User login page
- `/auth/register` - User registration page (patient/physiotherapist selection)
- `/auth/forgot-password` - Password reset

### 4.2 Treatment Plan Pages
- `/dashboard/treatment-plans` - List of treatment plans
- `/dashboard/treatment-plans/new` - Upload/create new treatment plan
- `/dashboard/treatment-plans/{plan_id}` - Treatment plan detail view
- `/dashboard/treatment-plans/{plan_id}/import` - PDF import wizard with preview

### 4.3 Physiotherapist Pages
- `/dashboard/physiotherapist/patients` - List of assigned patients
- `/dashboard/physiotherapist/patients/{patient_id}` - Patient detail view
- `/dashboard/physiotherapist/patients/{patient_id}/progress` - Patient progress dashboard
- `/dashboard/physiotherapist/patients/{patient_id}/plans` - Manage patient treatment plans

### 4.4 Mission Management Pages
- `/dashboard/missions` - All missions view with filters
- `/dashboard/missions/{mission_id}` - Mission detail and completion

### 4.5 Gamification Pages
- `/dashboard/achievements` - Badges and achievements page
- `/dashboard/leaderboard` - Leaderboard view
- `/dashboard/rewards` - Merchandise catalog and redemption history

### 4.6 Collaboration Pages
- `/dashboard/rooms` - List of collaboration rooms
- `/dashboard/rooms/{room_id}` - Room view with chat and media controls
- `/dashboard/rooms/{room_id}/media` - Full-screen media session

### 4.7 Settings Pages
- `/dashboard/settings/profile` - Profile settings
- `/dashboard/settings/notifications` - Notification preferences
- `/dashboard/settings/calendar` - Calendar sync settings
- `/dashboard/settings/privacy` - Privacy settings

### 4.8 Knowledge Base Pages
- `/dashboard/knowledge/articles/{article_id}` - Article detail page

---

## 5. Data Flow Documentation

### 5.1 Treatment Plan Import Flow

1. **PDF Upload** (`POST /api/treatment-plans`)
   - User uploads PDF via multipart/form-data
   - Backend stores PDF in Supabase Storage
   - Returns treatment_plan record with `status: 'draft'`

2. **PDF Processing** (Background job or API call)
   - PDF text extraction (using libraries like PyPDF2, pdfplumber)
   - AI/ML processing to identify sections (exercise, medication, therapy)
   - Extract structured data: dates, frequencies, durations, instructions
   - Create `treatment_plan_sections` records

3. **Import Plan** (`POST /api/treatment-plans/{plan_id}/import`)
   - User reviews extracted sections and confirms import
   - Backend creates `missions` for each section based on:
     - Frequency (daily, weekly, etc.)
     - Start date and duration_weeks
     - Recurrence patterns
   - Calculate due_datetime for each mission
   - Assign points to missions (default or custom)
   - Update treatment_plan status to 'active'

4. **Calendar Synchronization** (Trigger on mission creation)
   - For each mission, create corresponding `calendar_events`
   - If external_calendar_sync_enabled, sync with Google/Outlook Calendar
   - Set reminders based on user preferences

### 5.2 Mission Completion Flow

1. **User Completes Mission** (`PUT /api/missions/{mission_id}/complete`)
   - User marks mission as completed
   - Optional: upload evidence (photos/videos)
   - Optional: add completion notes
   - Backend updates mission status to 'completed'

2. **Score Update** (Database trigger)
   - Trigger `update_user_score_on_mission_complete()` fires
   - Updates `user_scores`:
     - Adds points to total_points, weekly_points, monthly_points
     - Increments missions_completed
     - Updates streak if consecutive day
     - Calculates XP and level

3. **Badge Check** (Background job or trigger)
   - Check badge criteria against user progress
   - If criteria met, create `user_badges` record
   - Return badges_earned in API response

4. **Progress Record** (Optional, can be automatic or manual)
   - Create `progress_records` entry
   - Link to completed mission
   - Update `weekly_progress_summary`

5. **Notification** (WebSocket or push notification)
   - Notify physiotherapist of patient completion
   - Update real-time dashboard stats

### 5.3 Collaborative Session Flow

1. **Room Creation** (`POST /api/rooms`)
   - Physiotherapist or patient creates room
   - Set room type, schedule, max participants
   - Link to treatment_plan if applicable

2. **User Joins** (`POST /api/rooms/{room_id}/join`)
   - Create `room_participants` record
   - Set is_online = true
   - Emit WebSocket event to other participants

3. **Real-time Communication**
   - **Chat Messages**: WebSocket connection
     - User sends message → `POST /api/rooms/{room_id}/messages`
     - Broadcast to all online participants via WebSocket
     - Store in `room_messages` table
   
   - **Voice/Video**: WebRTC setup
     - User requests media session → `POST /api/rooms/{room_id}/media/start`
     - Backend generates WebRTC signaling info
     - Create `room_media_sessions` record
     - Clients establish peer-to-peer connections
     - Optional: Record session → store recording_url

4. **Room Updates** (Real-time)
   - Participant joins/leaves → Update `room_participants`
   - Broadcast status change via WebSocket
   - Update participant counts in UI

5. **Session End**
   - Mark `room_media_sessions.ended_at`
   - Update `room_participants.left_at`
   - If scheduled_end reached, set `is_active = false`

### 5.4 Progress Tracking Flow

1. **Daily Progress Entry**
   - User completes mission → automatic progress record creation
   - Or manual entry: `POST /api/progress`
   - Capture pain_level, mobility_score, measurements, photos

2. **Weekly Aggregation** (Scheduled job, runs weekly)
   - Calculate `weekly_progress_summary`:
     - Count missions (total, completed)
     - Calculate completion_rate
     - Average pain_level and mobility_score
     - Sum points_earned

3. **Visualization**
   - Dashboard fetches: `GET /api/progress/weekly`
   - Chart components display trends
   - Physiotherapist views: `GET /api/physiotherapist/patients/{id}/progress`

### 5.5 Friend Discovery Flow

1. **Discover Suggestions** (`GET /api/friends/discover`)
   - Query patients with:
     - Same injury_type
     - Similar recovery_stage
     - Similar scheduled missions on same dates
   - Calculate match scores
   - Return top matches

2. **Friend Request** (`POST /api/friends/request`)
   - Create `friendships` record with status='pending'
   - Notify addressee (push notification/WebSocket)

3. **Accept/Reject** (`PUT /api/friends/{id}/accept`)
   - Update status to 'accepted'
   - Notify requester
   - Both users can now see each other's public progress

### 5.6 Data Synchronization Flow

1. **Calendar Sync**
   - User enables sync: `PUT /api/calendar/events/{id}/sync`
   - Backend connects to external calendar API (Google/Outlook)
   - Create events in external calendar
   - Store external_calendar_id
   - Periodic sync job updates changes bidirectionally

2. **Real-time Updates** (WebSocket/Server-Sent Events)
   - Dashboard subscribes to user's data streams:
     - Mission status changes
     - New friend requests
     - Room messages
     - Progress updates
   - Backend emits events on data changes
   - Frontend updates UI reactively

---

## Summary

This architecture provides:

✅ **Complete database schema** with proper relationships, indexes, and RLS policies
✅ **JSON templates** for all major data structures
✅ **Comprehensive API specifications** mapped to frontend pages
✅ **Additional pages** needed for full feature support
✅ **Data flow documentation** explaining how system components interact

The architecture supports:
- Dual authentication (patients & physiotherapists)
- PDF treatment plan imports with mission generation
- Calendar synchronization
- Gamification (scoring, badges, merchandise)
- Social features (friends, community posts)
- Collaborative sessions (rooms, chat, media)
- Real-time updates via WebSocket/SSE
- Progress tracking and analytics

All designed for production-ready implementation with Supabase and FastAPI.

