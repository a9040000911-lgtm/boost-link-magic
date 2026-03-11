import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
 * ErrorBoundary - компонент для перехвата ошибок в React-дереве
 * 
 * ЗАЧЕМ:
 * - Предотвращает полный краш приложения при ошибке в одном компоненте
 * - Показывает пользователю понятное сообщение вместо белого экрана
 * - Логгирует ошибку для последующего анализа
 * - Даёт возможность пользователю попробовать снова
 * 
 * КАК РАБОТАЕТ:
 * 1. Если в дочерних компонентах происходит ошибка → срабатывает componentDidCatch
 * 2. Сохраняем ошибку и информацию о ней в state
 * 3. Рендерим fallback UI (карточку с ошибкой)
 * 4. Пользователь может нажать "Попробовать снова" или "На главную"
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
    // Обновляем state чтобы показать fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логируем ошибку (в будущем можно отправлять в Sentry)
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    // TODO: Отправить в мониторинг ошибок (Sentry, LogRocket)
    // if (process.env.NODE_ENV === 'production') {
    //   await sendToMonitoringService(error, errorInfo);
    // }

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Показываем кастомный fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Что-то пошло не так
              </CardTitle>
              <CardDescription className="text-gray-600">
                Произошла непредвиденная ошибка. Не волнуйтесь, мы уже работаем над этим.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  <p className="font-medium text-gray-700 mb-1">Детали ошибки:</p>
                  <p className="text-gray-600 break-all">{this.state.error.message}</p>
                </div>
              )}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Техническая информация (для разработчиков)
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-gray-700">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={this.handleRetry}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Попробовать снова
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="flex-1"
                variant="outline"
              >
                <Home className="w-4 h-4 mr-2" />
                На главную
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
