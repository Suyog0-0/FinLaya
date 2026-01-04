
'use client'; 

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User, AuthError } from '@supabase/supabase-js'; // User type

interface AuthContextType {
  user: User | null; // Current user or null
  loading: boolean; // If checking auth

  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>; // Sign up
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>; // Sign in
  signOut: () => Promise<void>; // Sign out
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // User state
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    // When app starts, check if user already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes (login, logout, session expired)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Clean up 
    return () => subscription.unsubscribe();
  }, []);


  // Sign up user
  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name, // stored as meta data 
        },
      },
    });
    return { error };
  };

  // Sign in user
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // Sign out user
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}