/**
 * Toast Hook - Simple Implementation
 * Provides toast notifications without conflicts
 */

import { useCallback } from 'react';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

// Simple console-based toast for now (can be enhanced later)
const showToast = (type: string, title: string, description?: string) => {
  
  // Create a simple visual notification
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
    type === 'success' ? 'bg-green-100 border-green-400 text-green-800' :
    type === 'error' ? 'bg-red-100 border-red-400 text-red-800' :
    'bg-blue-100 border-blue-400 text-blue-800'
  } border`;
  
  toast.innerHTML = `
    <div class="font-medium">${title}</div>
    ${description ? `<div class="text-sm mt-1">${description}</div>` : ''}
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 5000);
};

export function useToast() {
  const toast = useCallback((props: ToastProps) => {
    const type = props.variant === 'destructive' ? 'error' : 
                 props.variant === 'success' ? 'success' : 'info';
    showToast(type, props.title, props.description);
    
    return {
      id: Math.random().toString(36),
      dismiss: () => {},
      update: () => {}
    };
  }, []);

  return {
    toast: {
      success: (title: string, description?: string) => {
        showToast('success', title, description);
      },
      error: (title: string, description?: string) => {
        showToast('error', title, description);
      },
      info: (title: string, description?: string) => {
        showToast('info', title, description);
      }
    }
  };
}

export { type ToastProps as Toast };