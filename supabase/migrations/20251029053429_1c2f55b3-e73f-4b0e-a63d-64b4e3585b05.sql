-- Update RLS policies to allow all authenticated users to view chat rooms and join

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Participants can view members in their rooms" ON public.chat_participants;

-- Allow all authenticated users to view chat rooms
CREATE POLICY "Authenticated users can view all chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow all authenticated users to view participants in any room
CREATE POLICY "Authenticated users can view all participants"
  ON public.chat_participants FOR SELECT
  USING (auth.uid() IS NOT NULL);