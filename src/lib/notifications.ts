import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Унифицированная система уведомлений для всего приложения.
 * Обеспечивает консистентный UX при ошибках, успехе и загрузке.
 */
export const notificationService = {
  /**
   * Показать успешное уведомление
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: options?.duration || 4000,
      description: options?.description,
      action: options?.action,
    });
  },

  /**
   * Показать уведомление об ошибке
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: options?.duration || 6000,
      description: options?.description,
      action: options?.action,
    });
  },

  /**
   * Показать информационное уведомление
   */
  info: (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      duration: options?.duration || 4000,
      description: options?.description,
      action: options?.action,
    });
  },

  /**
   * Показать предупреждение
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      duration: options?.duration || 5000,
      description: options?.description,
      action: options?.action,
    });
  },

  /**
   * Показать уведомление о загрузке (с автоматическим закрытием)
   */
  loading: (message: string, options?: Omit<ToastOptions, 'duration'>) => {
    return toast.loading(message, {
      duration: options?.duration, // undefined = не закроется автоматически
      description: options?.description,
      action: options?.action,
    });
  },

  /**
   * Закрыть конкретное уведомление по ID
   */
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Закрыть все уведомления
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Обновить существующее уведомление (например, с "loading" на "success")
   */
  update: (toastId: string | number, message: string, type: ToastType, options?: ToastOptions) => {
    switch (type) {
      case 'success':
        return toast.success(message, {
          id: toastId,
          duration: options?.duration || 4000,
          description: options?.description,
          action: options?.action,
        });
      case 'error':
        return toast.error(message, {
          id: toastId,
          duration: options?.duration || 6000,
          description: options?.description,
          action: options?.action,
        });
      case 'info':
        return toast.info(message, {
          id: toastId,
          duration: options?.duration || 4000,
          description: options?.description,
          action: options?.action,
        });
      case 'warning':
        return toast.warning(message, {
          id: toastId,
          duration: options?.duration || 5000,
          description: options?.description,
          action: options?.action,
        });
      case 'loading':
        return toast.loading(message, {
          id: toastId,
          duration: options?.duration,
          description: options?.description,
          action: options?.action,
        });
      default:
        return toast(message, {
          id: toastId,
          duration: options?.duration || 4000,
          description: options?.description,
          action: options?.action,
        });
    }
  },

  /**
   * Показать уведомление с действием отмены (для критических операций)
   */
  withUndo: (message: string, onUndo: () => void, options?: Omit<ToastOptions, 'action'>) => {
    return toast.success(message, {
      duration: options?.duration || 8000,
      description: options?.description,
      action: {
        label: 'Отменить',
        onClick: onUndo,
      },
      ...options,
    });
  },

  /**
   * Обработка ошибок API с понятными сообщениями
   */
  handleApiError: (error: unknown, defaultMessage: string = 'Произошла ошибка') => {
    let message = defaultMessage;
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String((error as any).message);
    }

    return this.error(message, {
      description: 'Пожалуйста, попробуйте еще раз или обратитесь в поддержку.',
    });
  },
};

export default notificationService;
