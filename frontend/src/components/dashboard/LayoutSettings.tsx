'use client';

import React, { useState, useEffect } from 'react';
import { useLayout, LayoutType, LayoutTheme } from '@/contexts/LayoutContext';
import LayoutPreview from './LayoutPreview';
import { ProjectData } from '@/types';

interface LayoutSettingsProps {
  projectId: string;
  projectData?: ProjectData;
  onClose?: () => void;
}

export default function LayoutSettings({ projectId, projectData, onClose }: LayoutSettingsProps) {
  const {
    currentLayout,
    availableThemes,
    isLoading,
    isUpdating,
    error,
    setLayout,
    loadAvailableThemes,
    enablePreview,
    disablePreview,
    previewMode,
    clearError
  } = useLayout();

  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(currentLayout);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    console.log('LayoutSettings: Loading available themes...');
    loadAvailableThemes();
  }, []);

  useEffect(() => {
    console.log('LayoutSettings: availableThemes updated:', availableThemes);
  }, [availableThemes]);

  useEffect(() => {
    console.log('LayoutSettings: currentLayout updated:', currentLayout);
  }, [currentLayout]);

  useEffect(() => {
    setSelectedLayout(currentLayout);
  }, [currentLayout]);

  const handleLayoutChange = (layoutType: LayoutType) => {
    setSelectedLayout(layoutType);
    if (showPreview) {
      enablePreview(layoutType);
    }
  };

  const handlePreviewToggle = () => {
    if (showPreview) {
      setShowPreview(false);
      disablePreview();
    } else {
      setShowPreview(true);
      enablePreview(selectedLayout);
    }
  };

  const handleSaveLayout = async () => {
    try {
      await setLayout(selectedLayout, projectId);
      if (showPreview) {
        disablePreview();
        setShowPreview(false);
      }
      if (onClose) onClose();
    } catch (err) {
      console.error('Failed to save layout:', err);
    }
  };

  const handleCancel = () => {
    setSelectedLayout(currentLayout);
    if (showPreview) {
      disablePreview();
      setShowPreview(false);
    }
    if (onClose) onClose();
  };

  const getLayoutPreview = (theme: LayoutTheme) => {
    switch (theme.type) {
      case 'sidebar':
        return (
          <div className="w-full h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg overflow-hidden border border-zinc-700">
            <div className="flex h-full">
              <div className="w-6 bg-blue-500/20 border-r border-blue-500/30"></div>
              <div className="flex-1 p-2">
                <div className="w-full h-2 bg-zinc-700 rounded mb-1"></div>
                <div className="w-3/4 h-2 bg-zinc-700 rounded mb-1"></div>
                <div className="w-1/2 h-2 bg-zinc-700 rounded"></div>
              </div>
            </div>
          </div>
        );
      case 'grid':
        return (
          <div className="w-full h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg overflow-hidden border border-zinc-700">
            <div className="p-2">
              <div className="grid grid-cols-3 gap-1 mb-2">
                <div className="h-3 bg-purple-500/20 rounded border border-purple-500/30"></div>
                <div className="h-3 bg-zinc-700 rounded"></div>
                <div className="h-3 bg-zinc-700 rounded"></div>
              </div>
              <div className="w-full h-8 bg-zinc-700 rounded"></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg overflow-hidden border border-zinc-700">
            <div className="p-2">
              <div className="w-full h-3 bg-emerald-500/20 rounded mb-2 border border-emerald-500/30"></div>
              <div className="w-full h-2 bg-zinc-700 rounded mb-1"></div>
              <div className="w-3/4 h-2 bg-zinc-700 rounded mb-1"></div>
              <div className="w-1/2 h-2 bg-zinc-700 rounded"></div>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Layout Settings</h2>
          <p className="text-zinc-400">Choose how your project page is displayed to visitors</p>
        </div>
        
        {previewMode && (
          <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm font-medium">Preview Active</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 text-sm">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {availableThemes.length === 0 && !isLoading && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-yellow-400 text-sm">No layout themes available. Check console for errors.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {availableThemes.length > 0 ? availableThemes.map((theme) => (
          <div
            key={theme.id}
            className={`relative p-6 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 ${
              selectedLayout === theme.type
                ? 'bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border-blue-500/30 shadow-lg shadow-blue-500/10'
                : 'bg-black/30 border-white/10 hover:border-white/20'
            }`}
            onClick={() => handleLayoutChange(theme.type)}
          >
            {selectedLayout === theme.type && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

            <div className="mb-4">
              {getLayoutPreview(theme)}
            </div>

            <h3 className={`text-lg font-semibold mb-2 ${
              selectedLayout === theme.type ? 'text-white' : 'text-zinc-200'
            }`}>
              {theme.name}
            </h3>

            <p className={`text-sm ${
              selectedLayout === theme.type ? 'text-zinc-300' : 'text-zinc-400'
            }`}>
              {theme.description}
            </p>

            {theme.isDefault && (
              <div className="mt-3">
                <span className="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
                  Default
                </span>
              </div>
            )}
          </div>
        )) : (
          <div className="col-span-full text-center py-8">
            <p className="text-zinc-400">No layout themes available</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-8 p-4 bg-black/30 rounded-lg border border-white/10">
        <div>
          <h4 className="text-white font-medium mb-1">Live Preview</h4>
          <p className="text-zinc-400 text-sm">See how your layout changes will look before saving</p>
        </div>
        <button
          onClick={handlePreviewToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            showPreview ? 'bg-blue-500' : 'bg-zinc-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              showPreview ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-end space-x-4">
        <button
          onClick={handleCancel}
          className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
          disabled={isUpdating}
        >
          Cancel
        </button>
        
        <button
          onClick={handleSaveLayout}
          disabled={isUpdating || selectedLayout === currentLayout}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
            isUpdating || selectedLayout === currentLayout
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transform hover:scale-105'
          }`}
        >
          {isUpdating ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Save Layout'
          )}
        </button>
      </div>

      {projectData && (showPreview || previewMode) && (
        <div className="mt-8 bg-gradient-to-br from-black/40 via-zinc-900/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <LayoutPreview projectData={projectData} />
        </div>
      )}
    </div>
  );
}