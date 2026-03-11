import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server, Package, ShoppingCart, Users, Settings, Tag, Link2, Shield,
  FolderOpen, MessageSquare, FileText, HelpCircle, Puzzle, Receipt, BarChart3,
  ChevronRight, BookOpen, Target, Sword, Trophy, Crown, Gift, Zap, Key, Plug, Activity,
  Globe, Info, Percent, Eraser, Rocket, Lightbulb, AlertTriangle, Monitor,
  ShoppingCart as OrdersIcon, Wallet, Headphones, Users2, Layout
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
  category?: "core" | "marketing" | "technical" | "content";
}

const H1 = ({ children }: { children: React.ReactNode }) => (
  <h1 className="text-3xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
    {children}
  </h1>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2 text-foreground border-b pb-2 border-border/40">
    {children}
  </h2>
);

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base font-medium mt-6 mb-2 text-foreground/90 flex items-center gap-2">
    {children}
  </h3>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
    {children}
  </p>
);

const Tip = ({ children }: { children: React.ReactNode }) => (
  <Alert className="my-6 bg-primary/5 border-primary/20 shadow-sm transition-all hover:bg-primary/10">
    <Lightbulb className="h-4 w-4 text-primary" />
    <AlertTitle className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
      Профессиональный совет
    </AlertTitle>
    <AlertDescription className="text-sm text-muted-foreground mt-1">
      {children}
    </AlertDescription>
  </Alert>
);

const Warning = ({ children }: { children: React.ReactNode }) => (
  <Alert variant="destructive" className="my-6 bg-destructive/5 border-destructive/20 text-destructive shadow-sm">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle className="text-xs font-bold uppercase tracking-wider">Критически важно</AlertTitle>
    <AlertDescription className="text-sm mt-1">{children}</AlertDescription>
  </Alert>
);

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <div className="flex gap-4 mb-4 group items-start">
    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
      {n}
    </div>
    <div className="text-sm text-muted-foreground pt-1 leading-relaxed group-hover:text-foreground transition-colors">
      {children}
    </div>
  </div>
);

const DocImage = ({ src, alt, caption }: { src: string; alt: string; caption?: string }) => (
  <div className="my-8 space-y-3">
    <div className="overflow-hidden rounded-2xl border border-border/50 shadow-2xl transition-all hover:shadow-primary/5 hover:border-primary/20 bg-muted/20">
      <AspectRatio ratio={16 / 9}>
        <img
          src={src}
          alt={alt}
          className="object-cover w-full h-full transition-transform hover:scale-[1.02] duration-700"
        />
      </AspectRatio>
    </div>
    {caption && (
      <p className="text-[10px] text-center text-muted-foreground/60 italic uppercase tracking-[0.2em] font-medium py-1">
        — {caption} —
      </p>
    )}
  </div>
);

const Path = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-muted text-xs px-2 py-0.5 rounded-md font-mono border border-border/50 text-foreground/80">
    {children}
  </code>
);

