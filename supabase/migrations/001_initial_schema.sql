-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE member_role AS ENUM ('owner', 'member');
CREATE TYPE contribution_type AS ENUM ('personal', 'shared');
CREATE TYPE goal_category AS ENUM ('emergency', 'travel', 'home', 'occasion', 'dream', 'other');
CREATE TYPE reminder_status AS ENUM ('pending', 'completed', 'upcoming');
CREATE TYPE notification_type AS ENUM ('push', 'email');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  display_name TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Savings workspaces (couple's shared space)
CREATE TABLE savings_workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Our Little Fund',
  tagline TEXT DEFAULT 'Little by little, together.',
  invite_code TEXT UNIQUE NOT NULL DEFAULT upper(substring(md5(random()::text) from 1 for 8)),
  target_amount BIGINT DEFAULT 100000, -- in paise (₹1000 = 100000)
  currency TEXT DEFAULT 'INR',
  reminder_1_day SMALLINT DEFAULT 5 CHECK (reminder_1_day BETWEEN 1 AND 7),
  reminder_1_enabled BOOLEAN DEFAULT TRUE,
  reminder_1_time TIME DEFAULT '09:00',
  reminder_1_label TEXT DEFAULT 'First Week Savings Day',
  reminder_1_message TEXT DEFAULT 'New month, new savings! ❤️ It''s time to contribute to our future.',
  reminder_2_last_day BOOLEAN DEFAULT TRUE,
  reminder_2_day SMALLINT CHECK (reminder_2_day BETWEEN 28 AND 31),
  reminder_2_enabled BOOLEAN DEFAULT TRUE,
  reminder_2_time TIME DEFAULT '09:00',
  reminder_2_label TEXT DEFAULT 'Month-End Savings Day',
  reminder_2_message TEXT DEFAULT 'Another month, another step toward our dreams. Let''s save together! 💗',
  reminder_timezone TEXT DEFAULT 'Asia/Kolkata',
  upi_id TEXT,
  qr_code_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members (links profiles to workspaces)
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES savings_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  notification_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  push_subscription JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, profile_id)
);

-- Savings goals
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES savings_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount BIGINT NOT NULL, -- in paise
  current_amount BIGINT DEFAULT 0, -- in paise
  target_date DATE,
  category goal_category DEFAULT 'other',
  cover_image_path TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contributions (savings entries)
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES savings_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL, -- in paise
  type contribution_type DEFAULT 'shared',
  description TEXT,
  payment_reference TEXT,
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder settings (per workspace, tracks completion status per month)
CREATE TABLE reminder_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES savings_workspaces(id) ON DELETE CASCADE,
  reminder_number SMALLINT NOT NULL CHECK (reminder_number IN (1, 2)),
  year SMALLINT NOT NULL,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  scheduled_date DATE NOT NULL,
  status reminder_status DEFAULT 'upcoming',
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  expected_amount BIGINT, -- in paise, optional
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, reminder_number, year, month)
);

-- Notification subscriptions (for Web Push)
CREATE TABLE notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES savings_workspaces(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, endpoint)
);

-- Notification deliveries (audit log)
CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES savings_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_setting_id UUID REFERENCES reminder_settings(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  status TEXT NOT NULL, -- 'sent', 'failed', 'clicked'
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_profile ON workspace_members(profile_id);
CREATE INDEX idx_savings_goals_workspace ON savings_goals(workspace_id);
CREATE INDEX idx_contributions_workspace ON contributions(workspace_id);
CREATE INDEX idx_contributions_profile ON contributions(profile_id);
CREATE INDEX idx_contributions_date ON contributions(contribution_date DESC);
CREATE INDEX idx_contributions_workspace_date ON contributions(workspace_id, contribution_date DESC);
CREATE INDEX idx_reminder_settings_workspace_date ON reminder_settings(workspace_id, year, month);
CREATE INDEX idx_notification_subscriptions_profile ON notification_subscriptions(profile_id);
CREATE INDEX idx_notification_deliveries_workspace ON notification_deliveries(workspace_id);
CREATE INDEX idx_notification_deliveries_reminder ON notification_deliveries(reminder_setting_id);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Workspaces: Members can view their workspace
CREATE POLICY "Members can view workspace" ON savings_workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = savings_workspaces.id
      AND workspace_members.profile_id = auth.uid()
    )
  );

