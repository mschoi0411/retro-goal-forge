-- Add category and deadline to chat_rooms
ALTER TABLE public.chat_rooms 
ADD COLUMN category text,
ADD COLUMN deadline date;

-- Create posts table for feed
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for posts
CREATE POLICY "Anyone can view posts"
ON public.posts
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own posts"
ON public.posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.posts
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for posts updated_at
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);

-- Storage policies for post images
CREATE POLICY "Anyone can view post images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own post images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own post images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);