const sections: Section[] = [
  {
    id: "getting_started",
    title: "Быстрый старт",
    icon: Rocket,
    category: "core",
    content: (
      <>
        <Badge variant="outline" className="mb-4 text-primary bg-primary/5 border-primary/20">Onboarding Manual v2.0</Badge>
        <H1>Добро пожаловать в администрирование</H1>
        <DocImage
          src="file:///C:/Users/Артём/.gemini/antigravity/brain/b64f4912-b289-4b15-a1eb-715d5d08d72e/admin_dashboard_hero_1773046692211.png"
          alt="Dashboard Overview"
          caption="Центральный пульт управления платформой"
        />
        <P>
          Рады видеть вас в команде управления Smmplan! Эта панель — мощный инструмент, позволяющий контролировать каждый аспект бизнеса: от маппинга услуг до глубокой финансовой аналитики. Мы подготовили этот гайд, чтобы ваш старт был максимально легким.
        </P>

        <H2><Monitor className="h-5 w-5 text-primary" /> Первые 3 шага для новичка</H2>

        <H3>1. Проверьте связь с провайдерами</H3>
        <Step n={1}>Перейдите в раздел <strong>Провайдеры</strong>.</Step>
        <Step n={2}>Нажмите кнопку <strong>«Health Check»</strong> у каждого провайдера. Если статус стал зелёным — система готова к работе. Если красный — проверьте API-ключи в секретах.</Step>

        <H3>2. Запустите маркетинговые инструменты</H3>
        <Step n={1}>Откройте раздел <strong>Маркетинг</strong>.</Step>
        <Step n={2}>Настройте призы со скидками в <strong>Колесе Фортуны</strong> и активируйте кампанию <strong>«300 Спартанцев»</strong> для создания ажиотажа у новых пользователей.</Step>

        <H3>3. Познакомьтесь с AI-ассистентом</H3>
        <Step n={1}>Зайдите в раздел <strong>API & AI</strong>.</Step>
        <Step n={2}>Изучите документацию по <strong>MCP</strong>. Вы можете подключить ИИ (например, Antigravity) для выполнения рутинных задач: анализа продаж, ответов на тикеты или настройки новых категорий.</Step>

        <Tip>
          Самый быстрый способ создать услугу — найти её во вкладке <strong>Провайдеры</strong> (в разделе Услуги) и нажать кнопку <strong>→ Каталог</strong>. Система сама настроит маппинг и рассчитает цену с маржой.
        </Tip>
      </>
    ),
  },
  {
    id: "overview",
    title: "Общий обзор",
    icon: Info,
    category: "core",
    content: (
      <>
        <H2><Info className="h-5 w-5 text-primary" /> Архитектура управления</H2>
        <P>
          Наша панель управления построена по модульному принципу. Все разделы в левом меню сгруппированы для удобства навигации.
        </P>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
            <h4 className="font-bold text-sm mb-2 text-foreground">Живые Операции</h4>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">• Мониторинг заказов в реальном времени</li>
              <li className="flex items-center gap-2">• Управление транзакциями и балансами</li>
              <li className="flex items-center gap-2">• Система тикетов поддержки</li>
            </ul>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Globe className="h-5 w-5 text-emerald-500" />
            </div>
            <h4 className="font-bold text-sm mb-2 text-foreground">Бренд и Контент</h4>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">• Быстрая правка текстов главной страницы</li>
              <li className="flex items-center gap-2">• Управление FAQ и SEO-метаданными</li>
              <li className="flex items-center gap-2">• Конфигурация публичных виджетов</li>
            </ul>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Target className="h-5 w-5 text-amber-500" />
            </div>
            <h4 className="font-bold text-sm mb-2 text-foreground">Инструменты Роста</h4>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">• Настройка уровней лояльности (VIP/Platinum)</li>
              <li className="flex items-center gap-2">• Система геймификации и ачивок</li>
              <li className="flex items-center gap-2">• Облачная реферальная система</li>
            </ul>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <h4 className="font-bold text-sm mb-2 text-foreground">Ядро и API</h4>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">• Подключение внешних SMM-провайдеров</li>
              <li className="flex items-center gap-2">• Умный маппинг и синхронизация услуг</li>
              <li className="flex items-center gap-2">• Управление Telegram-ботами</li>
            </ul>
          </motion.div>
        </div>
      </>
    ),
  },
  {
    id: "services",
    title: "Услуги и маппинг",
    icon: Package,
    category: "core",
    content: (
      <>
        <H2><Package className="h-5 w-5 text-primary" /> Управление каталогом услуг</H2>
        <P>
          Каталог услуг — это то, что видит ваш клиент. Каждая услуга в каталоге должна быть привязана к одной или нескольким услугам внешних провайдеров.
        </P>

        <DocImage
          src="file:///C:/Users/Артём/.gemini/antigravity/brain/b64f4912-b289-4b15-a1eb-715d5d08d72e/admin_services_table_1773046726899.png"
          alt="Services Table"
          caption="Интуитивный интерфейс управления услугами"
        />

        <H3>Синхронизация и маппинг</H3>
        <Step n={1}>Перейдите в <Path>Услуги</Path> → Вкладка <strong>Провайдеры</strong>.</Step>
        <Step n={2}>Нажмите <strong>«Синхронизация»</strong>. Система загрузит свежие цены и список услуг от всех подключенных API.</Step>
        <Step n={3}>Выберите нужную услугу и нажмите <strong>«→ Каталог»</strong>. Она появится в вашем публичном списке с автоматически рассчитанной наценкой.</Step>

        <Warning>
          Если вы меняете валюту провайдера или настройки наценки в Глобальных настройках, рекомендуется заново запустить синхронизацию для актуализации цен.
        </Warning>

        <H3>Failover (Отказоустойчивость)</H3>
        <P>
          Вы можете привязать к одной услуге в каталоге сразу 2-3 провайдера. Если первый провайдер вернет ошибку или у него кончатся средства, система мгновенно переключит выполнение заказа на следующего в списке (по приоритету).
        </P>
        <Tip>
          Используйте кнопку <Activity className="h-3 w-3 inline text-primary" /> «Health Check» в разделе Провайдеров, чтобы знать, кто сейчас доступен.
        </Tip>
      </>
    ),
  },
  {
    id: "marketing",
    title: "Маркетинг",
    icon: Target,
    category: "marketing",
    content: (
      <>
        <H2><Target className="h-5 w-5 text-primary" /> Инструменты удержания</H2>
        <DocImage
          src="file:///C:/Users/Артём/.gemini/antigravity/brain/b64f4912-b289-4b15-a1eb-715d5d08d72e/admin_marketing_features_1773046711983.png"
          alt="Marketing Features"
          caption="Экосистема геймификации и виральности"
        />
        <P>Маркетинговый блок разделен на инструменты мгновенного (Колесо Фортуны, 300 Спартанцев) и долгосрочного (Лояльность, Ачивки) влияния на продажи.</P>

        <H3><Crown className="h-4 w-4 inline mr-2 text-amber-500" /> Программа лояльности</H3>
        <P>Настройте уровни доступа (например, Bronze, Silver, Gold). Система сама отслеживает оборот пользователя за последние 30 дней и применяет соответствующий % скидки.</P>

        <H3><Gift className="h-4 w-4 inline mr-2 text-rose-500" /> Колесо Фортуны</H3>
        <P>Инструмент для возврата пользователей. Настройте сегменты: бонусы на баланс, секретные скидки или ачивки. Помните: сумма вероятностей всех сегментов должна быть ровно 100%.</P>

        <H3><Sword className="h-4 w-4 inline mr-2 text-orange-600" /> 300 Спартанцев</H3>
        <P>Кампания с ограниченными местами. Создает FOMO (синдром упущенной выгоды). Первые пользователи, выполнившие условия, получают эксклюзивную плашку и пожизненную скидку.</P>

        <Tip>
          Комбинируйте Ачивки с Колесом Фортуны. За «выбитую» редкую ачивку можно давать дополнительный прокрут колеса.
        </Tip>
      </>
    ),
  },
  {
    id: "analytics",
    title: "Аналитика",
    icon: BarChart3,
    category: "core",
    content: (
      <>
        <H2><BarChart3 className="h-5 w-5 text-primary" /> Финансовое здоровье</H2>
        <P>В этом разделе вы видите не просто цифры, а реальную маржинальность бизнеса.</P>
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50 shadow-sm">
            <h4 className="font-bold text-sm mb-2">P&L (Прибыли и Убытки)</h4>
            <P>Автоматический отчет, который учитывает выручку (платежи пользователей) и себестоимость (платы провайдерам). Вы видите чистую прибыль в реальном времени.</P>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50 shadow-sm">
            <h4 className="font-bold text-sm mb-2">Воронка продаж</h4>
            <P>Отслеживайте путь клиента: Посетил → Зарегистрировался → Пополнил → Заказал. Это поможет понять, на каком этапе «отваливаются» пользователи.</P>
          </div>
        </div>
        <Warning>
          Для корректного расчета P&L не забывайте добавлять бизнес-расходы (аренда сервера, зарплаты) в блок «Управление расходами».
        </Warning>
      </>
    ),
  },
  {
    id: "api_ai",
    title: "API & AI (MCP)",
    icon: Plug,
    category: "technical",
    content: (
      <>
        <H2><Plug className="h-5 w-5 text-primary" /> Интеллектуальный мост (MCP)</H2>
        <P>
          Мы внедрили поддержку <strong>Model Context Protocol</strong> — стандарта для безопасной интеграции ИИ в бизнес-процессы.
        </P>
        <H3>Как подключить Antigravity или другого агента?</H3>
        <Step n={1}>Перейдите в настройки хостинга и настройте секрет <code>MCP_ADMIN_KEY</code>.</Step>
        <Step n={2}>Скопируйте URL эндпоинта из этого раздела.</Step>
        <Step n={3}>Добавьте плагин в ваш AI-клиент (Claude Desktop, Cursor). Теперь вы можете спросить ИИ: <em>«Какой провайдер самый выгодный для Лайков Инстаграм?»</em> или <em>«Сделай полный аудит цен на этой неделе»</em>.</Step>

        <Tip>
          Все действия, совершенные через MCP, помечаются в журнале аудита отдельной меткой, чтобы вы всегда знали, какое решение принял ИИ.
        </Tip>
      </>
    ),
  },
  {
    id: "site_content",
    title: "Контент сайта",
    icon: Globe,
    category: "content",
    content: (
      <>
        <H2><Globe className="h-5 w-5 text-primary" /> Визуальный редактор</H2>
        <P>Управляйте внешним видом лендинга без программирования.</P>
        <H3>Основные блоки для редактирования:</H3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <li className="p-3 bg-muted/20 border border-border/50 rounded-lg text-xs flex items-center gap-2">
            <Zap className="h-3 w-3 text-amber-500" /> Hero-секция (Заголовки)
          </li>
          <li className="p-3 bg-muted/20 border border-border/50 rounded-lg text-xs flex items-center gap-2">
            <Activity className="h-3 w-3 text-primary" /> Живая статистика (Счетчики)
          </li>
          <li className="p-3 bg-muted/20 border border-border/50 rounded-lg text-xs flex items-center gap-2">
            <Users2 className="h-3 w-3 text-blue-500" /> Блок преимуществ
          </li>
          <li className="p-3 bg-muted/20 border border-border/50 rounded-lg text-xs flex items-center gap-2">
            <Link2 className="h-3 w-3 text-emerald-500" /> Футер и Соцсети
          </li>
        </ul>
        <P>Все изменения применяются мгновенно после нажатия кнопки «Сохранить».</P>
      </>
    ),
  },
  {
    id: "staff",
    title: "Безопасность",
    icon: Shield,
    category: "technical",
    content: (
      <>
        <H2><Shield className="h-5 w-5 text-primary" /> Контроль и аудит</H2>
        <P>Безопасность — наш приоритет. Каждое действие в админ-панели оставляет след в нестираемом журнале.</P>
        <H3>Журнал аудита</H3>
        <P>В разделе <strong>Сотрудники</strong> вы можете видеть историю всех изменений. Кто изменил цену услуги? Кто выдал бонус пользователю? Все ответы здесь.</P>

        <H3>Двухфакторная проверка</H3>
        <P>Для критических ролей (Админ, CEO) включена обязательная 2FA проверка. Код приходит в Telegram или на Email.</P>

        <Tip>
          Если вы подозреваете несанкционированный доступ, вы можете мгновенно деактивировать аккаунт любого модератора из списка сотрудников.
        </Tip>
      </>
    ),
  }
];

