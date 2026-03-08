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
          Раздел управляет распознаванием ссылок, которые пользователи вводят при заказе. Три вкладки:
        </P>

        <H3>Вкладка «Нераспознанные»</H3>
        <P>
          Когда пользователь вводит ссылку, которую система не может определить (не соответствует ни одному паттерну и домену), 
          она попадает сюда. Бейдж в боковом меню показывает количество необработанных ссылок.
        </P>
        <Step n={1}>Просмотрите список нераспознанных URL</Step>
        <Step n={2}>Если ссылка относится к известной соцсети — добавьте платформу или паттерн</Step>
        <Step n={3}>Пометьте как обработанную кнопкой <strong>«✓»</strong></Step>

        <H3>Вкладка «Платформы»</H3>
        <P>
          Справочник социальных сетей. Каждая платформа содержит:
        </P>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-3">
          <li><strong>Ключ</strong> — уникальный код (instagram, youtube, tiktok...)</li>
          <li><strong>Название</strong> — отображаемое имя</li>
          <li><strong>Домены</strong> — список доменов для автоопределения (instagram.com, instagr.am)</li>
          <li><strong>Иконка</strong> — имя lucide-иконки</li>
          <li><strong>Цвет</strong> — HSL-значение для брендирования</li>
        </ul>

        <P><strong>Добавление новой соцсети:</strong></P>
        <Step n={1}>Нажмите <strong>«+ Платформа»</strong></Step>
        <Step n={2}>Заполните ключ (латиницей, одним словом), название и домены через запятую</Step>
        <Step n={3}>Укажите иконку (имя из lucide-react) и цвет в формате HSL (например, <code>330 80% 60%</code>)</Step>
        <Step n={4}>Нажмите <strong>«Сохранить»</strong></Step>

        <Tip>
          После добавления платформы с доменами, ссылки с этих доменов будут автоматически распознаваться — без создания паттернов.
        </Tip>

        <H3>Вкладка «Паттерны»</H3>
        <P>
          Регулярные выражения для точного распознавания типов ссылок (профиль, пост, видео и т.д.).
        </P>

        <P><strong>Добавление паттерна:</strong></P>
        <Step n={1}>Нажмите <strong>«+ Паттерн»</strong></Step>
        <Step n={2}>Выберите <strong>платформу</strong> из выпадающего списка</Step>
        <Step n={3}>Укажите <strong>тип ссылки</strong> (profile, post, video, reel...)</Step>
        <Step n={4}>Введите <strong>регулярное выражение</strong> (regex). Например: <code>instagram\.com/p/([A-Za-z0-9_-]+)</code></Step>
        <Step n={5}>Опционально: укажите группы извлечения (username group, ID group)</Step>
        <Step n={6}>Протестируйте паттерн: вставьте URL в поле «Тест» и убедитесь что он матчится</Step>
        <Step n={7}>Нажмите <strong>«Сохранить»</strong></Step>

        <H3>Трёхуровневая система распознавания</H3>
        <P>Система проверяет ссылку в порядке приоритета:</P>
        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 mb-3">
          <li><strong>Встроенные паттерны</strong> — hardcoded regex для основных соцсетей</li>
          <li><strong>Домены платформ</strong> — если URL содержит домен из справочника</li>
          <li><strong>Паттерны из БД</strong> — кастомные regex, добавленные администратором</li>
        </ol>
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
