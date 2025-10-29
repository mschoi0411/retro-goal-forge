-- Add schedule columns to goals table
ALTER TABLE public.goals 
ADD COLUMN schedule_type text DEFAULT 'none' CHECK (schedule_type IN ('none', 'daily', 'specific_days', 'final_day_only')),
ADD COLUMN schedule_days integer[] DEFAULT NULL,
ADD COLUMN daily_powder_reward integer DEFAULT 50,
ADD COLUMN total_days integer DEFAULT 0,
ADD COLUMN completed_days integer DEFAULT 0;

-- Create daily_tasks table for tracking daily progress
CREATE TABLE public.daily_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  task_date date NOT NULL,
  completed boolean DEFAULT false,
  failed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(goal_id, task_date)
);

-- Enable RLS
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_tasks
CREATE POLICY "Users can view their own daily tasks"
ON public.daily_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily tasks"
ON public.daily_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily tasks"
ON public.daily_tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily tasks"
ON public.daily_tasks FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for daily_tasks updated_at
CREATE TRIGGER update_daily_tasks_updated_at
BEFORE UPDATE ON public.daily_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();