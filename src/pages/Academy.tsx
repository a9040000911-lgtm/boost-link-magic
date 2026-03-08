import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, GraduationCap, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PlatformIcon from "@/components/PlatformIcon";

interface Section {
  id: string;
  title: string;
  icon: string;
  color: string;
  intro: string;
  topics: { title: string; content: string }[];
}

const sections: Section[] = [
  {
    id: "basics",
    title: "Основы продвижения",
    icon: "globe",
    color: "text-primary",
    intro: "Фундаментальные принципы, которые работают в любой соцсети.",
    topics: [
      {
        title: "Что такое социальное доказательство",
        content: "Люди склонны доверять тому, что уже популярно. Аккаунт с 10 000 подписчиков вызывает больше доверия, чем с 50. Это психологический принцип — социальное доказательство (social proof). Именно поэтому стартовая накрутка помогает: новый аккаунт с базой подписчиков привлекает органическую аудиторию быстрее."
      },
      {
        title: "Комплексный подход к продвижению",
        content: "Самая частая ошибка — накрутить только подписчиков. Алгоритмы отслеживают соотношение подписчиков к вовлечённости. 10 000 подписчиков с 5 лайками на посте — красный флаг.\n\nПравильная стратегия:\n1. Подписчики — создают базу\n2. Лайки на каждый пост — 5-15% от подписчиков\n3. Просмотры сторис/видео — 10-30% от подписчиков\n4. Комментарии — 0.5-2% от подписчиков\n5. Сохранения — самый мощный сигнал для алгоритма"
      },
      {
        title: "Органический рост vs накрутка",
        content: "Накрутка — это стартовый толчок, а не замена качественного контента. Идеальная стратегия: начальная накрутка для создания «подушки» → качественный контент → органический рост благодаря алгоритмам.\n\nЗолотое правило: накрученные показатели должны составлять не более 30-50% от общей аудитории. Остальное — органика."
      },
      {
        title: "Как работают алгоритмы рекомендаций",
        content: "Все соцсети используют алгоритмы для определения, какой контент показать пользователям. Общие факторы:\n\n• Вовлечённость первых минут — лайки, комментарии, сохранения сразу после публикации\n• Время просмотра — сколько секунд пользователь смотрит контент\n• Дочитываемость — прочитал ли пользователь пост до конца\n• Взаимодействие — репосты, сохранения, ответы\n• Релевантность — соответствие интересам пользователя"
      },
      {
        title: "Рейтинг и ранжирование",
        content: "Каждый пост получает внутренний «рейтинг» от алгоритма. Чем выше рейтинг, тем больше людей его увидят. Факторы рейтинга:\n\n1. Скорость набора реакций (первые 30 мин критичны)\n2. Тип взаимодействий (сохранения > репосты > комментарии > лайки)\n3. Время удержания (для видео)\n4. История аккаунта (регулярность публикаций)\n5. Тематическая кластеризация (алгоритм понимает нишу)"
      }
    ]
  },
  {
    id: "instagram",
    title: "Instagram",
    icon: "instagram",
    color: "text-pink-500",
    intro: "Крупнейшая визуальная соцсеть с 2+ млрд пользователей. Алгоритм отдаёт приоритет Reels и сохранениям.",
    topics: [
      {
        title: "Алгоритм Instagram в 2025-2026",
        content: "Instagram использует несколько алгоритмов одновременно — для ленты, Reels, Stories и Explore.\n\n• Лента: приоритет контента от аккаунтов, с которыми пользователь взаимодействует. Лайки, комментарии, сохранения — ключевые сигналы.\n• Reels: время просмотра и досматриваемость — главный фактор. Если зритель досмотрел до конца и пересмотрел — это мощный сигнал.\n• Stories: приоритет аккаунтов по частоте взаимодействий. Ответы, реакции, пролистывания.\n• Explore: контент, похожий на то, что пользователь лайкал и сохранял."
      },
      {
        title: "Что продвигать в Instagram",
        content: "Приоритеты для накрутки:\n\n1. Подписчики — база. Начните с 1000-5000.\n2. Лайки на Reels — алгоритм продвигает видео с высоким ER.\n3. Просмотры Reels — удерживающие просмотры ценнее обычных.\n4. Просмотры Stories — показывают алгоритму, что аудитория активна.\n5. Сохранения — самый сильный сигнал. 50 сохранений могут дать больше, чем 500 лайков.\n6. Комментарии — повышают ER и время на посте."
      },
      {
        title: "Оптимальное соотношение метрик",
        content: "Для аккаунта с 10 000 подписчиков нормальные показатели:\n• Лайки на пост: 500-1500 (5-15%)\n• Комментарии: 20-100 (0.2-1%)\n• Просмотры Reels: 3000-15000 (30-150%)\n• Просмотры Stories: 1000-3000 (10-30%)\n• Сохранения: 50-200 (0.5-2%)\n\nЕсли ваши метрики значительно ниже — алгоритм может снизить охват."
      },
      {
        title: "Требования к аккаунту",
        content: "Перед накруткой убедитесь:\n• Аккаунт открытый (не приватный)\n• Есть минимум 6-9 постов\n• Аватарка установлена\n• Био заполнено\n• Аккаунту не менее 2 недель\n• Нет ограничений и банов"
      }
    ]
  },
  {
    id: "youtube",
    title: "YouTube",
    icon: "youtube",
    color: "text-red-500",
    intro: "Крупнейшая видеоплатформа. Алгоритм максимально ценит время просмотра (watch time).",
    topics: [
      {
        title: "Алгоритм YouTube",
        content: "YouTube — это поисковая система + рекомендательная система. Два пути попасть к зрителям:\n\n1. Поиск — SEO оптимизация: заголовок, описание, теги, хештеги\n2. Рекомендации — алгоритм анализирует:\n   • CTR (кликабельность превью) — цель >5%\n   • Удержание аудитории — цель >50% от длины видео\n   • Время сессии — если после вашего видео зритель продолжает смотреть YouTube, это плюс\n   • Взаимодействия — лайки, комментарии, подписки после просмотра"
      },
      {
        title: "Стратегия продвижения YouTube",
        content: "1. Подписчики — нужны для монетизации (1000 минимум) и социального доказательства\n2. Просмотры — удерживающие просмотры ценнее. Алгоритм видит, если зрители закрывают видео через 5 секунд\n3. Лайки — влияют на рекомендации, но меньше, чем удержание\n4. Комментарии — увеличивают время на странице видео\n5. Часы просмотра — для монетизации нужно 4000 часов за 12 месяцев\n\nВажно: YouTube имеет самую строгую систему обнаружения ботов. Используйте качественные услуги."
      },
      {
        title: "YouTube Shorts",
        content: "Shorts — вертикальные видео до 60 секунд. Отдельный алгоритм:\n• Досматриваемость — ключевой фактор\n• Повторные просмотры — если зритель смотрит Shorts повторно, это сильный сигнал\n• Лайки и подписки — влияют, но меньше, чем досматриваемость\n• Шеры — мощный сигнал\n\nShorts хороши для быстрого набора подписчиков, но не дают часов просмотра для монетизации."
      }
    ]
  },
  {
    id: "tiktok",
    title: "TikTok",
    icon: "tiktok",
    color: "text-foreground",
    intro: "Самая быстрорастущая соцсеть. Уникальный алгоритм, который может вирусить контент с нуля.",
    topics: [
      {
        title: "Как работает алгоритм TikTok",
        content: "TikTok использует систему «волн» показа:\n\n1 волна: видео показывается 200-500 людям\n2 волна: если CTR и досматриваемость высокие → 1000-5000 показов\n3 волна: 10 000-100 000 показов\n4+ волна: вирусный контент — миллионы\n\nКлючевые метрики:\n• Досматриваемость (>70% — хорошо, >100% — отлично)\n• Повторные просмотры\n• Шеры и сохранения\n• Время на комментариях\n• Подписки после просмотра"
      },
      {
        title: "Продвижение в TikTok",
        content: "TikTok отличается от других платформ — даже аккаунт с 0 подписчиков может набрать миллион просмотров, если видео качественное.\n\nКогда нужна накрутка:\n• Стартовый разгон — первые 1000 подписчиков для доверия\n• Буст конкретных видео — лайки и просмотры в первый час после публикации\n• Просмотры live-трансляций — увеличивают видимость\n\nОсобенность: TikTok очень чувствителен к ботам. Используйте только качественные услуги с постепенной скоростью."
      }
    ]
  },
  {
    id: "telegram",
    title: "Telegram",
    icon: "telegram",
    color: "text-sky-500",
    intro: "Мессенджер и площадка для каналов. Нет алгоритма рекомендаций — контент видят все подписчики.",
    topics: [
      {
        title: "Особенности Telegram",
        content: "Telegram — уникальная платформа:\n• Нет алгоритма — все подписчики видят все посты\n• Подписчики не отписываются «автоматически» — дроп минимальный\n• Нет лайков/комментариев в классическом виде (есть реакции)\n• Важнее количество подписчиков, чем вовлечённость\n\nТелеграм-каналы оцениваются по:\n• Числу подписчиков\n• ERR (Engagement Rate Reach) — процент просмотров к подписчикам\n• Индексу цитирования — сколько раз репостили"
      },
      {
        title: "Что продвигать",
        content: "1. Подписчики — основная метрика для рекламодателей. Каналы с 1000+ подписчиков могут начать продавать рекламу\n2. Просмотры постов — показывают рекламодателям реальный охват\n3. Реакции — появились недавно, повышают вовлечённость\n4. Участники группы — для групповых чатов и сообществ\n\nТелеграм — самая «безопасная» платформа для накрутки. Риски бана минимальны."
      }
    ]
  },
  {
    id: "vk",
    title: "ВКонтакте",
    icon: "vk",
    color: "text-blue-500",
    intro: "Крупнейшая русскоязычная соцсеть. Мощные рекомендации в ленте «Рекомендации» и VK Клипы.",
    topics: [
      {
        title: "Алгоритм ВКонтакте",
        content: "ВК использует систему ранжирования контента:\n\n• Умная лента — показывает контент на основе интересов пользователя\n• Рекомендации — отдельная вкладка с контентом от незнакомых авторов\n• VK Клипы — аналог TikTok с отдельным алгоритмом\n\nФакторы ранжирования:\n1. Лайки и репосты в первый час\n2. Комментарии и их длина\n3. Время на посте (дочитали ли до конца)\n4. Подписки из контента\n5. Негативные сигналы (скрыл, пожаловался)"
      },
      {
        title: "Продвижение групп и страниц",
        content: "ВК имеет строгую модерацию:\n• Группа должна быть открытой\n• Минимум 3-5 постов перед накруткой\n• Обложка и аватарка обязательны\n\nЧто продвигать:\n1. Участники группы — база для рекламодателей\n2. Лайки — поднимают пост в рекомендации\n3. Репосты — самый мощный сигнал для ВК\n4. VK Клипы — просмотры и лайки\n5. Комментарии — повышают вовлечённость\n\nВажно: ВК отслеживает массовую подписку ботов. Используйте постепенную накрутку."
      }
    ]
  },
  {
    id: "twitter",
    title: "Twitter / X",
    icon: "twitter",
    color: "text-foreground",
    intro: "Микроблоги и новостная платформа. Алгоритм ценит ретвиты и цитирования.",
    topics: [
      {
        title: "Алгоритм X (Twitter)",
        content: "Twitter/X использует два режима ленты:\n• Для вас — алгоритмическая лента (рекомендации)\n• Подписки — хронологическая лента\n\nДля попадания в «Для вас»:\n1. Лайки от подписчиков в первые минуты\n2. Ретвиты и цитирования\n3. Ответы и треды\n4. Время чтения (для длинных постов)\n5. Клики по ссылкам/изображениям"
      },
      {
        title: "Стратегия продвижения",
        content: "1. Подписчики — для доверия и верификации\n2. Лайки — быстрый буст видимости\n3. Ретвиты — распространяют контент среди новой аудитории\n4. Просмотры — показывают охват\n5. Закладки — скрытый, но мощный сигнал\n\nX Premium (синяя галочка) увеличивает видимость постов. Комбинируйте с накруткой для максимального эффекта."
      }
    ]
  },
  {
    id: "facebook",
    title: "Facebook",
    icon: "facebook",
    color: "text-blue-600",
    intro: "Самая большая соцсеть в мире. Сложный алгоритм, учитывающий тысячи факторов.",
    topics: [
      {
        title: "Алгоритм Facebook",
        content: "Facebook оценивает каждый пост по 4 этапам:\n1. Инвентарь — какой контент доступен\n2. Сигналы — кто опубликовал, тип контента, время публикации\n3. Предсказания — вероятность взаимодействия\n4. Релевантность — итоговый скоринг\n\nПриоритет контента: видео > фото > текст > ссылки. Группы получают приоритет над страницами."
      },
      {
        title: "Продвижение в Facebook",
        content: "1. Лайки страницы — база\n2. Вовлечённость постов — лайки, комментарии, шеры\n3. Просмотры видео — Facebook активно продвигает видеоконтент\n4. Участники групп — группы получают приоритет в ленте\n5. Реакции (love, wow, haha) — сильнее обычных лайков\n\nОсобенность: Facebook хорошо определяет ботов. Рекомендуется постепенная накрутка с живыми аккаунтами."
      }
    ]
  },
  {
    id: "twitch",
    title: "Twitch",
    icon: "twitch",
    color: "text-purple-500",
    intro: "Платформа для стриминга. Зрители онлайн — главная метрика.",
    topics: [
      {
        title: "Продвижение на Twitch",
        content: "Twitch отличается от других платформ — здесь важен live-контент.\n\nКлючевые метрики:\n• Среднее число зрителей онлайн — определяет позицию в каталоге\n• Подписчики канала — база лояльной аудитории\n• Фолловеры — общее число подписчиков\n• Чаттеры — активность в чате\n\nДля партнёрской программы нужно: 75 средних зрителей, 25 часов стримов/мес, 12 уникальных дней стримов/мес.\n\nНакрутка зрителей помогает подняться в каталоге категории, что привлекает реальных зрителей."
      }
    ]
  },
  {
    id: "spotify",
    title: "Spotify",
    icon: "spotify",
    color: "text-green-500",
    intro: "Музыкальный стриминг. Прослушивания и подписчики артиста.",
    topics: [
      {
        title: "Продвижение на Spotify",
        content: "Spotify использует алгоритмические плейлисты:\n• Discover Weekly — персональный плейлист\n• Release Radar — новые треки от подписок\n• Daily Mix — миксы на основе предпочтений\n\nФакторы попадания в плейлисты:\n1. Количество прослушиваний первых дней\n2. Save rate — процент добавлений в библиотеку\n3. Completion rate — дослушивают ли трек до конца\n4. Skip rate — как часто пропускают\n5. Плейлистирование — добавления в пользовательские плейлисты\n\nЧто продвигать:\n• Прослушивания — основная метрика\n• Подписчики артиста — база для Release Radar\n• Добавления в плейлисты — сильный сигнал алгоритму"
      }
    ]
  }
];

