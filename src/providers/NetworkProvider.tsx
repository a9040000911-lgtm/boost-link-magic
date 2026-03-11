import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isReconnecting: boolean;
  lastOfflineAt: Date | null;
  lastOnlineAt: Date | null;
}

interface NetworkProviderProps {
  children: ReactNode;
  onStatusChange?: (status: NetworkStatus) => void;
}

const NetworkContext = createContext<NetworkStatus | undefined>(undefined);

/**
 * Провайдер для отслеживания статуса сети.
 * Автоматически определяет потерю соединения и восстановление.
 */
export function NetworkProvider({ children, onStatusChange }: NetworkProviderProps) {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isReconnecting: false,
    lastOfflineAt: null,
    lastOnlineAt: null,
  });

  useEffect(() => {
    const handleOnline = () => {
      const now = new Date();
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        isReconnecting: false,
        lastOnlineAt: now,
      }));
      
      onStatusChange?.({
        isOnline: true,
        isReconnecting: false,
        lastOfflineAt: status.lastOfflineAt,
        lastOnlineAt: now,
      });
    };

    const handleOffline = () => {
      const now = new Date();
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isReconnecting: true,
        lastOfflineAt: now,
      }));
      
      onStatusChange?.({
        isOnline: false,
        isReconnecting: true,
        lastOfflineAt: now,
        lastOnlineAt: status.lastOnlineAt,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange]);

  return (
    <NetworkContext.Provider value={status}>
      {children}
    </NetworkContext.Provider>
  );
}

/**
 * Хук для получения статуса сети
 */
export function useNetworkStatus(): NetworkStatus {
  const context = useContext(NetworkContext);
  
  if (context === undefined) {
    throw new Error('useNetworkStatus must be used within a NetworkProvider');
  }
  
  return context;
}

/**
 * Хук для выполнения действий только когда есть соединение
 */
export function useWhenOnline(callback: () => void | Promise<void>) {
  const status = useNetworkStatus();
  const [queuedCallback, setQueuedCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (status.isOnline && queuedCallback) {
      queuedCallback();
      setQueuedCallback(null);
    } else if (!status.isOnline && callback) {
      // Сохраняем коллбек в очередь, если нет соединения
      setQueuedCallback(() => callback);
    } else if (status.isOnline && callback) {
      // Выполняем сразу, если есть соединение
      callback();
    }
  }, [status.isOnline, callback]);

  return {
    isOnline: status.isOnline,
    isReconnecting: status.isReconnecting,
  };
}

export default NetworkProvider;
