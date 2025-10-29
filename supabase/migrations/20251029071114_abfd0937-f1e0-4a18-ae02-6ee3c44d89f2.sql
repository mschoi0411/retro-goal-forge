-- Create table for storing Google OAuth tokens
CREATE TABLE public.google_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tokens"
ON public.google_tokens
FOR SELECT
USING ((auth.uid())::text = (user_id)::text);

CREATE POLICY "Users can insert their own tokens"
ON public.google_tokens
FOR INSERT
WITH CHECK ((auth.uid())::text = (user_id)::text);

CREATE POLICY "Users can update their own tokens"
ON public.google_tokens
FOR UPDATE
USING ((auth.uid())::text = (user_id)::text);

CREATE POLICY "Users can delete their own tokens"
ON public.google_tokens
FOR DELETE
USING ((auth.uid())::text = (user_id)::text);

-- Add trigger for updated_at
CREATE TRIGGER update_google_tokens_updated_at
BEFORE UPDATE ON public.google_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();