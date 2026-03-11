import { useState, useEffect, useCallback } from 'react';

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number; // в миллисекундах
  onRetry?: (attempt: number, error: Error) => void;
  onError?: (error: Error, isFinal: boolean) => void;
}

interface UseRetryResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isRetrying: boolean;
  attempt: number;
  execute: () => Promise<void>;
  reset: () => void;
}

/**
 * Хук для автоматического повторения неудачных запросов с экспоненциальной задержкой.
 * Улучшает стабильность при временных проблемах сети или сервера.
 */
export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: UseRetryOptions = {}
): UseRetryResult<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [attempt, setAttempt] = useState<number>(0);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    let lastError: Error | null = null;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await asyncFunction();
        setData(result);
        setError(null);
        setAttempt(i);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        
        if (i < maxRetries) {
          // Экспоненциальная задержка: 1s, 2s, 4s...
          const delay = retryDelay * Math.pow(2, i);
          
          setIsRetrying(true);
          setAttempt(i + 1);
          
          onRetry?.(i + 1, lastError);
          
          // Ждем перед следующей попыткой
          await new Promise(resolve => setTimeout(resolve, delay));
          setIsRetrying(false);
        } else {
          // Максимальное количество попыток исчерпано
          setError(lastError);
          onError?.(lastError, true);
        }
      }
    }

    setIsLoading(false);
  }, [asyncFunction, maxRetries, retryDelay, onRetry, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsRetrying(false);
    setAttempt(0);
  }, []);

  // Автоматический запуск при монтировании (опционально можно убрать)
  useEffect(() => {
    execute();
  }, []);

  return {
    data,
    error,
    isLoading,
    isRetrying,
    attempt,
    execute,
    reset,
  };
}

export default useRetry;
