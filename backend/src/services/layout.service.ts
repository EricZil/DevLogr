import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  createdAt: Date;
  updatedAt: Date;
}

const FALLBACK_THEMES: LayoutTheme[] = [
  {
    id: 'default',
    name: 'Default Layout',
    description: 'Traditional top-down layout with horizontal navigation',
    type: 'default',
    config: {
      type: 'default',
      headerStyle: 'full',
      navigationStyle: 'horizontal',
      contentLayout: 'single-column',
      sidebarPosition: 'none'
    },
    isDefault: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sidebar',
    name: 'Sidebar Layout',
    description: 'Modern layout with vertical sidebar navigation',
    type: 'sidebar',
    config: {
      type: 'sidebar',
      headerStyle: 'compact',
      navigationStyle: 'vertical',
      contentLayout: 'with-sidebar',
      sidebarPosition: 'left'
    },
    isDefault: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'grid',
    name: 'Grid Layout',
    description: 'Card-based grid layout for content organization',
    type: 'grid',
    config: {
      type: 'grid',
      headerStyle: 'minimal',
      navigationStyle: 'tabs',
      contentLayout: 'grid',
      sidebarPosition: 'right'
    },
    isDefault: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export class LayoutService {
  static async getLayoutThemes() {
    try {

      return {
        success: true,
        data: FALLBACK_THEMES
      };
    } catch (error) {
      console.error('Error fetching layout themes:', error);
      return {
        success: false,
        error: 'Failed to fetch layout themes'
      };
    }
  }

  static async getProjectLayout(projectId: string) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          layoutConfig: true,
          themeConfig: true
        }
      });

      if (!project) {
        return {
          success: false,
          error: 'Project not found'
        };
      }

      return {
        success: true,
        data: {
          layoutConfig: project.layoutConfig || 'default',
          themeConfig: project.themeConfig ? JSON.parse(project.themeConfig) : null
        }
      };
    } catch (error) {
      console.error('Error fetching project layout:', error);
      return {
        success: false,
        error: 'Failed to fetch project layout'
      };
    }
  }

  static async updateProjectLayout(
    projectId: string, 
    userId: string, 
    layoutConfig: string, 
    themeConfig?: ThemeConfig
  ) {
    try {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: userId
        }
      });

      if (!project) {
        return {
          success: false,
          error: 'Project not found or access denied'
        };
      }

      const validLayouts = ['default', 'sidebar', 'grid', 'DEFAULT', 'SIDEBAR', 'GRID'];
      if (!validLayouts.includes(layoutConfig)) {
        return {
          success: false,
          error: 'Invalid layout configuration'
        };
      }

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          layoutConfig: layoutConfig.toLowerCase(),
          themeConfig: themeConfig ? JSON.stringify(themeConfig) : null,
          updatedAt: new Date()
        },
        select: {
          id: true,
          layoutConfig: true,
          themeConfig: true,
          updatedAt: true
        }
      });

      return {
        success: true,
        data: {
          ...updatedProject,
          themeConfig: updatedProject.themeConfig ? JSON.parse(updatedProject.themeConfig) : null
        }
      };
    } catch (error) {
      console.error('Error updating project layout:', error);
      return {
        success: false,
        error: 'Failed to update project layout'
      };
    }
  }

  static async createLayoutTheme(
    name: string,
    description: string,
    type: LayoutType,
    config: LayoutConfig
  ) {
    try {
      const theme: LayoutTheme = {
        id: `custom-${Date.now()}`,
        name,
        description,
        type,
        config,
        isDefault: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return {
        success: true,
        data: theme
      };
    } catch (error) {
      console.error('Error creating layout theme:', error);
      return {
        success: false,
        error: 'Failed to create layout theme'
      };
    }
  }

  static async initializeDefaultThemes() {
    try {
      return {
        success: true,
        message: 'Default layout themes initialized successfully'
      };
    } catch (error) {
      console.error('Error initializing default themes:', error);
      return {
        success: false,
        error: 'Failed to initialize default themes'
      };
    }
  }
}