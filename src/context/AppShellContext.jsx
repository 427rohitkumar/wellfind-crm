import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const AppShellContext = createContext(null);

const MOBILE_BREAKPOINT = 1024; // 64rem = 1024px

export function AppShellProvider({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const updateBreakpoints = useCallback(() => {
    const width = window.innerWidth;
    const mobile = width < MOBILE_BREAKPOINT;
    
    setIsMobile(mobile);
    
    if (!mobile) {
      setIsSidebarVisible(false);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      setIsSidebarVisible(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => !prev);
    }
  }, []);

  const setSidebarCollapsed = useCallback((collapsed) => {
    setIsSidebarCollapsed(collapsed);
  }, []);

  const setSidebarVisible = useCallback((visible) => {
    setIsSidebarVisible(visible);
  }, []);

  useEffect(() => {
    updateBreakpoints();
    window.addEventListener('resize', updateBreakpoints);
    return () => window.removeEventListener('resize', updateBreakpoints);
  }, [updateBreakpoints]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSidebarVisible) {
        setIsSidebarVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarVisible]);

  const value = {
    isSidebarCollapsed,
    isSidebarVisible,
    isMobile,
    toggleSidebar,
    setSidebarCollapsed,
    setSidebarVisible,
  };

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell must be used within an AppShellProvider');
  }
  return context;
}
