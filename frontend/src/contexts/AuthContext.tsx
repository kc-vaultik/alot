import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Auth context type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  sendMagicLink: (email: string, redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isInitialLoad = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only synchronous state updates here - no async calls
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setError(null);
        
        // Handle redirect after successful sign in from magic link ONLY
        // Only redirect if there's a stored redirect (indicating active magic link flow)
        const storedRedirect = localStorage.getItem('auth_redirect_to');
        if (event === 'SIGNED_IN' && session && storedRedirect && !isInitialLoad) {
          const targetPath = storedRedirect;
          
          // Clean up immediately
          localStorage.removeItem('auth_redirect_to');
          
          // Only redirect if not already on the target path
          if (window.location.pathname !== targetPath) {
            // Use history.pushState for soft navigation without full reload
            window.history.pushState({}, '', targetPath);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error('Error getting session:', error);
        setError(error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Mark initial load complete after session check
      isInitialLoad = false;
    });

    return () => subscription.unsubscribe();
  }, []);

  // Send magic link
  const sendMagicLink = useCallback(async (email: string, redirectTo?: string) => {
    setError(null);
    
    // Store intended destination in localStorage (Supabase only allows base URL redirect)
    // Default to /collect-room after login
    const targetPath = redirectTo || '/collect-room';
    localStorage.setItem('auth_redirect_to', targetPath);
    
    // Redirect to base URL - we'll handle the path redirect after auth
    const redirectUrl = window.location.origin;
    
    logger.debug('Sending magic link, will redirect to:', targetPath);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Logout function - redirects to landing page
  const logout = useCallback(async () => {
    setError(null);
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error('Logout error:', error);
      setError(error.message);
      throw error;
    }
    
    setUser(null);
    setSession(null);
    
    // Redirect to landing page after logout
    window.location.href = '/';
  }, []);

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    sendMagicLink,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
