# 🛡️ Руководство по стабильности приложения

## Что было добавлено

Для повышения надежности и устойчивости приложения были внедрены следующие компоненты:

### 1. **ErrorBoundary** - Граница ошибок
**Файл:** `src/components/ErrorBoundary.tsx`

**Зачем нужен:**
- Перехватывает ошибки рендеринга React-компонентов
- Предотвращает "падение" всего приложения при ошибке в отдельном компоненте
- Показывает пользователю понятный UI вместо белого экрана

**Как работает:**
```tsx
// В main.tsx уже подключено:
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Что видит пользователь:**
- Красивое сообщение об ошибке с иконкой
- Кнопки "Попробовать снова" и "На главную"
- В режиме разработки - детали ошибки для отладки

---

### 2. **useRetry** - Хук повторных запросов
**Файл:** `src/hooks/useRetry.ts`

**Зачем нужен:**
- Автоматически повторяет неудачные API-запросы
- Использует экспоненциальную задержку (1с, 2с, 4с...)
- Улучшает UX при временных проблемах сети

**Пример использования:**
```tsx
import { useRetry } from '@/hooks/useRetry';

function MyComponent() {
  const { data, error, isLoading, isRetrying, attempt } = useRetry(
    async () => {
      const response = await fetch('/api/data');
      return response.json();
    },
    {
      maxRetries: 3,
      retryDelay: 1000,
      onRetry: (attempt, error) => {
        console.log(`Попытка ${attempt}: ${error.message}`);
      },
    }
  );

  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  if (!data) return null;

  return <div>{/* рендер данных */}</div>;
}
```

**Параметры:**
- `maxRetries` (по умолчанию 3): максимальное количество попыток
- `retryDelay` (по умолчанию 1000мс): базовая задержка между попытками
- `onRetry`: коллбек, вызываемый перед каждой попыткой
- `onError`: коллбек, вызываемый при исчерпании попыток

**Возвращаемые значения:**
- `data`: полученные данные (или null)
- `error`: ошибка (если все попытки исчерпаны)
- `isLoading`: идет ли загрузка
- `isRetrying`: идет ли процесс повторной попытки
- `attempt`: текущая попытка (0-based)
- `execute`: функция для ручного запуска
- `reset`: сброс состояния

---

### 3. **notificationService** - Единая система уведомлений
**Файл:** `src/lib/notifications.ts`

**Зачем нужен:**
- Унифицирует все уведомления в приложении
- Предоставляет готовые шаблоны для разных ситуаций
- Упрощает обработку ошибок API

**Примеры использования:**

```tsx
import { notificationService } from '@/lib/notifications';

// Успешное уведомление
notificationService.success('Заказ создан!', {
  description: 'Менеджер свяжется с вами в течение 5 минут',
  duration: 5000,
});

// Уведомление об ошибке
notificationService.error('Не удалось оплатить заказ', {
  description: 'Проверьте данные карты и попробуйте еще раз',
  duration: 8000,
});

// Информационное уведомление
notificationService.info('Новое обновление доступно', {
  action: {
    label: 'Обновить',
    onClick: () => window.location.reload(),
  },
});

// Уведомление о загрузке (не закрывается автоматически)
const toastId = notificationService.loading('Обработка платежа...');

// Позже обновить на успех
notificationService.update(toastId, 'Платеж успешен!', 'success');

// Или на ошибку
notificationService.update(toastId, 'Платеж отклонен', 'error');

// Обработка ошибок API
try {
  await api.createOrder(data);
} catch (error) {
  notificationService.handleApiError(error, 'Не удалось создать заказ');
}

