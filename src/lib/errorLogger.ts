import { toast } from '@/hooks/use-toast';

/**
 * Типы уведомлений
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Опции для уведомления
 */
interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;      // Длительность в мс (по умолчанию 5000)
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * errorLogger - централизованный сервис логгирования ошибок
 * 
 * ЗАЧЕМ:
 * - Единое место для обработки всех ошибок приложения
 * - Автоматические уведомления пользователя при критичных ошибках
 * - Логгирование в консоль для разработчиков
 * - Подготовка к интеграции с Sentry/LogRocket
 * - Разделение ошибок на категории (сеть, авторизация, валидация...)
 * 
 * КАК РАБОТАЕТ:
 * 1. Получаем ошибку и контекст
 * 2. Классифицируем тип ошибки
 * 3. Логируем в консоль с деталями
 * 4. Показываем пользователю понятное уведомление
 * 5. (Опционально) Отправляем в мониторинг
 */

interface ErrorContext {
  userId?: string;
  page?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

interface LogEntry {
  timestamp: string;
  type: string;
  message: string;
  stack?: string;
  context?: ErrorContext;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: LogEntry[] = [];
  private maxLogs = 100;  // Храним последние 100 ошибок в памяти

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Залоггировать ошибку
   */
  log(
    error: Error | unknown,
    context: ErrorContext = {},
    showNotification: boolean = true
  ): void {
    const isError = error instanceof Error;
    const errorMessage = isError ? error.message : String(error);
    const errorStack = isError ? error.stack : undefined;

    // Создаём запись лога
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type: this.classifyError(errorMessage),
      message: errorMessage,
      stack: errorStack,
      context,
    };

    // Сохраняем в память
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Удаляем старые логи
    }

    // Логируем в консоль
    console.error(`🚨 [${entry.type}] ${entry.message}`, {
      timestamp: entry.timestamp,
      context,
      stack: errorStack,
    });

    // Показываем уведомление пользователю
    if (showNotification) {
      this.showNotification(entry);
    }

    // TODO: Отправить в мониторинг (Sentry, LogRocket)
    // if (process.env.NODE_ENV === 'production') {
    //   this.sendToMonitoring(entry);
    // }
  }

  /**
   * Классифицировать тип ошибки
   */
  private classifyError(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (lowerMessage.includes('auth') || lowerMessage.includes('token')) {
      return 'AUTH_ERROR';
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    if (lowerMessage.includes('permission') || lowerMessage.includes('forbidden')) {
      return 'PERMISSION_ERROR';
    }
    if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
      return 'NOT_FOUND_ERROR';
    }
    if (lowerMessage.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Показать уведомление пользователю
   */
  private showNotification(entry: LogEntry): void {
    const config = this.getNotificationConfig(entry.type);

    toast({
      variant: config.variant,
      title: config.title,
      description: this.getUserFriendlyMessage(entry.type, entry.message),
      duration: config.duration,
    });
  }

  /**
   * Получить конфигурацию уведомления для типа ошибки
   */
  private getNotificationConfig(errorType: string): {
    variant: 'default' | 'destructive' | 'warning';
    title: string;
    duration: number;
  } {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return {
          variant: 'destructive',
          title: 'Проблемы с соединением',
          duration: 8000,
        };
      case 'AUTH_ERROR':
        return {
          variant: 'destructive',
          title: 'Ошибка авторизации',
          duration: 5000,
        };
      case 'VALIDATION_ERROR':
        return {
          variant: 'default',
          title: 'Ошибка валидации',
          duration: 4000,
        };
      case 'PERMISSION_ERROR':
        return {
          variant: 'warning',
          title: 'Нет доступа',
          duration: 5000,
        };
      case 'NOT_FOUND_ERROR':
        return {
          variant: 'default',
          title: 'Не найдено',
          duration: 3000,
        };
      case 'TIMEOUT_ERROR':
        return {
          variant: 'destructive',
          title: 'Превышено время ожидания',
          duration: 6000,
        };
      default:
        return {
          variant: 'destructive',
          title: 'Что-то пошло не так',
          duration: 5000,
        };
    }
  }

  /**
   * Преобразовать техническое сообщение в понятное для пользователя
   */
  private getUserFriendlyMessage(type: string, technicalMessage: string): string {
    const messages: Record<string, string> = {
      NETWORK_ERROR: 'Проверьте подключение к интернету и попробуйте снова.',
      AUTH_ERROR: 'Ваша сессия истекла. Пожалуйста, войдите в систему заново.',
      VALIDATION_ERROR: 'Проверьте правильность введённых данных.',
      PERMISSION_ERROR: 'У вас недостаточно прав для выполнения этого действия.',
      NOT_FOUND_ERROR: 'Запрашиваемый ресурс не найден.',
      TIMEOUT_ERROR: 'Сервер не ответил вовремя. Попробуйте позже.',
    };

    return messages[type] || `Произошла ошибка: ${technicalMessage}`;
  }

  /**
   * Получить историю логов
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Очистить историю логов
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Экспортировать логи (для отладки)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Отправить логи в мониторинг (заглушка для будущей интеграции)
   */
  async sendToMonitoring(entry: LogEntry): Promise<void> {
    // TODO: Интеграция с Sentry
    // Sentry.captureException({
    //   message: entry.message,
    //   stack: entry.stack,
    //   tags: { type: entry.type },
    //   extra: entry.context,
    // });

    // TODO: Интеграция с LogRocket
    // LogRocket.error(entry.message, { ...entry.context });

    console.log('📤 Отправка в мониторинг:', entry);
  }
}

// Экспорт единственного экземпляра
export const errorLogger = ErrorLogger.getInstance();

/**
 * Хелпер для быстрого логгирования
 */
export function logError(
  error: Error | unknown,
  context?: ErrorContext,
  showNotification?: boolean
): void {
  errorLogger.log(error, context, showNotification);
}

export default errorLogger;
