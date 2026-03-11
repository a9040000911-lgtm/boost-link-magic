
-- Table for category-specific requirements and guidance
CREATE TABLE public.category_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, category)
);

-- RLS
ALTER TABLE public.category_guidelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view guidelines"
  ON public.category_guidelines FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage guidelines"
  ON public.category_guidelines FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed guidelines based on PrimeLike.ru research
INSERT INTO public.category_guidelines (platform, category, content) VALUES
('instagram', 'Подписчики', '### ⚠️ Важно для Instagram
1. **Отключите "Пометить для проверки"**: Настройки -> Приглашайте друзей и подписывайтесь -> Отключите "Пометить для проверки" (Flag for review).
2. **Профиль должен быть открытым**: Убедитесь, что ваш аккаунт не приватный.
3. **Не меняйте никнейм**: Во время выполнения заказа ссылка не должна меняться.'),
('vk', 'Подписчики', '### ⚠️ Важно для ВК
1. **Группы и паблики**: Услуга предназначена только для сообществ (не для личных профилей).
2. **Открытый список**: Список участников сообщества должен быть открыт для всех.
3. **Контент**: На стене сообщества должно быть как минимум 5 записей.'),
('youtube', 'Подписчики', '### ⚠️ Важно для YouTube
1. **Канал должен быть открытым**: Проверьте, что количество подписчиков не скрыто настройками приватности.
2. **Минимум контента**: На канале должно быть не менее 3 видео, загруженных более 2 дней назад.
3. **Формат ссылки**: Используйте прямую ссылку на канал.'),
('telegram', 'Подписчики', '### ⚠️ Важно для Telegram
1. **Публичность**: Канал или группа должны быть публичными (с @юзернеймом).
2. **Приватные каналы**: Если канал приватный, используйте соответствующие услуги с инвайт-ссылками.
3. **Тишина в эфире**: Не запускайте одновременно несколько накруток на одну и ту же ссылку.');
