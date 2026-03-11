
-- 1. Extend Profiles with Referral Data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id);

-- 2. Referral Tiers Configuration
CREATE TABLE IF NOT EXISTS public.referral_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    level integer NOT NULL UNIQUE,
    name text NOT NULL,
    ltv_threshold numeric NOT NULL,
    bonus_percent numeric NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.referral_tiers (level, name, ltv_threshold, bonus_percent) VALUES
(1, 'Бронза', 0, 10),
(2, 'Серебро', 1000, 15),
(3, 'Золото', 5000, 20)
ON CONFLICT (level) DO UPDATE SET 
    ltv_threshold = EXCLUDED.ltv_threshold,
    bonus_percent = EXCLUDED.bonus_percent;

-- 3. Referrals Tracking Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid NOT NULL REFERENCES public.profiles(id),
    referred_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
    ltv_accumulated numeric DEFAULT 0,
    current_tier_id uuid REFERENCES public.referral_tiers(id),
    total_bonus_earned numeric DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.referral_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tiers" ON public.referral_tiers FOR SELECT USING (true);
CREATE POLICY "Users can view their own referrals" ON public.referrals FOR SELECT USING (referrer_id = auth.uid());
CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 5. Function to calculate and apply referral bonus
CREATE OR REPLACE FUNCTION public.apply_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id uuid;
    v_bonus_percent numeric;
    v_bonus_amount numeric;
    v_tier_id uuid;
BEGIN
    -- Only process completed orders
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Get referrer
        SELECT referred_by INTO v_referrer_id FROM public.profiles WHERE id = NEW.user_id;
        
        IF v_referrer_id IS NOT NULL THEN
            -- Update or insert referral record
            INSERT INTO public.referrals (referrer_id, referred_id, ltv_accumulated)
            VALUES (v_referrer_id, NEW.user_id, NEW.price)
            ON CONFLICT (referred_id) DO UPDATE SET 
                ltv_accumulated = referrals.ltv_accumulated + EXCLUDED.ltv_accumulated,
                updated_at = now();

            -- Determine tier and bonus
            SELECT id, bonus_percent INTO v_tier_id, v_bonus_percent
            FROM public.referral_tiers
            WHERE ltv_threshold <= (SELECT ltv_accumulated FROM public.referrals WHERE referred_id = NEW.user_id)
            ORDER BY ltv_threshold DESC
            LIMIT 1;

            v_bonus_amount := (NEW.price * v_bonus_percent) / 100;

            -- Update referral stats
            UPDATE public.referrals 
            SET current_tier_id = v_tier_id,
                total_bonus_earned = total_bonus_earned + v_bonus_amount
            WHERE referred_id = NEW.user_id;

            -- Credit referrer balance
            -- Note: We use the existing credit_balance function
            PERFORM public.credit_balance(v_referrer_id, v_bonus_amount, 'referral_bonus', jsonb_build_object('order_id', NEW.id, 'referred_user', NEW.user_id));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger for referral bonus
DROP TRIGGER IF EXISTS on_order_completed_referral ON public.orders;
CREATE TRIGGER on_order_completed_referral
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.apply_referral_bonus();
