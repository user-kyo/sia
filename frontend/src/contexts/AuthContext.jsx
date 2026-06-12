import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/react-query';
import api from '../lib/axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState(null);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setUserRole(session?.user?.user_metadata?.role || 'staff');
      setCompanyId(session?.user?.user_metadata?.company_id || null);
      setCompanyName(session?.user?.user_metadata?.company_name || null);

      if (session?.user) {
        // Fetch real status from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', session.user.id)
          .single();
        
        setUserStatus(profile?.status || session?.user?.user_metadata?.status || 'approved');
      } else {
        setUserStatus(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      setSession(session);
      setUser(session?.user ?? null);
      setUserRole(session?.user?.user_metadata?.role || 'staff');
      setCompanyId(session?.user?.user_metadata?.company_id || null);
      setCompanyName(session?.user?.user_metadata?.company_name || null);

      if (session?.user) {
        // Fetch real status from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', session.user.id)
          .single();
        
        setUserStatus(profile?.status || session?.user?.user_metadata?.status || 'approved');
      } else {
        setUserStatus(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch company name if missing from metadata but we have companyId
  useEffect(() => {
    if (companyId && !companyName) {
      api.get('/companies').then(({ data }) => {
        const comp = data?.find(c => c.id === companyId);
        if (comp) setCompanyName(comp.name);
      }).catch(err => {
        console.error('Failed to fetch company name:', err);
      });
    }
  }, [companyId, companyName]);

  const signOut = async () => {
    // Clear the entire React Query cache to prevent data leakage between accounts
    queryClient.clear();
    
    // Wipe sensitive company/user-specific settings from local storage
    localStorage.removeItem('sia_app_settings');
    localStorage.removeItem('sia_currency');
    localStorage.removeItem('sia_dismissed_notifications');

    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, userStatus, companyId, companyName, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
