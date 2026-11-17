-- Storage buckets for private files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('qr-codes', 'qr-codes', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', FALSE, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('goal-covers', 'goal-covers', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for qr-codes bucket (private, workspace members only)
CREATE POLICY "Workspace members can view QR codes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'qr-codes' AND
    EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN savings_workspaces sw ON sw.id = wm.workspace_id
      WHERE wm.profile_id = auth.uid()
      AND sw.qr_code_path = storage.objects.name
    )
  );

CREATE POLICY "Workspace owners can upload QR codes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'qr-codes' AND
    EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN savings_workspaces sw ON sw.id = wm.workspace_id
      WHERE wm.profile_id = auth.uid()
      AND wm.role = 'owner'
    )
  );

CREATE POLICY "Workspace owners can update QR codes" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'qr-codes' AND
    EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN savings_workspaces sw ON sw.id = wm.workspace_id
      WHERE wm.profile_id = auth.uid()
      AND wm.role = 'owner'
    )
  );

CREATE POLICY "Workspace owners can delete QR codes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'qr-codes' AND
    EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN savings_workspaces sw ON sw.id = wm.workspace_id
      WHERE wm.profile_id = auth.uid()
      AND wm.role = 'owner'
    )
  );

-- Storage policies for avatars bucket (private, own avatar or workspace members)
CREATE POLICY "Users can view own avatar" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.profile_id = auth.uid()
      AND wm2.profile_id::text = (storage.foldername(name))[1]
    ))
  );

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for goal-covers bucket (private, workspace members)
CREATE POLICY "Workspace members can view goal covers" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'goal-covers' AND
    EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN savings_goals sg ON sg.workspace_id = wm.workspace_id
      WHERE wm.profile_id = auth.uid()
      AND sg.cover_image_path = storage.objects.name
    )
  );

CREATE POLICY "Workspace members can upload goal covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'goal-covers' AND
    EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN savings_goals sg ON sg.workspace_id = wm.workspace_id
      WHERE wm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update goal covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'goal-covers' AND
    EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN savings_goals sg ON sg.workspace_id = wm.workspace_id
      WHERE wm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can delete goal covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'goal-covers' AND
    EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN savings_goals sg ON sg.workspace_id = wm.workspace_id
      WHERE wm.profile_id = auth.uid()
    )
  );