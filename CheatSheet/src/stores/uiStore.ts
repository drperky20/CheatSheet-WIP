import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Theme and appearance
  theme: 'dark' | 'light';
  
  // Dashboard preferences
  sidebarCollapsed: boolean;
  dashboardLayout: 'grid' | 'list';
  
  // Mission workspace preferences
  workspaceLayout: 'split' | 'browser' | 'document';
  browserVisible: boolean;
  documentEditable: boolean;
  
  // Chat preferences
  chatExpanded: boolean;
  chatPosition: 'bottom' | 'side';
  
  // Notifications
  notifications: UINotification[];
  notificationSettings: {
    enableSound: boolean;
    enableDesktop: boolean;
    enableInApp: boolean;
  };
  
  // Actions
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  setDashboardLayout: (layout: 'grid' | 'list') => void;
  setWorkspaceLayout: (layout: 'split' | 'browser' | 'document') => void;
  setBrowserVisible: (visible: boolean) => void;
  setDocumentEditable: (editable: boolean) => void;
  toggleChat: () => void;
  setChatPosition: (position: 'bottom' | 'side') => void;
  addNotification: (notification: Omit<UINotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  updateNotificationSettings: (settings: Partial<UIState['notificationSettings']>) => void;
}

interface UINotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: number;
  duration?: number; // Auto-dismiss after this many ms
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Default values
      theme: 'dark',
      sidebarCollapsed: false,
      dashboardLayout: 'grid',
      workspaceLayout: 'split',
      browserVisible: true,
      documentEditable: false,
      chatExpanded: false,
      chatPosition: 'bottom',
      notifications: [],
      notificationSettings: {
        enableSound: true,
        enableDesktop: true,
        enableInApp: true
      },
      
      // Actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
      },
      
      toggleSidebar: () => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      
      setDashboardLayout: (layout) => {
        set({ dashboardLayout: layout });
      },
      
      setWorkspaceLayout: (layout) => {
        set({ workspaceLayout: layout });
      },
      
      setBrowserVisible: (visible) => {
        set({ browserVisible: visible });
      },
      
      setDocumentEditable: (editable) => {
        set({ documentEditable: editable });
      },
      
      toggleChat: () => {
        set(state => ({ chatExpanded: !state.chatExpanded }));
      },
      
      setChatPosition: (position) => {
        set({ chatPosition: position });
      },
      
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        const timestamp = Date.now();
        
        const newNotification: UINotification = {
          id,
          timestamp,
          duration: 5000, // Default 5 seconds
          ...notification
        };
        
        set(state => ({
          notifications: [...state.notifications, newNotification]
        }));
        
        // Auto-dismiss if duration is set
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }
        
        // Show desktop notification if enabled
        const { notificationSettings } = get();
        if (notificationSettings.enableDesktop && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico'
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: '/favicon.ico'
                });
              }
            });
          }
        }
        
        // Play sound if enabled
        if (notificationSettings.enableSound) {
          // You could implement sound notifications here
          console.log('🔔 Notification sound would play here');
        }
      },
      
      removeNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
      },
      
      updateNotificationSettings: (settings) => {
        set(state => ({
          notificationSettings: {
            ...state.notificationSettings,
            ...settings
          }
        }));
      }
    }),
    {
      name: 'ui-preferences',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        dashboardLayout: state.dashboardLayout,
        workspaceLayout: state.workspaceLayout,
        browserVisible: state.browserVisible,
        chatPosition: state.chatPosition,
        notificationSettings: state.notificationSettings
      })
    }
  )
);

// Initialize theme on app load
if (typeof window !== 'undefined') {
  const theme = useUIStore.getState().theme;
  document.documentElement.setAttribute('data-theme', theme);
}

// Notification helpers
export const showNotification = (notification: Omit<UINotification, 'id' | 'timestamp'>) => {
  useUIStore.getState().addNotification(notification);
};

export const showSuccessNotification = (title: string, message?: string) => {
  showNotification({
    type: 'success',
    title,
    message
  });
};

export const showErrorNotification = (title: string, message?: string) => {
  showNotification({
    type: 'error',
    title,
    message,
    duration: 8000 // Errors stay longer
  });
};

export const showInfoNotification = (title: string, message?: string) => {
  showNotification({
    type: 'info',
    title,
    message
  });
};

export const showWarningNotification = (title: string, message?: string) => {
  showNotification({
    type: 'warning',
    title,
    message
  });
};