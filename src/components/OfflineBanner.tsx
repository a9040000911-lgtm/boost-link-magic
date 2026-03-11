import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/providers/NetworkProvider';

/**
 * Компонент-индикатор потери соединения.
 * Показывается автоматически, когда браузер обнаруживает потерю сети.
 */
export function OfflineBanner() {
  const { isOnline, isReconnecting } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 dark:bg-amber-600 text-white px-4 py-2 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm font-medium">
        <WifiOff className="h-4 w-4" />
        <span>
          {isReconnecting 
            ? 'Потеряно соединение. Попытка восстановления...' 
            : 'Нет подключения к интернету'}
        </span>
        {isReconnecting && (
          <RefreshCw className="h-3 w-3 animate-spin ml-2" />
        )}
      </div>
    </div>
  );
}

/**
 * Компонент-заглушка для отображения вместо контента при отсутствии сети.
 */
export function OfflineFallback({ 
  message = 'Нет подключения к интернету',
  retryLabel = 'Попробовать снова',
  onRetry,
}: {
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  const { isOnline, isReconnecting } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full mb-4">
        <WifiOff className="h-12 w-12 text-amber-600 dark:text-amber-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {message}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        Проверьте ваше подключение к интернету и попробуйте еще раз.
        {isReconnecting && ' Мы автоматически попробуем восстановить соединение.'}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isReconnecting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export default OfflineBanner;
