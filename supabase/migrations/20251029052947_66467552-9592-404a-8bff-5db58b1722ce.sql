-- Fix security issues for chat tables

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Anyone can view participants" ON public.chat_participants;

-- Create secure policies for chat_rooms
CREATE POLICY "Authenticated users can view their chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.room_id = chat_rooms.id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- Create secure policies for chat_participants
CREATE POLICY "Participants can view members in their rooms"
  ON public.chat_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants AS cp
      WHERE cp.room_id = chat_participants.room_id
      AND cp.user_id = auth.uid()
    )
  );