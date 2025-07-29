'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LayoutType = 'default' | 'sidebar' | 'grid';

export interface LayoutConfig {
  type: LayoutType;
  headerStyle: 'full' | 'compact' | 'minimal';
  navigationStyle: 'horizontal' | 'vertical' | 'tabs';
  contentLayout: 'single-column' | 'with-sidebar' | 'grid';
  sidebarPosition: 'none' | 'left' | 'right';
  customStyles?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  spacing: {
    container: string;
    section: string;
    component: string;
  };
  typography: {
    fontFamily: string;
    headingSize: string;
    bodySize: string;
  };
  animations: {
    enabled: boolean;
    duration: string;
    easing: string;
  };
}

export interface LayoutTheme {
  id: string;
  name: string;
  description?: string;
  type: LayoutType;
  config: LayoutConfig;
  isDefault: boolean;
  isActive: boolean;
}

interface LayoutContextType {
  currentLayout: LayoutType;
  layoutConfig: LayoutConfig | null;
  themeConfig: ThemeConfig | null;
  
  availableThemes: LayoutTheme[];
  
  isLoading: boolean;
  isUpdating: boolean;
  
  setLayout: (layoutType: LayoutType, projectId?: string) => Promise<void>;
  updateThemeConfig: (themeConfig: ThemeConfig, projectId?: string) => Promise<void>;
  loadProjectLayout: (projectId: string) => Promise<void>;
  loadAvailableThemes: () => Promise<void>;
  
  previewMode: boolean;
  previewLayout: LayoutType | null;
  enablePreview: (layoutType: LayoutType) => void;
  disablePreview: () => void;
  
  error: string | null;
  clearError: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const DEFAULT_LAYOUTS: Record<LayoutType, LayoutConfig> = {
  default: {
    type: 'default',
    headerStyle: 'full',
    navigationStyle: 'horizontal',
    contentLayout: 'single-column',
    sidebarPosition: 'none'
  },
  sidebar: {
    type: 'sidebar',
    headerStyle: 'compact',
    navigationStyle: 'vertical',
    contentLayout: 'with-sidebar',
    sidebarPosition: 'left'
  },
  grid: {
    type: 'grid',
    headerStyle: 'minimal',
    navigationStyle: 'tabs',
    contentLayout: 'grid',
    sidebarPosition: 'right'
  }
};

const FALLBACK_THEMES: LayoutTheme[] = [
  {
    id: 'default',
    name: 'Default Layout',
    description: 'Traditional top-down layout with horizontal navigation',
    type: 'default',
    config: DEFAULT_LAYOUTS.default,
    isDefault: true,
    isActive: true
  },
  {
    id: 'sidebar',
    name: 'Sidebar Layout',
    description: 'Modern layout with vertical sidebar navigation',
    type: 'sidebar',
    config: DEFAULT_LAYOUTS.sidebar,
    isDefault: false,
    isActive: true
  },
  {
    id: 'grid',
    name: 'Grid Layout',
    description: 'Card-based grid layout for content organization',
    type: 'grid',
    config: DEFAULT_LAYOUTS.grid,
    isDefault: false,
    isActive: true
  }
];

const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#000000',
    surface: '#0a0a0a',
    text: '#ffffff'
  },
  spacing: {
    container: '7xl',
    section: '12',
    component: '6'
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingSize: '2xl',
    bodySize: 'base'
  },
  animations: {
    enabled: true,
    duration: '300ms',
    easing: 'ease-in-out'
  }
};

interface LayoutProviderProps {
  children: ReactNode;
  initialLayout?: LayoutType;
  projectId?: string;
}

