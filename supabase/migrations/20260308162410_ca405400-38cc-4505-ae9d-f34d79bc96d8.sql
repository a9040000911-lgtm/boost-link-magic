
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS warning_text text DEFAULT NULL;

COMMENT ON COLUMN public.services.warning_text IS 'Текст предупреждения/требований, показывается модальным окном перед оформлением заказа';
