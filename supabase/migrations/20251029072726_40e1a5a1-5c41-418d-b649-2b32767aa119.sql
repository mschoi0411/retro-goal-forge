-- Add last_main_change column to pets table
ALTER TABLE public.pets 
ADD COLUMN last_main_change timestamp with time zone;