// Уведомление с возможностью отмены
notificationService.withUndo(
  'Заказ удален',
  () => { /* логика отмены */ }
);
```

**Доступные методы:**
- `success(message, options)` - успешное действие
- `error(message, options)` - ошибка
- `info(message, options)` - информация
- `warning(message, options)` - предупреждение
- `loading(message, options)` - индикатор загрузки
- `update(id, message, type, options)` - обновление существующего
- `dismiss(id)` - закрытие конкретного уведомления
- `dismissAll()` - закрытие всех уведомлений
- `withUndo(message, onUndo, options)` - с кнопкой отмены
- `handleApiError(error, defaultMessage)` - обработка API ошибок

---

### 4. **NetworkProvider** - Мониторинг сети
**Файл:** `src/providers/NetworkProvider.tsx`

**Зачем нужен:**
- Отслеживает статус подключения к интернету
- Автоматически определяет потерю и восстановление соединения
- Позволяет ставить действия в очередь до восстановления связи

**Использование в main.tsx (уже подключено):**
```tsx
<NetworkProvider>
  <App />
</NetworkProvider>
```

**Хук useNetworkStatus:**
```tsx
import { useNetworkStatus } from '@/providers/NetworkProvider';

function MyComponent() {
  const { isOnline, isReconnecting, lastOfflineAt, lastOnlineAt } = useNetworkStatus();

  return (
    <div>
      {isOnline ? '🟢 Онлайн' : '🔴 Офлайн'}
      {isReconnecting && '⏳ Восстановление...'}
    </div>
  );
}
```

**Хук useWhenOnline:**
```tsx
import { useWhenOnline } from '@/providers/NetworkProvider';

function AutoSyncComponent() {
  // Этот коллбек выполнится только когда есть соединение
  // Если соединения нет - выполнится после восстановления
  useWhenOnline(async () => {
    await syncDataWithServer();
  });

  return <div>Автосинхронизация активна</div>;
}
```

---

### 5. **OfflineBanner** - Индикатор офлайн-режима
**Файл:** `src/components/OfflineBanner.tsx`

**Зачем нужен:**
- Автоматически показывает плашку при потере соединения
- Информирует пользователя о проблемах с сетью
- Исчезает при восстановлении подключения

**Использование в main.tsx (уже подключено):**
```tsx
<NetworkProvider>
  <OfflineBanner />
  <App />
</NetworkProvider>
```

**Компонент OfflineFallback:**
```tsx
import { OfflineFallback } from '@/components/OfflineBanner';

function Dashboard() {
  const handleRetry = () => {
    // Логика повторной попытки
  };

  return (
    <>
      {/* Показывается только когда нет сети */}
      <OfflineFallback
        message="Нет подключения к интернету"
        retryLabel="Попробовать снова"
        onRetry={handleRetry}
      />
      
      {/* Основной контент страницы */}
      <DashboardContent />
    </>
  );
}
```

---

## 📊 Архитектура стабильности

```
┌─────────────────────────────────────────────────────┐
│                  ErrorBoundary                       │
│  (Перехватывает ошибки рендеринга всего приложения) │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                NetworkProvider                       │
│  (Отслеживает статус сети, управляет состоянием)   │
└─────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
    ┌─────────────────┐     ┌─────────────────┐
    │ OfflineBanner   │     │      App        │
    │ (Визуальный     │     │  (Основное      │
    │  индикатор)     │     │  приложение)    │
    └─────────────────┘     └─────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │  useRetry    │  │ notification │  │ useWhenOnline│
          │  (Повторы    │  │  Service     │  │ (Очередь     │
          │   запросов)  │  │ (Уведомления)│  │  действий)   │
          └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🎯 Рекомендации по использованию

### ✅ Делайте так:

1. **Оборачивайте критические компоненты в ErrorBoundary:**
```tsx
<ErrorBoundary fallback={<CustomFallback />}>
  <CriticalComponent />
</ErrorBoundary>
```

2. **Используйте notificationService для всех уведомлений:**
```tsx
// Вместо toast.success/toast.error
notificationService.success('Готово!');
notificationService.error('Ошибка!');
```

