-- Update profiles RLS policy to allow all authenticated users to view display names

-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Allow all authenticated users to view all profiles (for displaying usernames in chat)
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);