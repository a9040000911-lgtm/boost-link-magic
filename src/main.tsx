import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NetworkProvider } from "./providers/NetworkProvider";
import { OfflineBanner } from "./components/OfflineBanner";
import { supabaseManager } from "./lib/supabaseClient";

// Инициализация Supabase клиента при старте приложения
supabaseManager.initialize({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  options: {
    debug: import.meta.env.DEV, // Логирование только в режиме разработки
    autoRefreshToken: true,     // Автоматическое обновление токена
    persistSession: true        // Сохранение сессии в localStorage
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <NetworkProvider>
      <OfflineBanner />
      <App />
    </NetworkProvider>
  </ErrorBoundary>
);
