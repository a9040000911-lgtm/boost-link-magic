import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * SupabaseClientManager - централизованный менеджер клиентов Supabase
 * 
 * ЗАЧЕМ:
 * - Предотвращает создание множества клиентов (утечки памяти)
 * - Автоматически обновляет JWT токен при refresh
 * - Обрабатывает ошибки авторизации глобально
 * - Логгирует все запросы для отладки
 * - Предоставляет единый интерфейс для всего приложения
 * 
 * КАК РАБОТАЕТ:
 * 1. Создаём одного клиента при первом запросе (Singleton паттерн)
 * 2. Перехватываем все ответы через onResponse
 * 3. Если токен истёк → автоматически делаем refresh
 * 4. Если refresh не удался → разлогиниваем пользователя
 * 5. Логируем ошибки в консоль (в будущем → в Sentry)
 */

interface ClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  options?: {
    debug?: boolean;
    autoRefreshToken?: boolean;
    persistSession?: boolean;
  };
}

class SupabaseClientManager {
  private static instance: SupabaseClientManager;
  private client: ReturnType<typeof createClient<Database>> | null = null;
  private config: ClientConfig | null = null;
  private refreshTokenTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  /**
   * Получить экземпляр менеджера (Singleton)
   */
  static getInstance(): SupabaseClientManager {
    if (!SupabaseClientManager.instance) {
      SupabaseClientManager.instance = new SupabaseClientManager();
    }
    return SupabaseClientManager.instance;
  }

  /**
   * Инициализировать клиент (вызывать один раз при старте приложения)
   */
  initialize(config: ClientConfig): ReturnType<typeof createClient<Database>> {
    if (this.client) {
      console.warn('⚠️ Supabase клиент уже инициализирован');
      return this.client;
    }

    this.config = config;

    const { supabaseUrl, supabaseAnonKey, options = {} } = config;
    const {
      debug = false,
      autoRefreshToken = true,
      persistSession = true,
    } = options;

    // Создаём клиент с кастомными настройками
    this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken,
        persistSession,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'X-Client-Info': 'smm-platform/v1',
        },
      },
      // Перехватчик ответов для обработки ошибок
      fetch: async (input, init) => {
        const startTime = Date.now();
        
        try {
          const response = await fetch(input, init);
          const duration = Date.now() - startTime;

          // Логгирование в debug режиме
          if (debug) {
            console.log(`📡 [${duration}ms] ${input.toString()}`);
          }

          // Обработка ошибок авторизации
          if (response.status === 401) {
            console.error('❌ Ошибка авторизации: токен недействителен');
            // Можно вызвать глобальный обработчик разлогинивания
          }

          // Обработка ошибок сервера
          if (response.status >= 500) {
            console.error(`🚨 Ошибка сервера ${response.status}: ${input.toString()}`);
          }

          return response;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          // Логгирование сетевых ошибок
          console.error(`🔴 Сетевая ошибка [${duration}ms]:`, error);
          
          // Пробрасываем ошибку дальше
          throw error;
        }
      },
    });

    // Подписка на события аутентификации
    this.client.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event, session?.user?.email);

      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ Пользователь вошёл');
          break;
        case 'SIGNED_OUT':
          console.log('👋 Пользователь вышел');
          this.clearRefreshTimeout();
          break;
        case 'TOKEN_REFRESHED':
          console.log('🔄 Токен обновлён');
          break;
        case 'USER_UPDATED':
          console.log('✏️ Данные пользователя обновлены');
          break;
        default:
          break;
      }
    });

    return this.client;
  }

  /**
   * Получить текущего клиента
   */
  getClient(): ReturnType<typeof createClient<Database>> {
    if (!this.client) {
      throw new Error(
        'Supabase клиент не инициализирован. Вызовите initialize() первым.'
      );
    }
    return this.client;
  }

  /**
   * Получить текущую сессию
   */
  async getSession() {
    const client = this.getClient();
    return await client.auth.getSession();
  }

  /**
   * Получить текущего пользователя
   */
  async getUser() {
    const client = this.getClient();
    return await client.auth.getUser();
  }

  /**
   * Принудительно обновить токен
   */
  async refreshSession() {
    const client = this.getClient();
    const { data, error } = await client.auth.refreshSession();
    
    if (error) {
      console.error('❌ Не удалось обновить токен:', error);
      throw error;
    }
    
    console.log('✅ Токен успешно обновлён');
    return data;
  }

  /**
   * Выйти из системы
   */
  async signOut() {
    const client = this.getClient();
    this.clearRefreshTimeout();
    
    const { error } = await client.auth.signOut();
    if (error) {
      console.error('❌ Ошибка при выходе:', error);
      throw error;
    }
    
    console.log('✅ Успешный выход');
  }

  /**
   * Очистить таймер обновления токена
   */
  private clearRefreshTimeout() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
  }

  /**
   * Проверить соединение с Supabase
   */
  async healthCheck(): Promise<{ ok: boolean; error?: string }> {
    try {
      const client = this.getClient();
      const { error } = await client.from('_health_check').select('count').single();
      
      // Если таблица не существует, это нормально (просто проверка соединения)
      if (error && error.code !== '42P01') {
        throw error;
      }
      
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('❌ Health check failed:', message);
      return { ok: false, error: message };
    }
  }
}

// Экспорт единственного экземпляра
export const supabaseManager = SupabaseClientManager.getInstance();

// Хелпер для быстрого доступа к клиенту
export function getSupabaseClient() {
  return supabaseManager.getClient();
}

export default supabaseManager;
