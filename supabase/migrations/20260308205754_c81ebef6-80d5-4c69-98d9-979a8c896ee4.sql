
-- Loyalty tiers (cumulative monthly spend → discount)
CREATE TABLE public.loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  min_spend numeric NOT NULL DEFAULT 0,
  discount_percent numeric NOT NULL DEFAULT 0,
  icon text DEFAULT '⭐',
  color text DEFAULT '#FFD700',
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage loyalty tiers" ON public.loyalty_tiers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view enabled loyalty tiers" ON public.loyalty_tiers FOR SELECT
  USING (is_enabled = true);

-- Achievements
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '🏆',
  badge_color text DEFAULT '#8B5CF6',
  condition_type text NOT NULL DEFAULT 'orders_count',
  condition_value numeric NOT NULL DEFAULT 1,
  reward_type text NOT NULL DEFAULT 'balance',
  reward_value numeric NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view enabled achievements" ON public.achievements FOR SELECT
  USING (is_enabled = true);

-- User achievements
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  reward_claimed boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user achievements" ON public.user_achievements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fortune wheel prizes
CREATE TABLE public.fortune_wheel_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT '',
  prize_type text NOT NULL DEFAULT 'discount_percent',
  prize_value numeric NOT NULL DEFAULT 0,
  probability numeric NOT NULL DEFAULT 10,
  color text DEFAULT '#3B82F6',
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fortune_wheel_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage wheel prizes" ON public.fortune_wheel_prizes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view enabled prizes" ON public.fortune_wheel_prizes FOR SELECT
  USING (is_enabled = true);

-- User spins log
CREATE TABLE public.user_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prize_id uuid REFERENCES public.fortune_wheel_prizes(id) ON DELETE SET NULL,
  prize_label text NOT NULL DEFAULT '',
  prize_value numeric NOT NULL DEFAULT 0,
  spun_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spins" ON public.user_spins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spins" ON public.user_spins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all spins" ON public.user_spins FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Referral system
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  uses_count integer NOT NULL DEFAULT 0,
  total_earned numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code" ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage referral codes" ON public.referral_codes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own referral code" ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.referral_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  referrer_bonus numeric NOT NULL DEFAULT 0,
  referred_bonus numeric NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referral_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referral_completions FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage referral completions" ON public.referral_completions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 300 Spartans program (first N users get lifetime discount)
CREATE TABLE public.spartan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  slot_number integer NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 20,
  joined_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.spartan_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spartan status" ON public.spartan_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view spartan count" ON public.spartan_members FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage spartans" ON public.spartan_members FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can join spartans" ON public.spartan_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
