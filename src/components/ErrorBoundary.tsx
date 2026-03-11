import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Глобальный обработчик ошибок для всего приложения.
 * Перехватывает ошибки рендеринга и предотвращает "падение" всего приложения.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Обновляем состояние, чтобы показать fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логируем ошибку в консоль (в будущем можно отправлять в Sentry)
    console.error('❌ [ErrorBoundary] Uncaught error:', error, errorInfo);
    
    // Сохраняем информацию об ошибке для отображения пользователю
    this.setState({ error, errorInfo });

    // TODO: Отправить ошибку в сервис мониторинга (Sentry/LogRocket)
    // if (process.env.NODE_ENV === 'production') {
    //   sendToMonitoringService(error, errorInfo);
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Показываем кастомный UI ошибки вместо упавшего компонента
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Упс! Что-то пошло не так
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Произошла непредвиденная ошибка. Не волнуйтесь, мы уже работаем над этим.
            </p>

            {/* Детали ошибки только в разработке */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-md text-left overflow-auto max-h-48">
                <code className="text-xs text-red-600 dark:text-red-400">
                  {this.state.error.toString()}
                  <br /><br />
                  {this.state.errorInfo?.componentStack}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Попробовать снова
              </Button>
              
              <Button
                onClick={this.handleReload}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                На главную
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