export default function AdminDocs() {
  const [activeSection, setActiveSection] = useState("getting_started");

  return (
    <div className="flex h-full bg-card/50 rounded-3xl border border-border/40 overflow-hidden shadow-2xl backdrop-blur-sm relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary/[0.02] pointer-events-none" />

      {/* Sidebar navigation */}
      <div className="w-72 border-r border-border/30 bg-muted/10 flex flex-col p-6 gap-2 relative z-10">
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform hover:rotate-3">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-foreground">База знаний</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">Version 2.0.1</p>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-3 px-3">
          <div className="space-y-6">
            <div>
              <p className="px-3 mb-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="h-px flex-1 bg-border/40" /> Ядро
              </p>
              <div className="space-y-1">
                {sections.filter(s => s.category === "core").map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${activeSection === section.id
                          ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                        }`}
                    >
                      <Icon className={`h-4 w-4 ${activeSection === section.id ? "text-primary-foreground" : "text-primary/60"}`} />
                      {section.title}
                      {activeSection === section.id && (
                        <motion.div layoutId="active-pill" className="ml-auto">
                          <ChevronRight className="h-3 w-3 opacity-70" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="px-3 mb-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="h-px flex-1 bg-border/40" /> Бизнес
              </p>
              <div className="space-y-1">
                {sections.filter(s => s.category === "marketing" || s.category === "content").map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${activeSection === section.id
                          ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                        }`}
                    >
                      <Icon className={`h-4 w-4 ${activeSection === section.id ? "text-primary-foreground" : "text-primary/60"}`} />
                      {section.title}
                      {activeSection === section.id && (
                        <motion.div layoutId="active-pill" className="ml-auto">
                          <ChevronRight className="h-3 w-3 opacity-70" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="px-3 mb-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="h-px flex-1 bg-border/40" /> Системное
              </p>
              <div className="space-y-1">
                {sections.filter(s => s.category === "technical").map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${activeSection === section.id
                          ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                        }`}
                    >
                      <Icon className={`h-4 w-4 ${activeSection === section.id ? "text-primary-foreground" : "text-primary/60"}`} />
                      {section.title}
                      {activeSection === section.id && (
                        <motion.div layoutId="active-pill" className="ml-auto">
                          <ChevronRight className="h-3 w-3 opacity-70" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="pt-4 border-t border-border/30 px-3">
          <div className="bg-muted/30 rounded-2xl p-4 border border-border/20">
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-1">Stack Status</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-medium text-foreground/70">Engine Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-sky-500/5 rounded-full blur-[80px] pointer-events-none" />

        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto p-10 lg:p-20 overflow-visible">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative z-10"
              >
                {sections.find((s) => s.id === activeSection)?.content}

                <div className="mt-40 pb-10 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground/30 text-[9px] uppercase tracking-[0.3em] font-mono">
                  <div className="flex items-center gap-6">
                    <span>SMMPlan Internal Knowledge Base</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>2026 Edition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layout className="h-3 w-3" />
                    <span>Design by Antigravity AI</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