-- Workspaces: Owners can update workspace
CREATE POLICY "Owners can update workspace" ON savings_workspaces
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = savings_workspaces.id
      AND workspace_members.profile_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  );

-- Workspace members: Members can view all members in their workspace
CREATE POLICY "Members can view workspace members" ON workspace_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id
      AND wm2.profile_id = auth.uid()
    )
  );

-- Workspace members: Owners can insert/update/delete members
CREATE POLICY "Owners can manage members" ON workspace_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id
      AND wm2.profile_id = auth.uid()
      AND wm2.role = 'owner'
    )
  );

-- Goals: Members can view goals in their workspace
CREATE POLICY "Members can view goals" ON savings_goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = savings_goals.workspace_id
      AND workspace_members.profile_id = auth.uid()
    )
  );

-- Goals: Members can create goals in their workspace
CREATE POLICY "Members can create goals" ON savings_goals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = savings_goals.workspace_id
      AND workspace_members.profile_id = auth.uid()
    )
  );

-- Goals: Members can update their own goals, owners can update any
CREATE POLICY "Members can update own goals" ON savings_goals
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = savings_goals.workspace_id
      AND workspace_members.profile_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  );

-- Contributions: Members can view contributions in their workspace
CREATE POLICY "Members can view contributions" ON contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = contributions.workspace_id
      AND workspace_members.profile_id = auth.uid()
    )
  );

-- Contributions: Members can create contributions in their workspace
CREATE POLICY "Members can create contributions" ON contributions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = contributions.workspace_id
      AND workspace_members.profile_id = auth.uid()
    )
  );

-- Contributions: Members can update their own contributions, owners can update any
CREATE POLICY "Members can update own contributions" ON contributions
  FOR UPDATE USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = contributions.workspace_id
      AND workspace_members.profile_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  );

-- Contributions: Members can delete their own contributions, owners can delete any
CREATE POLICY "Members can delete own contributions" ON contributions
  FOR DELETE USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = contributions.workspace_id
      AND workspace_members.profile_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  );

-- Reminder settings: Members can view reminder settings
CREATE POLICY "Members can view reminder settings" ON reminder_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = reminder_settings.workspace_id
      AND workspace_members.profile_id = auth.uid()
    )
  );

-- Reminder settings: Owners can manage reminder settings
CREATE POLICY "Owners can manage reminder settings" ON reminder_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = reminder_settings.workspace_id
      AND workspace_members.profile_id = auth.uid()
      AND workspace_members.role = 'owner'
    )
  );

-- Notification subscriptions: Users can manage their own subscriptions
CREATE POLICY "Users can manage own subscriptions" ON notification_subscriptions
  FOR ALL USING (profile_id = auth.uid());

-- Notification deliveries: Members can view deliveries in their workspace
CREATE POLICY "Members can view notification deliveries" ON notification_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = notification_deliveries.workspace_id
      AND workspace_members.profile_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_workspaces_updated_at BEFORE UPDATE ON savings_workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at BEFORE UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON contributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminder_settings_updated_at BEFORE UPDATE ON reminder_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_subscriptions_updated_at BEFORE UPDATE ON notification_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create default workspace for first user
CREATE OR REPLACE FUNCTION public.create_default_workspace()
RETURNS TRIGGER AS $$
DECLARE
  workspace_id UUID;
BEGIN
  -- Check if user already has a workspace
  IF EXISTS (
    SELECT 1 FROM workspace_members WHERE profile_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Create workspace
  INSERT INTO savings_workspaces (name, tagline)
  VALUES ('Our Little Fund', 'Little by little, together.')
  RETURNING id INTO workspace_id;

  -- Add user as owner
  INSERT INTO workspace_members (workspace_id, profile_id, role)
  VALUES (workspace_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_workspace();