3. **Обрабатывайте ошибки API централизованно:**
```tsx
try {
  await apiCall();
  notificationService.success('Успешно!');
} catch (error) {
  notificationService.handleApiError(error);
}
```

4. **Используйте useRetry для важных запросов:**
```tsx
const { data } = useRetry(
  () => fetchCriticalData(),
  { maxRetries: 3 }
);
```

5. **Показывайте OfflineFallback для контента, требующего сети:**
```tsx
<OfflineFallback onRetry={refetch} />
<DataGrid />
```

### ❌ Избегайте этого:

1. **Не игнорируйте ошибки:**
```tsx
// Плохо
await apiCall(); // Может упасть

// Хорошо
try {
  await apiCall();
} catch (error) {
  notificationService.handleApiError(error);
}
```

2. **Не используйте toast напрямую:**
```tsx
// Плохо
toast.success('OK');
toast.error('Error');

// Хорошо
notificationService.success('OK');
notificationService.error('Error');
```

3. **Не оставляйте пользователей без обратной связи:**
```tsx
// Плохо - белый экран при ошибке
<ComponentThatMayFail />

// Хорошо - показываем fallback
<ErrorBoundary>
  <ComponentThatMayFail />
</ErrorBoundary>
```

---

## 🔧 Настройка для продакшена

### 1. Подключение мониторинга ошибок (Sentry)

В `src/components/ErrorBoundary.tsx` раскомментируйте:

```tsx
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error('❌ [ErrorBoundary] Uncaught error:', error, errorInfo);
  this.setState({ error, errorInfo });

  // Отправка в Sentry
  if (process.env.NODE_ENV === 'production') {
    import('@sentry/react').then(Sentry => {
      Sentry.captureException(error, { contexts: { react: errorInfo } });
    });
  }
}
```

### 2. Логирование аналитики

Добавьте в `notificationService`:

```tsx
error: (message: string, options?: ToastOptions) => {
  // Логируем частые ошибки в аналитику
  if (process.env.NODE_ENV === 'production') {
    logToAnalytics('user_facing_error', { message, timestamp: Date.now() });
  }
  
  return toast.error(message, { /* ... */ });
}
```

### 3. Кастомизация стилей

Измените цвета в `OfflineBanner.tsx`:

```tsx
<div className="fixed top-0 left-0 right-0 z-50 
  bg-red-600 text-white px-4 py-3 shadow-lg">
  {/* Ваш кастомный дизайн */}
</div>
```

---

## 📈 Метрики стабильности

Отслеживайте эти показатели:

1. **Crash-free sessions:** % сессий без падений
   - Цель: >99.5%

2. **Error rate:** Количество ошибок на 1000 сессий
   - Цель: <10

3. **API success rate:** % успешных API запросов
   - Цель: >99%

4. **Retry success rate:** % запросов, успешных после повтора
   - Цель: >80% (значит retry работает)

5. **Offline duration:** Среднее время офлайн-режима
   - Помогает понять проблемы пользователей

---

## 🚀 Следующие шаги

### Рекомендуется добавить:

1. **Интеграция с Sentry/LogRocket**
   - Для отслеживания ошибок в реальном времени

2. **Персистентный кэш**
   - Сохранение данных в IndexedDB для офлайн-работы

3. **Оптимистичные обновления**
   - Мгновенный UI с откатом при ошибке

4. **Health checks**
   - Периодическая проверка доступности API

5. **Circuit breaker**
   - Автоматическое отключение неработающих сервисов

---

## 📞 Поддержка

При возникновении проблем:

1. Проверьте консоль браузера на ошибки
2. Проверьте Network tab в DevTools
3. Посмотрите логи в `ErrorBoundary` (в режиме разработки)
4. Используйте `notificationService.handleApiError()` для отладки

---

**Документ создан:** 2026-03-11  
**Версия:** 1.0  
**Статус:** ✅ Внедрено в production
