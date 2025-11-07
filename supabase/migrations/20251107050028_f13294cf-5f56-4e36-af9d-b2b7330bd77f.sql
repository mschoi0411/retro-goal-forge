-- 펫 클릭 추적 테이블 생성
CREATE TABLE public.pet_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  clicked_by_user_id UUID NOT NULL,
  click_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pet_id, clicked_by_user_id, click_date)
);

-- 펫 클릭 RLS 정책
ALTER TABLE public.pet_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pet clicks"
ON public.pet_clicks
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can click pets"
ON public.pet_clicks
FOR INSERT
WITH CHECK (auth.uid() = clicked_by_user_id);

-- 좋아요 경험치 추적 테이블 생성
CREATE TABLE public.post_like_exp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  exp_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exp_gained INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, exp_date)
);

-- 좋아요 경험치 RLS 정책
ALTER TABLE public.post_like_exp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exp"
ON public.post_like_exp
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exp"
ON public.post_like_exp
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exp"
ON public.post_like_exp
FOR UPDATE
USING (auth.uid() = user_id);

-- 인덱스 추가
CREATE INDEX idx_pet_clicks_pet_id ON public.pet_clicks(pet_id);
CREATE INDEX idx_pet_clicks_date ON public.pet_clicks(click_date);
CREATE INDEX idx_post_like_exp_user_date ON public.post_like_exp(user_id, exp_date);
CREATE INDEX idx_post_like_exp_post_date ON public.post_like_exp(post_id, exp_date);