export function LayoutProvider({
  children,
  initialLayout = 'default',
  projectId
}: LayoutProviderProps) {
  const [currentLayout, setCurrentLayout] = useState<LayoutType>(initialLayout);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(DEFAULT_LAYOUTS[initialLayout]);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(DEFAULT_THEME);
  const [availableThemes, setAvailableThemes] = useState<LayoutTheme[]>(FALLBACK_THEMES);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [previewMode, setPreviewMode] = useState(false);
  const [previewLayout, setPreviewLayout] = useState<LayoutType | null>(null);

  const [themesLoaded, setThemesLoaded] = useState(false);
  const [projectLayoutLoaded, setProjectLayoutLoaded] = useState(false);

  useEffect(() => {
    if (!themesLoaded) {
      setThemesLoaded(true);
      loadAvailableThemes();
    }
  }, [themesLoaded]);

  useEffect(() => {
    if (projectId && !projectLayoutLoaded && !isLoading) {
      setProjectLayoutLoaded(true);
      loadProjectLayout(projectId);
    }
  }, [projectId, projectLayoutLoaded, isLoading]);

  const loadAvailableThemes = async () => {
    if (themesLoaded) return;
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects?action=layouts&subaction=themes`, {
        headers,
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        setAvailableThemes(result.data);
      }
    } catch (err) {
      console.warn('themes api failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectLayout = async (projectId: string) => {
    if (projectLayoutLoaded) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects?id=${projectId}&action=layouts&subaction=project`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        const { layoutConfig: layoutType, themeConfig: theme } = result.data;
        setCurrentLayout(layoutType as LayoutType);
        setLayoutConfig(DEFAULT_LAYOUTS[layoutType as LayoutType]);
        if (theme) {
          setThemeConfig(theme);
        }
      } else {
        console.warn('layout load failed:', result.error);
        setCurrentLayout('default');
        setLayoutConfig(DEFAULT_LAYOUTS.default);
      }
    } catch (err) {
      console.warn('layout error:', err);
      setCurrentLayout('default');
      setLayoutConfig(DEFAULT_LAYOUTS.default);
    } finally {
      setIsLoading(false);
    }
  };

  const setLayout = async (layoutType: LayoutType, projectId?: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      setCurrentLayout(layoutType);
      setLayoutConfig(DEFAULT_LAYOUTS[layoutType]);

      if (projectId) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects?id=${projectId}&action=layouts&subaction=update-project`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          credentials: 'include',
          body: JSON.stringify({
            layoutConfig: layoutType,
            themeConfig
          })
        });

        const result = await response.json();
        
        if (!result.success) {
          setCurrentLayout(currentLayout);
          setLayoutConfig(layoutConfig);
          setError(result.error || 'Failed to update layout');
          return;
        }
      }
    } catch (err) {
      setCurrentLayout(currentLayout);
      setLayoutConfig(layoutConfig);
      setError('Failed to update layout');
      console.error('Error updating layout:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateThemeConfig = async (newThemeConfig: ThemeConfig, projectId?: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      setThemeConfig(newThemeConfig);

      if (projectId) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects?id=${projectId}&action=layouts&subaction=update-project`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          credentials: 'include',
          body: JSON.stringify({
            layoutConfig: currentLayout,
            themeConfig: newThemeConfig
          })
        });

        const result = await response.json();
        
        if (!result.success) {
          setThemeConfig(themeConfig);
          setError(result.error || 'Failed to update theme');
          return;
        }
      }
    } catch (err) {
      setThemeConfig(themeConfig);
      setError('Failed to update theme');
      console.error('Error updating theme:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const enablePreview = (layoutType: LayoutType) => {
    setPreviewMode(true);
    setPreviewLayout(layoutType);
  };

  const disablePreview = () => {
    setPreviewMode(false);
    setPreviewLayout(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value: LayoutContextType = {
    currentLayout: previewMode ? (previewLayout || currentLayout) : currentLayout,
    layoutConfig: previewMode && previewLayout ? DEFAULT_LAYOUTS[previewLayout] : layoutConfig,
    themeConfig,
    availableThemes,
    isLoading,
    isUpdating,
    setLayout,
    updateThemeConfig,
    loadProjectLayout,
    loadAvailableThemes,
    previewMode,
    previewLayout,
    enablePreview,
    disablePreview,
    error,
    clearError
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

export function useLayoutClasses() {
  const { currentLayout, layoutConfig, themeConfig } = useLayout();

  const getContainerClasses = () => {
    const base = 'min-h-screen bg-black relative overflow-hidden';
    
    switch (currentLayout) {
      case 'sidebar':
        return `${base} flex`;
      case 'grid':
        return `${base} grid-layout`;
      default:
        return base;
    }
  };

  const getHeaderClasses = () => {
    if (!layoutConfig) return '';
    
    switch (layoutConfig.headerStyle) {
      case 'compact':
        return 'border-b border-white/10 bg-black/60 backdrop-blur-xl py-4';
      case 'minimal':
        return 'border-b border-white/5 bg-black/40 backdrop-blur-sm py-3';
      default:
        return 'border-b border-white/10 bg-black/40 backdrop-blur-2xl py-6';
    }
  };

  const getNavigationClasses = () => {
    if (!layoutConfig) return '';
    
    switch (layoutConfig.navigationStyle) {
      case 'vertical':
        return 'w-64 bg-black/60 backdrop-blur-xl border-r border-white/10 flex-shrink-0';
      case 'tabs':
        return 'border-b border-white/5 bg-black/20 backdrop-blur-sm';
      default:
        return 'border-b border-white/10 bg-black/20 backdrop-blur-xl';
    }
  };

  const getContentClasses = () => {
    if (!layoutConfig) return '';
    
    switch (layoutConfig.contentLayout) {
      case 'with-sidebar':
        return 'flex-1 overflow-hidden';
      case 'grid':
        return 'grid grid-cols-1 lg:grid-cols-3 gap-8 p-8';
      default:
        return 'max-w-7xl mx-auto px-8 py-12';
    }
  };

  return {
    container: getContainerClasses(),
    header: getHeaderClasses(),
    navigation: getNavigationClasses(),
    content: getContentClasses(),
    theme: themeConfig
  };
}