const Academy = () => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ basics: true });
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTopic = (key: string) => {
    setExpandedTopics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> На главную
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Академия CoolLike</h1>
              <p className="text-sm text-muted-foreground">Полный гид по продвижению в социальных сетях</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table of contents */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-2">
        <div className="flex flex-wrap gap-2">
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border/50 bg-card hover:bg-muted transition-colors ${s.color}`}
            >
              <PlatformIcon platform={s.icon} className="w-3.5 h-3.5" />
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {sections.map((section) => (
          <motion.div
            key={section.id}
            id={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/50 bg-card overflow-hidden"
          >
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center ${section.color}`}>
                <PlatformIcon platform={section.icon} className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-foreground">{section.title}</h2>
                <p className="text-xs text-muted-foreground line-clamp-1">{section.intro}</p>
              </div>
              <span className="text-muted-foreground shrink-0">
                {expanded[section.id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </span>
            </button>

            <AnimatePresence>
              {expanded[section.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{section.intro}</p>
                    {section.topics.map((topic) => {
                      const key = `${section.id}-${topic.title}`;
                      const isOpen = expandedTopics[key];
                      return (
                        <div key={key} className="rounded-xl border border-border/30 overflow-hidden">
                          <button
                            onClick={() => toggleTopic(key)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition-colors"
                          >
                            <span className="font-medium text-sm text-foreground">{topic.title}</span>
                            <span className="text-muted-foreground shrink-0 ml-2">
                              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </span>
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4">
                                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {topic.content}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* CTA */}
        <div className="text-center pt-8 pb-4">
          <p className="text-sm text-muted-foreground mb-3">Узнали всё, что нужно? Время действовать!</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Перейти в каталог
            </Link>
            <Link
              to="/glossary"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors"
            >
              Глоссарий терминов
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Academy;
