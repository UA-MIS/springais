import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useTheme, themeColors } from './ThemeContext';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  exiting?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    // Start exit animation after 2.7 seconds
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    }, 2700);

    // Remove from DOM after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const getToastStyle = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: '#22c55e',
          text: '#fff',
          icon: 'check'
        };
      case 'error':
        return {
          bg: '#dc2626',
          text: '#fff',
          icon: 'x'
        };
      case 'info':
        return {
          bg: colors.accent,
          text: '#2e2e38',
          icon: 'info'
        };
    }
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container - fixed position */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => {
          const style = getToastStyle(toast.type);
          return (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-lg font-medium flex items-center gap-2 pointer-events-auto ${
                toast.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
              }`}
              style={{
                backgroundColor: style.bg,
                color: style.text,
                minWidth: '200px',
              }}
            >
              {getIcon(toast.type)}
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
