import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Server, Package, ShoppingCart, Users, Settings, Tag, Link2, Shield,
  FolderOpen, MessageSquare, FileText, HelpCircle, Puzzle, Receipt, BarChart3,
  ChevronRight, BookOpen
} from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">{children}</h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">{children}</h3>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground leading-relaxed mb-2">{children}</p>
);
const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <div className="flex gap-3 mb-3">
    <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{n}</span>
    <div className="text-sm text-muted-foreground leading-relaxed flex-1">{children}</div>
  </div>
);
const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-sm text-primary my-3">
    💡 {children}
  </div>
);
const Warn = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3 text-sm text-destructive my-3">
    ⚠️ {children}
  </div>
);
const Path = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-muted text-xs px-1.5 py-0.5 rounded font-mono">{children}</code>
);

const sections: Section[] = [
  {
    id: "overview",
    title: "Обзор панели",
    icon: BarChart3,
    content: (
      <>
        <H2><BarChart3 className="h-5 w-5" /> Обзор админ-панели</H2>
        <P>
          Админ-панель — единый центр управления SMM-платформой. Здесь вы управляете провайдерами, услугами, пользователями, заказами, финансами и контентом сайта.
        </P>
        <H3>Структура навигации</H3>
        <P>Левая боковая панель содержит все разделы. Она сворачивается по кнопке ☰ в шапке. Разделы:</P>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-3">
          <li><strong>Дашборд</strong> — сводка по метрикам: заказы, выручка, пользователи, тикеты</li>
          <li><strong>Заказы</strong> — все заказы системы с фильтрацией и возвратами</li>
          <li><strong>Транзакции</strong> — движение средств (пополнения, списания, возвраты)</li>
          <li><strong>Пользователи</strong> — управление аккаунтами, балансами, блокировками</li>
          <li><strong>Услуги</strong> — каталог и маппинг на провайдеров</li>
          <li><strong>Категории</strong> — группировка услуг</li>
          <li><strong>Провайдеры</strong> — внешние API-поставщики услуг</li>
          <li><strong>Промокоды</strong> — скидки и акции</li>
          <li><strong>Страницы и SEO</strong> — статические страницы сайта</li>
          <li><strong>FAQ</strong> — часто задаваемые вопросы</li>
          <li><strong>Виджеты</strong> — визуальные элементы на сайте</li>
          <li><strong>Ссылки</strong> — управление платформами и распознаванием ссылок</li>
          <li><strong>Поддержка</strong> — тикеты пользователей</li>
          <li><strong>Сотрудники</strong> — роли, права, журнал аудита</li>
          <li><strong>Настройки</strong> — глобальные параметры системы</li>
        </ul>
      </>
    ),
  },
  {
    id: "providers",
    title: "Провайдеры",
    icon: Server,
    content: (
      <>
        <H2><Server className="h-5 w-5" /> Управление провайдерами</H2>
        <P>
          Провайдеры — внешние API-сервисы, которые выполняют заказы (лайки, подписчики, просмотры). Система поддерживает неограниченное количество провайдеров с мультивалютностью.
        </P>

        <H3>Добавление нового провайдера</H3>
        <Step n={1}>Перейдите в <Path>Провайдеры</Path> → нажмите <strong>«Добавить провайдер»</strong></Step>
        <Step n={2}>Заполните поля:
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><strong>Ключ</strong> — уникальный идентификатор (например, <code>vexboost</code>, <code>smmpanel</code>)</li>
            <li><strong>Название</strong> — отображаемое имя провайдера</li>
            <li><strong>API URL</strong> — базовый URL API (например, <code>https://vexboost.com/api/v2</code>)</li>
            <li><strong>Env-ключ</strong> — имя переменной окружения с API-ключом (например, <code>VEXBOOST_API_KEY</code>)</li>
            <li><strong>Валюта баланса</strong> — в какой валюте отображается баланс провайдера</li>
            <li><strong>Валюта тарифов</strong> — в какой валюте приходят цены за 1000 единиц</li>
          </ul>
        </Step>
        <Step n={3}>Нажмите <strong>«Добавить»</strong></Step>
        <Step n={4}>Добавьте API-ключ в секреты (Настройки → Секреты) под именем, указанным в Env-ключ</Step>
        <Step n={5}>Нажмите <strong>«Health Check»</strong> для проверки подключения. Зелёный статус = всё ОК</Step>

        <Warn>
          Без добавления секрета с API-ключом провайдер не сможет синхронизировать услуги и обрабатывать заказы.
        </Warn>

        <H3>Health Check</H3>
        <P>
          Кнопка проверяет доступность API, замеряет задержку (latency) и обновляет баланс аккаунта у провайдера. 
          Доступна проверка всех провайдеров одной кнопкой «Health Check All».
        </P>

        <H3>Курсы валют</H3>
        <P>
          Внизу страницы отображаются текущие курсы валют. Кнопка «Обновить курсы» загружает свежие данные с ЦБ РФ. 
          Курсы используются для конвертации цен провайдеров в рубли.
        </P>

        <Tip>При добавлении провайдера с ценами в USD, убедитесь что курс USD→RUB актуален.</Tip>
      </>
    ),
  },
  {
    id: "services",
    title: "Услуги и маппинг",
    icon: Package,
    content: (
      <>
        <H2><Package className="h-5 w-5" /> Управление услугами</H2>
        <P>
          Раздел «Услуги» состоит из двух вкладок: <strong>Каталог</strong> (ваши услуги для клиентов) и <strong>Провайдеры</strong> (услуги из API провайдеров).
        </P>

        <H3>Синхронизация услуг провайдера</H3>
        <Step n={1}>Перейдите в <Path>Услуги</Path></Step>
        <Step n={2}>Нажмите <strong>«Синхронизация»</strong> — система загрузит все услуги из API каждого активного провайдера</Step>
        <Step n={3}>Новые услуги появятся на вкладке <strong>«Провайдеры»</strong></Step>
        <P>Синхронизация обновляет существующие услуги (цены, лимиты) и добавляет новые. Она не удаляет старые.</P>

        <H3>Создание услуги в каталог</H3>
        <P>Есть два способа:</P>

        <P><strong>Способ 1: Из провайдерской услуги (рекомендуемый)</strong></P>
        <Step n={1}>Перейдите на вкладку <strong>«Провайдеры»</strong></Step>
        <Step n={2}>Найдите нужную услугу с помощью фильтров (сеть, категория, провайдер)</Step>
        <Step n={3}>Нажмите <strong>«→ Каталог»</strong> рядом с услугой</Step>
        <Step n={4}>Система автоматически создаст услугу в каталоге с наценкой и привяжет к провайдеру</Step>

        <P><strong>Способ 2: Вручную</strong></P>
        <Step n={1}>На вкладке «Каталог» нажмите <strong>«+ Создать»</strong></Step>
        <Step n={2}>Заполните: название, описание, категория, соц.сеть, мин/макс количество, цена за 1000</Step>
        <Step n={3}>После создания откройте услугу и добавьте маппинг на провайдера (см. ниже)</Step>

        <H3>Маппинг (привязка к провайдеру)</H3>
        <P>
          Маппинг определяет, какой провайдер выполняет заказ. Одна услуга может иметь несколько провайдеров (failover chain).
        </P>
        <Step n={1}>Кликните по услуге в каталоге → откроется диалог редактирования</Step>
        <Step n={2}>В секции <strong>«Failover-цепочка»</strong> нажмите <strong>«Добавить провайдера»</strong></Step>
        <Step n={3}>Выберите провайдерскую услугу из списка</Step>
        <Step n={4}>Укажите приоритет (1 = основной, 2 = резервный, и т.д.)</Step>
        <Step n={5}>Нажмите <strong>«Привязать»</strong></Step>

        <Tip>
          Если основной провайдер откажет, система автоматически попробует следующего по приоритету. 
          Используйте кнопки ↑↓ для изменения приоритета.
        </Tip>

        <H3>Редактирование услуги</H3>
        <P>В диалоге редактирования вы можете:</P>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-3">
          <li>Изменить <strong>название и описание</strong> — это то, что видят клиенты</li>
          <li>Сменить <strong>категорию и соцсеть</strong></li>
          <li>Настроить <strong>мин/макс количество</strong> и <strong>цену за 1000</strong></li>
          <li>Включить/выключить услугу через <strong>переключатель</strong></li>
          <li>Управлять failover-цепочкой</li>
          <li><strong>Удалить</strong> услугу (в «Опасной зоне» внизу)</li>
        </ul>

        <Warn>
          Удаление услуги удалит все привязки к провайдерам. Существующие заказы не затрагиваются.
        </Warn>

        <H3>Включение/выключение услуги</H3>
        <P>
          Переключатель в таблице каталога мгновенно скрывает или показывает услугу клиентам. 
          Выключенная услуга не отображается в публичном каталоге, но сохраняется в базе.
        </P>

        <H3>Написание описания</H3>
        <P>Описание видно клиенту при выборе услуги. Рекомендации:</P>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-3">
          <li>Укажите скорость выполнения (например, «1000-5000 в сутки»)</li>
          <li>Опишите качество (реальные/боты, гарантия)</li>
          <li>Укажите ограничения (приватный аккаунт, минимальное кол-во постов)</li>
          <li>Используйте краткий формат — 2-3 предложения</li>
        </ul>
      </>
    ),
  },
  {
    id: "categories",
    title: "Категории",
    icon: FolderOpen,
    content: (
      <>
        <H2><FolderOpen className="h-5 w-5" /> Управление категориями</H2>
        <P>
          Категории группируют услуги в каталоге (например, «Лайки», «Подписчики», «Просмотры»).
        </P>

        <H3>Создание категории</H3>
        <Step n={1}>Перейдите в <Path>Категории</Path></Step>
        <Step n={2}>Введите название новой категории в поле вверху</Step>
        <Step n={3}>Slug (URL-адрес) сгенерируется автоматически</Step>
        <Step n={4}>Нажмите <strong>«Добавить»</strong></Step>

        <H3>Перенос услуг между категориями</H3>
        <Step n={1}>Нажмите <strong>«Перенос услуг»</strong> или иконку 🔄 рядом с категорией</Step>
        <Step n={2}>Выберите исходную и целевую категории</Step>
        <Step n={3}>Отметьте нужные услуги (или «Выбрать все»)</Step>
        <Step n={4}>Нажмите <strong>«Перенести»</strong></Step>

        <H3>Порядок отображения</H3>
        <P>
          Кнопки ↑↓ меняют порядок категорий в каталоге. Поле sort_order можно также редактировать напрямую.
        </P>
      </>
    ),
  },
  {
    id: "orders",
    title: "Заказы",
    icon: ShoppingCart,
    content: (
      <>
        <H2><ShoppingCart className="h-5 w-5" /> Управление заказами</H2>
        <P>
          В разделе «Заказы» отображаются все заказы системы с полной информацией: пользователь, услуга, количество, сумма, статус, провайдер.
        </P>

        <H3>Статусы заказов</H3>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-3">
          <li><strong>Ожидает (pending)</strong> — заказ создан, ожидает отправки на провайдера</li>
          <li><strong>В обработке (processing)</strong> — отправлен на провайдера</li>
          <li><strong>Выполняется (in_progress)</strong> — провайдер обрабатывает</li>
          <li><strong>Выполнен (completed)</strong> — успешно завершён</li>
          <li><strong>Частично (partial)</strong> — выполнен не полностью</li>
          <li><strong>Отменен (canceled)</strong> — отменён</li>
          <li><strong>Возврат (refunded)</strong> — средства возвращены</li>
        </ul>

        <H3>Возврат средств (Refund)</H3>
        <Step n={1}>Найдите заказ в таблице</Step>
        <Step n={2}>Нажмите кнопку <strong>«Возврат»</strong> (↩️)</Step>
        <Step n={3}>Введите причину возврата</Step>
        <Step n={4}>Подтвердите — средства автоматически вернутся на баланс пользователя</Step>

        <Warn>
          Возврат возможен в течение 30 дней с момента создания заказа (ограничение для модераторов, админы могут всегда). 
          Двойной возврат невозможен — система блокирует повторные попытки.
        </Warn>

        <H3>Поиск и фильтры</H3>
        <P>
          Поиск работает по ID заказа, ID провайдерского заказа, email пользователя, ссылке и названию услуги. 
          Фильтры по статусу доступны через выпадающее меню.
        </P>
      </>
    ),
  },
  {
    id: "transactions",
    title: "Транзакции",
    icon: Receipt,
    content: (
      <>
        <H2><Receipt className="h-5 w-5" /> Транзакции</H2>
        <P>
          Раздел показывает все финансовые операции: пополнения, покупки, возвраты, ручные корректировки баланса.
        </P>
        <H3>Фильтрация</H3>
        <P>Доступны фильтры по типу (пополнение, покупка, возврат), статусу и периоду. Итоговые суммы пересчитываются по выбранным фильтрам.</P>
        <H3>Поиск</H3>
        <P>Поиск по UUID транзакции, ID заказа провайдера, email пользователя и описанию.</P>
      </>
    ),
  },
  {
    id: "users",
    title: "Пользователи",
    icon: Users,
    content: (
      <>
        <H2><Users className="h-5 w-5" /> Управление пользователями</H2>
        <P>
          Раздел содержит список всех зарегистрированных пользователей с информацией о балансе, заказах и статусе.
        </P>

        <H3>Профиль пользователя</H3>
        <Step n={1}>Перейдите в <Path>Пользователи</Path></Step>
        <Step n={2}>Нажмите на строку пользователя или кнопку <strong>«Подробнее»</strong></Step>
        <Step n={3}>Откроется страница с полным профилем</Step>

        <H3>Пополнение / списание баланса</H3>
        <Step n={1}>На странице пользователя найдите блок <strong>«Баланс»</strong></Step>
        <Step n={2}>Введите сумму в поле</Step>
        <Step n={3}>Нажмите <strong>«+»</strong> для зачисления или <strong>«−»</strong> для списания</Step>
        <Step n={4}>Операция мгновенно обновляет баланс и создаёт транзакцию в истории</Step>

        <Tip>
          Все изменения баланса логируются в журнале аудита с указанием кто, когда и сколько изменил.
        </Tip>

        <H3>Смена пароля пользователя</H3>
        <Step n={1}>На странице пользователя введите новый пароль в поле <strong>«Новый пароль»</strong></Step>
        <Step n={2}>Нажмите <strong>«Сохранить»</strong> — пароль будет обновлён немедленно</Step>

        <Warn>Минимальная длина пароля — 6 символов. Пользователь не получит уведомление о смене пароля.</Warn>

        <H3>Смена email</H3>
        <Step n={1}>Измените email в поле <strong>«Email»</strong></Step>
        <Step n={2}>Нажмите <strong>«Сохранить»</strong> — email будет подтверждён автоматически</Step>

        <H3>Блокировка пользователя</H3>
        <Step n={1}>На странице пользователя нажмите <strong>«Бан»</strong></Step>
        <Step n={2}>Выберите срок: 24 часа, 7 дней, 30 дней или навсегда</Step>
        <Step n={3}>Заблокированный пользователь не сможет войти в систему</Step>
        <Step n={4}>Для разблокировки нажмите <strong>«Разбанить»</strong></Step>

        <H3>Подтверждение email</H3>
        <P>
          Если пользователь не подтвердил email, вы можете сделать это вручную кнопкой <strong>«Подтвердить email»</strong>.
        </P>

        <H3>Скидка пользователю</H3>
        <P>
          Поле «Скидка» задаёт персональную скидку в процентах. Она применяется ко всем заказам пользователя.
        </P>
      </>
    ),
  },
  {
    id: "links",
    title: "Ссылки и платформы",
    icon: Link2,
    content: (
      <>
        <H2><Link2 className="h-5 w-5" /> Ссылки и платформы</H2>
        <P>
          Этот раздел — ключевой для расширения панели на новые соцсети. Здесь вы управляете тем, какие ссылки система умеет распознавать. Три вкладки: Нераспознанные, Платформы, Паттерны.
        </P>

        {/* ── Нераспознанные ── */}
        <H3>Вкладка «Нераспознанные»</H3>
        <P>
          Когда клиент вводит ссылку, которую система не понимает, она сохраняется здесь. 
          Бейдж-счётчик в боковом меню показывает сколько необработанных ссылок ждут вашего внимания.
        </P>
        <Step n={1}>Просмотрите URL-адреса в списке</Step>
        <Step n={2}>Если видите повторяющийся домен (например, <code>threads.net</code>) — это сигнал добавить новую платформу</Step>
        <Step n={3}>После добавления платформы/паттерна, пометьте ссылку как обработанную кнопкой <strong>✓</strong></Step>

        <Tip>
          Регулярно проверяйте этот раздел — он показывает какие соцсети ваши клиенты используют, но система пока не поддерживает.
        </Tip>

        {/* ── Платформы: подробный гайд ── */}
        <H3>Вкладка «Платформы» — добавление новой соцсети</H3>
        <P>
          Платформа — это запись о социальной сети в справочнике. Достаточно добавить платформу с доменами, 
          и ссылки с этих доменов уже начнут распознаваться автоматически.
        </P>

        <P><strong>Пошаговый пример: добавляем Threads</strong></P>
        <Step n={1}>Откройте <Path>Ссылки</Path> → вкладка <strong>«Платформы»</strong></Step>
        <Step n={2}>Нажмите <strong>«+ Платформа»</strong></Step>
        <Step n={3}>Заполните поля:
          <div className="bg-muted/50 rounded-md p-3 mt-2 space-y-2 text-xs">
            <div><strong>Ключ:</strong> <code>threads</code> — уникальный код латиницей, без пробелов, строчными буквами. Используется внутри системы.</div>
            <div><strong>Название:</strong> <code>Threads</code> — красивое имя, которое увидят клиенты в каталоге.</div>
            <div><strong>Домены:</strong> <code>threads.net, www.threads.net</code> — через запятую. Это домены, по которым система определит, что ссылка относится к Threads.</div>
            <div><strong>Иконка:</strong> <code>at-sign</code> — имя иконки из библиотеки Lucide. См. раздел «Где брать иконки» ниже.</div>
            <div><strong>Цвет:</strong> <code>0 0% 10%</code> — HSL-значение для брендирования. См. раздел «Как подбирать цвет» ниже.</div>
          </div>
        </Step>
        <Step n={4}>Нажмите <strong>«Сохранить»</strong></Step>
        <Step n={5}>Проверьте: вставьте ссылку <code>https://threads.net/@username</code> на главной странице — она должна распознаться</Step>

        <Warn>
          Ключ платформы нельзя менять после создания — он используется в привязках услуг. Выбирайте осмысленный ключ сразу.
        </Warn>

        <P><strong>Как найти домены соцсети?</strong></P>
        <P>
          Откройте нужную соцсеть в браузере. Посмотрите на адресную строку — домен это часть URL до первого <code>/</code>. 
          Например, для <code>https://www.threads.net/@zuck</code> домен — <code>threads.net</code>. 
          Добавьте варианты с <code>www.</code> и без, а также короткие ссылки (если есть). Примеры:
        </P>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-3">
          <li>Instagram: <code>instagram.com</code>, <code>instagr.am</code></li>
          <li>YouTube: <code>youtube.com</code>, <code>youtu.be</code></li>
          <li>TikTok: <code>tiktok.com</code>, <code>vm.tiktok.com</code></li>
          <li>Telegram: <code>t.me</code>, <code>telegram.org</code></li>
          <li>X (Twitter): <code>x.com</code>, <code>twitter.com</code></li>
        </ul>

        <P><strong>Где брать иконки?</strong></P>
        <P>
          Откройте сайт <code>lucide.dev/icons</code> в браузере. Введите в поиске название соцсети или похожее слово. 
          Скопируйте имя иконки (например, <code>instagram</code>, <code>youtube</code>, <code>music</code>, <code>send</code>, <code>message-circle</code>).
          Если точной иконки нет — выберите подходящую по смыслу (например, для Threads — <code>at-sign</code>, для Discord — <code>gamepad-2</code>).
        </P>
        <div className="bg-muted/50 rounded-md p-3 mt-2 mb-3 text-xs space-y-1">
          <div><strong>Популярные иконки:</strong></div>
          <div><code>instagram</code> — Instagram, <code>youtube</code> — YouTube, <code>music</code> — TikTok</div>
          <div><code>send</code> — Telegram, <code>message-circle</code> — VK, <code>twitter</code> — X/Twitter</div>
          <div><code>at-sign</code> — Threads, <code>twitch</code> — Twitch, <code>facebook</code> — Facebook</div>
          <div><code>globe</code> — универсальная (для неизвестных сетей)</div>
        </div>

        <P><strong>Как подбирать цвет (HSL)?</strong></P>
        <P>
          Цвет задаётся в формате HSL: три числа через пробел — <strong>оттенок</strong> (0-360), <strong>насыщенность</strong> (0-100%), <strong>яркость</strong> (0-100%).
        </P>
        <div className="bg-muted/50 rounded-md p-3 mt-2 mb-3 text-xs space-y-1">
          <div><strong>Готовые цвета для популярных платформ:</strong></div>
          <div>🟣 Instagram: <code>330 80% 60%</code> (розово-фиолетовый)</div>
          <div>🔴 YouTube: <code>0 80% 55%</code> (красный)</div>
          <div>⚫ TikTok: <code>170 80% 50%</code> (бирюзовый)</div>
          <div>🔵 Telegram: <code>200 80% 55%</code> (голубой)</div>
          <div>🔵 VK: <code>215 70% 55%</code> (синий)</div>
          <div>⬛ X/Twitter: <code>0 0% 10%</code> (почти чёрный)</div>
          <div>🟢 Spotify: <code>140 70% 45%</code> (зелёный)</div>
          <div>🟣 Twitch: <code>265 80% 60%</code> (фиолетовый)</div>
          <div>⚫ Threads: <code>0 0% 10%</code> (чёрный)</div>
          <div>🔵 Facebook: <code>220 70% 55%</code> (синий)</div>
        </div>
        <P>
          Если нужен свой цвет: откройте Google, введите «HSL color picker» — используйте визуальный подборщик. 
          Скопируйте три числа и вставьте через пробел.
        </P>

        {/* ── Категории для платформы ── */}
        <H3>Добавление категорий для новой платформы</H3>
        <P>
          После добавления платформы нужно создать категории услуг для неё (лайки, подписчики, просмотры и т.д.). 
          Это делается в отдельном разделе «Категории».
        </P>
        <Step n={1}>Перейдите в <Path>Категории</Path></Step>
        <Step n={2}>Проверьте, есть ли уже нужные категории (например, «Лайки» может уже существовать)</Step>
        <Step n={3}>Если нет — введите название категории (например, «Подписчики Threads») и нажмите <strong>«Добавить»</strong></Step>
        <Step n={4}>Повторите для всех типов услуг, которые планируете продавать для этой платформы</Step>

        <Tip>
          Категории не привязаны к конкретной платформе — они общие. Услуга сама указывает, к какой сети она относится (поле «network»). 
          Поэтому можно использовать одну категорию «Лайки» для всех соцсетей, либо делать отдельные «Лайки Instagram», «Лайки YouTube» — на ваш выбор.
        </Tip>

        {/* ── Паттерны: подробный гайд ── */}
        <H3>Вкладка «Паттерны» — детальное распознавание ссылок</H3>
        <P>
          Паттерны нужны, когда вы хотите <strong>точно определить тип ссылки</strong>: профиль это, пост, видео или сторис. 
          Без паттернов система определит только <strong>какая</strong> это соцсеть (по домену), но не <strong>что</strong> именно по ссылке.
        </P>

        <Warn>
          Паттерны используют регулярные выражения (regex). Если вы не знакомы с regex — не переживайте! 
          Ниже готовые шаблоны для всех популярных случаев. Просто копируйте и вставляйте.
        </Warn>

        <P><strong>Пошаговый пример: паттерн для профиля Threads</strong></P>
        <Step n={1}>Откройте <Path>Ссылки</Path> → вкладка <strong>«Паттерны»</strong></Step>
        <Step n={2}>Нажмите <strong>«+ Паттерн»</strong></Step>
        <Step n={3}>Заполните:
          <div className="bg-muted/50 rounded-md p-3 mt-2 space-y-2 text-xs">
            <div><strong>Платформа:</strong> выберите <code>Threads</code> из списка (должна быть уже добавлена)</div>
            <div><strong>Тип ссылки:</strong> выберите <code>profile</code></div>
            <div><strong>Метка:</strong> <code>Профиль Threads</code> — понятное описание для вас</div>
            <div><strong>Паттерн (regex):</strong> <code>threads\.net/@([A-Za-z0-9_.]+)</code></div>
            <div><strong>Username group:</strong> <code>1</code> — система извлечёт имя пользователя из скобок в regex</div>
          </div>
        </Step>
        <Step n={4}>Протестируйте: вставьте <code>https://www.threads.net/@zuck</code> в поле «Тест URL» и проверьте что появилась зелёная галочка</Step>
        <Step n={5}>Нажмите <strong>«Сохранить»</strong></Step>

        <H3>Готовые паттерны для копирования</H3>
        <P>Ниже таблица готовых regex-паттернов. Копируйте значение из колонки «Паттерн» и вставляйте в поле при создании.</P>
        
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs border border-border rounded-md">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-2 font-medium">Платформа</th>
                <th className="text-left p-2 font-medium">Тип</th>
                <th className="text-left p-2 font-medium">Паттерн (regex)</th>
                <th className="text-left p-2 font-medium">Пример URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="p-2">Instagram</td><td className="p-2">profile</td><td className="p-2"><code>instagram\.com/([A-Za-z0-9_.]+)/?$</code></td><td className="p-2 text-muted-foreground">instagram.com/username</td></tr>
              <tr><td className="p-2">Instagram</td><td className="p-2">post</td><td className="p-2"><code>instagram\.com/p/([A-Za-z0-9_-]+)</code></td><td className="p-2 text-muted-foreground">instagram.com/p/ABC123</td></tr>
              <tr><td className="p-2">Instagram</td><td className="p-2">reel</td><td className="p-2"><code>instagram\.com/reel/([A-Za-z0-9_-]+)</code></td><td className="p-2 text-muted-foreground">instagram.com/reel/ABC123</td></tr>
              <tr><td className="p-2">Instagram</td><td className="p-2">story</td><td className="p-2"><code>instagram\.com/stories/([A-Za-z0-9_.]+)</code></td><td className="p-2 text-muted-foreground">instagram.com/stories/username/123</td></tr>
              <tr><td className="p-2">YouTube</td><td className="p-2">video</td><td className="p-2"><code>(?:youtube\.com/watch\?v=|youtu\.be/)([A-Za-z0-9_-]+)</code></td><td className="p-2 text-muted-foreground">youtube.com/watch?v=dQw4w9WgXcQ</td></tr>
              <tr><td className="p-2">YouTube</td><td className="p-2">shorts</td><td className="p-2"><code>youtube\.com/shorts/([A-Za-z0-9_-]+)</code></td><td className="p-2 text-muted-foreground">youtube.com/shorts/ABC123</td></tr>
              <tr><td className="p-2">YouTube</td><td className="p-2">channel</td><td className="p-2"><code>youtube\.com/(?:@|channel/)([A-Za-z0-9_-]+)</code></td><td className="p-2 text-muted-foreground">youtube.com/@username</td></tr>
              <tr><td className="p-2">TikTok</td><td className="p-2">profile</td><td className="p-2"><code>tiktok\.com/@([A-Za-z0-9_.]+)/?$</code></td><td className="p-2 text-muted-foreground">tiktok.com/@username</td></tr>
              <tr><td className="p-2">TikTok</td><td className="p-2">video</td><td className="p-2"><code>tiktok\.com/@[^/]+/video/(\d+)</code></td><td className="p-2 text-muted-foreground">tiktok.com/@user/video/123456</td></tr>
              <tr><td className="p-2">Telegram</td><td className="p-2">channel</td><td className="p-2"><code>t\.me/([A-Za-z0-9_]+)/?$</code></td><td className="p-2 text-muted-foreground">t.me/channelname</td></tr>
              <tr><td className="p-2">Telegram</td><td className="p-2">post</td><td className="p-2"><code>t\.me/([A-Za-z0-9_]+)/(\d+)</code></td><td className="p-2 text-muted-foreground">t.me/channel/123</td></tr>
              <tr><td className="p-2">VK</td><td className="p-2">profile</td><td className="p-2"><code>vk\.com/([A-Za-z0-9_.]+)/?$</code></td><td className="p-2 text-muted-foreground">vk.com/username</td></tr>
              <tr><td className="p-2">VK</td><td className="p-2">wall</td><td className="p-2"><code>vk\.com/wall(-?\d+_\d+)</code></td><td className="p-2 text-muted-foreground">vk.com/wall-123_456</td></tr>
              <tr><td className="p-2">Threads</td><td className="p-2">profile</td><td className="p-2"><code>threads\.net/@([A-Za-z0-9_.]+)</code></td><td className="p-2 text-muted-foreground">threads.net/@username</td></tr>
              <tr><td className="p-2">Threads</td><td className="p-2">post</td><td className="p-2"><code>threads\.net/@[^/]+/post/([A-Za-z0-9_-]+)</code></td><td className="p-2 text-muted-foreground">threads.net/@user/post/ABC</td></tr>
              <tr><td className="p-2">X (Twitter)</td><td className="p-2">profile</td><td className="p-2"><code>(?:x|twitter)\.com/([A-Za-z0-9_]+)/?$</code></td><td className="p-2 text-muted-foreground">x.com/username</td></tr>
              <tr><td className="p-2">X (Twitter)</td><td className="p-2">post</td><td className="p-2"><code>(?:x|twitter)\.com/[^/]+/status/(\d+)</code></td><td className="p-2 text-muted-foreground">x.com/user/status/123456</td></tr>
              <tr><td className="p-2">Facebook</td><td className="p-2">profile</td><td className="p-2"><code>facebook\.com/([A-Za-z0-9_.]+)/?$</code></td><td className="p-2 text-muted-foreground">facebook.com/username</td></tr>
              <tr><td className="p-2">Twitch</td><td className="p-2">channel</td><td className="p-2"><code>twitch\.tv/([A-Za-z0-9_]+)/?$</code></td><td className="p-2 text-muted-foreground">twitch.tv/streamer</td></tr>
              <tr><td className="p-2">Spotify</td><td className="p-2">profile</td><td className="p-2"><code>open\.spotify\.com/user/([A-Za-z0-9]+)</code></td><td className="p-2 text-muted-foreground">open.spotify.com/user/123</td></tr>
            </tbody>
          </table>
        </div>

        <H3>Как создать свой паттерн (для новичков)</H3>
        <P>Если нужной соцсети нет в таблице выше, создайте паттерн по шаблону:</P>
        <Step n={1}>Откройте нужную соцсеть, скопируйте ссылку на профиль/пост</Step>
        <Step n={2}>Определите «постоянную часть» URL. Например, в <code>https://example.com/user/john123</code> постоянная часть — <code>example\.com/user/</code></Step>
        <Step n={3}>Определите «переменную часть» — то, что меняется от пользователя к пользователю. Обычно это имя или ID. Оберните в скобки: <code>([A-Za-z0-9_]+)</code></Step>
        <Step n={4}>Соберите: <code>example\.com/user/([A-Za-z0-9_]+)</code></Step>
        <Step n={5}>Вставьте в поле «Паттерн» и протестируйте на реальном URL</Step>

        <div className="bg-muted/50 rounded-md p-3 mt-2 mb-3 text-xs space-y-2">
          <div><strong>Шпаргалка по regex (только нужное):</strong></div>
          <div><code>\.</code> — точка (буквально). Пишите <code>\.</code> вместо просто <code>.</code></div>
          <div><code>[A-Za-z0-9_]</code> — любая буква, цифра или подчёркивание</div>
          <div><code>[A-Za-z0-9_-]</code> — то же + дефис</div>
          <div><code>+</code> — один или более символов</div>
          <div><code>*</code> — ноль или более символов</div>
          <div><code>(\d+)</code> — одна или более цифр (захват в группу)</div>
          <div><code>(...)</code> — группа захвата. Номер группы = порядковый номер открывающей скобки</div>
          <div><code>/?$</code> — необязательный слеш в конце URL</div>
          <div><code>(?:...|...)</code> — или (без захвата). Например <code>(?:x|twitter)\.com</code> матчит и x.com и twitter.com</div>
        </div>

        <Tip>
          Всегда проверяйте паттерн через встроенный тестер! Вставьте 2-3 реальных URL и убедитесь, что все определяются правильно. 
          Если не работает — проверьте, что точки экранированы (<code>\.</code>) и скобки расставлены верно.
        </Tip>

        <H3>Полный workflow: добавление новой соцсети от А до Я</H3>
        <div className="bg-muted/30 rounded-md p-4 mt-2 mb-3 text-sm space-y-3 border border-border">
          <Step n={1}><strong>Платформа:</strong> <Path>Ссылки → Платформы → + Платформа</Path>. Заполните ключ, название, домены, иконку, цвет.</Step>
          <Step n={2}><strong>Паттерны:</strong> <Path>Ссылки → Паттерны → + Паттерн</Path>. Добавьте regex для каждого типа ссылки (профиль, пост, видео). Используйте таблицу готовых паттернов или создайте свои.</Step>
          <Step n={3}><strong>Категории:</strong> <Path>Категории</Path>. Создайте категории для типов услуг (лайки, подписчики, просмотры).</Step>
          <Step n={4}><strong>Провайдер:</strong> <Path>Провайдеры</Path>. Убедитесь, что у вашего провайдера есть услуги для этой соцсети.</Step>
          <Step n={5}><strong>Синхронизация:</strong> <Path>Услуги → Синхронизация</Path>. Подтяните услуги провайдера.</Step>
          <Step n={6}><strong>Каталог:</strong> <Path>Услуги → вкладка Провайдеры</Path>. Найдите нужные услуги и нажмите «→ Каталог» для каждой.</Step>
          <Step n={7}><strong>Проверка:</strong> Откройте публичный каталог, выберите новую соцсеть и попробуйте оформить тестовый заказ.</Step>
        </div>

        <H3>Трёхуровневая система распознавания</H3>
        <P>Система проверяет ссылку в порядке приоритета:</P>
        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 mb-3">
          <li><strong>Встроенные паттерны</strong> — hardcoded regex для основных соцсетей (Instagram, YouTube, TikTok, Telegram, VK)</li>
          <li><strong>Домены платформ</strong> — если URL содержит домен из справочника платформ</li>
          <li><strong>Паттерны из БД</strong> — кастомные regex, добавленные вами в разделе «Паттерны»</li>
        </ol>
        <P>Если ссылка не прошла ни один уровень — она попадёт в «Нераспознанные».</P>
      </>
    ),
  },
  {
    id: "promocodes",
    title: "Промокоды",
    icon: Tag,
    content: (
      <>
        <H2><Tag className="h-5 w-5" /> Промокоды</H2>
        <P>Система промокодов позволяет создавать скидки для клиентов.</P>

        <H3>Создание промокода</H3>
        <Step n={1}>Перейдите в <Path>Промокоды</Path> → нажмите <strong>«Создать»</strong></Step>
        <Step n={2}>Заполните:
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><strong>Код</strong> — текст, который вводит пользователь (например, SALE20)</li>
            <li><strong>Тип скидки</strong> — процент или фиксированная сумма</li>
            <li><strong>Значение</strong> — размер скидки</li>
            <li><strong>Макс. использований</strong> — лимит активаций (пусто = без лимита)</li>
            <li><strong>Мин. сумма заказа</strong> — при какой сумме промокод активен</li>
            <li><strong>Период действия</strong> — дата начала и окончания</li>
          </ul>
        </Step>
        <Step n={3}>Нажмите <strong>«Сохранить»</strong></Step>
      </>
    ),
  },
  {
    id: "support",
    title: "Поддержка",
    icon: MessageSquare,
    content: (
      <>
        <H2><MessageSquare className="h-5 w-5" /> Техподдержка</H2>
        <P>
          Раздел содержит все тикеты от пользователей. Тикеты можно фильтровать по статусу и приоритету.
        </P>

        <H3>Работа с тикетом</H3>
        <Step n={1}>Откройте тикет из списка</Step>
        <Step n={2}>Прочитайте переписку с пользователем</Step>
        <Step n={3}>Напишите ответ и нажмите <strong>«Отправить»</strong></Step>
        <Step n={4}>Чтобы закрыть тикет, нажмите <strong>«Закрыть»</strong></Step>

        <H3>Автозакрытие</H3>
        <P>
          Тикеты автоматически закрываются через N часов после последнего ответа админа (настраивается в Настройках → <code>auto_close_hours</code>).
        </P>

        <Tip>
          Пользователь может переоткрыть тикет, ответив на закрытый тикет.
        </Tip>
      </>
    ),
  },
  {
    id: "staff",
    title: "Сотрудники и аудит",
    icon: Shield,
    content: (
      <>
        <H2><Shield className="h-5 w-5" /> Сотрудники и безопасность</H2>
        <P>
          Раздел управляет доступом сотрудников (модераторов) к админ-панели и ведёт журнал всех действий.
        </P>

        <H3>Добавление сотрудника</H3>
        <Step n={1}>Перейдите в <Path>Сотрудники</Path> → нажмите <strong>«Добавить»</strong></Step>
        <Step n={2}>Введите <strong>User ID</strong> пользователя (UUID из профиля)</Step>
        <Step n={3}>Выберите <strong>роль</strong>: Admin или Moderator</Step>
        <Step n={4}>Для модератора — выберите <strong>права доступа</strong>:
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Управление заказами</li>
            <li>Управление пользователями</li>
            <li>Управление услугами</li>
            <li>Техподдержка</li>
            <li>Возвраты средств</li>
            <li>Управление сотрудниками</li>
            <li>Просмотр логов</li>
            <li>Финансовая информация</li>
          </ul>
        </Step>
        <Step n={5}>Нажмите <strong>«Добавить»</strong></Step>

        <Warn>
          Модератор видит только те разделы, на которые ему даны права. Админ имеет полный доступ.
        </Warn>

        <H3>Журнал аудита</H3>
        <P>
          Вкладка «Аудит» показывает все действия всех сотрудников: кто, когда и что сделал. 
          Фильтрация по типу действия и поиск по тексту.
        </P>
        <P>Записываются: возвраты, смена статусов, изменение баланса, блокировки, синхронизации, изменения услуг и прав.</P>
      </>
    ),
  },
  {
    id: "pages",
    title: "Страницы и SEO",
    icon: FileText,
    content: (
      <>
        <H2><FileText className="h-5 w-5" /> Страницы и SEO</H2>
        <P>Создание и редактирование статических страниц сайта (условия использования, о нас и т.д.).</P>

        <H3>Создание страницы</H3>
        <Step n={1}>Перейдите в <Path>Страницы и SEO</Path> → нажмите <strong>«Создать»</strong></Step>
        <Step n={2}>Заполните slug (URL-адрес, например <code>terms</code>), заголовок и содержимое (HTML)</Step>
        <Step n={3}>Настройте SEO: meta title, meta description, OG image</Step>
        <Step n={4}>Опубликуйте, включив переключатель</Step>
        <P>Страница будет доступна по адресу <code>/page/slug</code></P>
      </>
    ),
  },
  {
    id: "faq",
    title: "FAQ",
    icon: HelpCircle,
    content: (
      <>
        <H2><HelpCircle className="h-5 w-5" /> FAQ</H2>
        <P>Управление вопросами и ответами, отображаемыми на сайте.</P>
        <Step n={1}>Добавьте вопрос и ответ</Step>
        <Step n={2}>Настройте порядок отображения</Step>
        <Step n={3}>Опубликуйте, включив переключатель</Step>
      </>
    ),
  },
  {
    id: "widgets",
    title: "Виджеты",
    icon: Puzzle,
    content: (
      <>
        <H2><Puzzle className="h-5 w-5" /> Виджеты</H2>
        <P>Визуальные элементы, отображаемые на публичных страницах сайта (баннеры, уведомления).</P>
      </>
    ),
  },
  {
    id: "settings",
    title: "Настройки",
    icon: Settings,
    content: (
      <>
        <H2><Settings className="h-5 w-5" /> Глобальные настройки</H2>
        <P>Все настройки сгруппированы по категориям и могут быть изменены без перезапуска системы.</P>

        <H3>Ключевые параметры</H3>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-3">
          <li><strong>auto_close_hours</strong> — через сколько часов автоматически закрывать тикеты</li>
          <li><strong>min_deposit / max_deposit</strong> — лимиты пополнения баланса</li>
          <li><strong>default_markup_percent</strong> — наценка по умолчанию на услуги провайдеров</li>
          <li><strong>order_retry_delay</strong> — задержка между попытками отправки заказа</li>
        </ul>

        <Tip>Изменения применяются мгновенно. Будьте осторожны с финансовыми параметрами.</Tip>
      </>
    ),
  },
];

export default function AdminDocs() {
  const [activeSection, setActiveSection] = useState("overview");

  const currentSection = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div className="flex gap-4 h-[calc(100vh-5rem)]">
      {/* Sidebar nav */}
      <div className="w-56 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-bold text-foreground">Документация</h1>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav className="space-y-0.5">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === activeSection;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{s.title}</span>
                  {isActive && <ChevronRight className="h-3 w-3 ml-auto shrink-0" />}
                </button>
              );
            })}
          </nav>
        </ScrollArea>
      </div>

      {/* Content */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <div className="p-6 max-w-3xl">
              {currentSection.content}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
