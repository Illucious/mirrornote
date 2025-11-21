import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const AUTH_URL = 'https://auth.emergentagent.com';
const SESSION_TOKEN_KEY = '@session_token';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  isPremium: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  updatePremiumStatus: (isPremium: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Set up axios interceptor to add Authorization header
axios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    console.log('[AuthContext] Interceptor - Token from storage:', token ? 'Found' : 'Not found');
    if (token) {
      // Ensure headers object exists
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[AuthContext] Interceptor - Added Authorization header to request:', config.url);
    } else {
      console.log('[AuthContext] Interceptor - No token, skipping Authorization header for:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('[AuthContext] Interceptor error:', error);
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const processingRef = useRef<string | null>(null); // Track which session_id is being processed
  const processingLockRef = useRef(false); // Lock to prevent concurrent processing

  useEffect(() => {
    initializeAuth();
    
    // Listen for deep links (returning from Google auth)
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => subscription.remove();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check for session_id in URL (coming back from Google auth)
      const url = await Linking.getInitialURL();
      console.log('[AuthContext] Initial URL:', url);
      
      if (url) {
        const sessionId = extractSessionId(url);
        
        if (sessionId) {
          console.log('[AuthContext] Found session_id in initial URL, processing...');
          await processSessionId(sessionId);
          return;
        } else {
          console.log('[AuthContext] No session_id found in initial URL');
        }
      }
      
      // Check existing session
      await checkSession();
    } catch (error) {
      console.error('[AuthContext] Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepLink = async ({ url }: { url: string }) => {
    console.log('[AuthContext] Deep link received:', url);
    const sessionId = extractSessionId(url);
    
    if (sessionId) {
      // Prevent duplicate processing - check if already processing this session_id
      if (processingRef.current === sessionId || processingLockRef.current) {
        console.log('[AuthContext] Already processing this session_id, skipping duplicate call');
        return;
      }
      
      console.log('[AuthContext] Found session_id in deep link, processing...');
      await processSessionId(sessionId);
    } else {
      console.log('[AuthContext] No session_id in deep link');
    }
  };
  
  const extractSessionId = (url: string): string | null => {
    // Check hash fragment first (e.g., #session_id=xxx)
    const hashMatch = url.match(/#.*session_id=([^&]+)/);
    if (hashMatch) {
      console.log('[AuthContext] Extracted session_id from hash fragment');
      return hashMatch[1];
    }
    
    // Check query params (e.g., ?session_id=xxx)
    const { queryParams } = Linking.parse(url);
    console.log('[AuthContext] Parsed query params:', JSON.stringify(queryParams));
    
    if (queryParams?.session_id) {
      console.log('[AuthContext] Extracted session_id from query params');
      return queryParams.session_id as string;
    }
    
    return null;
  };

  const processSessionId = async (sessionId: string) => {
    // Prevent concurrent processing of the same session_id
    if (processingLockRef.current) {
      console.log('[AuthContext] Already processing a session, skipping duplicate call');
      return;
    }
    
    if (processingRef.current === sessionId) {
      console.log('[AuthContext] Already processing this exact session_id, skipping');
      return;
    }
    
    // Set lock and track session_id
    processingLockRef.current = true;
    processingRef.current = sessionId;
    
    try {
      console.log('[AuthContext] Processing session_id:', sessionId);
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/session`,
        { session_id: sessionId }
      );
      
      console.log('[AuthContext] Session response received:', {
        hasSessionToken: !!response.data.session_token,
        userData: response.data.email
      });
      
      // Store session token
      if (response.data.session_token) {
        await AsyncStorage.setItem(SESSION_TOKEN_KEY, response.data.session_token);
        console.log('[AuthContext] Session token stored in AsyncStorage');
        
        // Verify it was stored correctly
        const storedToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
        console.log('[AuthContext] Token verification - stored successfully:', !!storedToken);
      }
      
      // Remove session_token from user object before storing
      const { session_token, ...userData } = response.data;
      setUser(userData);
      console.log('[AuthContext] User state updated:', userData.email);
    } catch (error) {
      console.error('[AuthContext] Session processing error:', error);
      await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
    } finally {
      // Release lock
      processingLockRef.current = false;
      processingRef.current = null;
    }
  };

  const checkSession = async () => {
    try {
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      console.log('[AuthContext] Checking session - Token:', token ? 'Found' : 'Not found');
      
      if (!token) {
        setUser(null);
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/auth/me`);
      setUser(response.data);
      console.log('[AuthContext] Session valid, user:', response.data.email);
    } catch (error) {
      // No valid session - clear token
      console.error('[AuthContext] Session check error:', error);
      await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
    }
  };

  const loginWithGoogle = () => {
    // Redirect URL is your app's main route (dashboard)
    const redirectUrl = Linking.createURL('/dashboard');
    console.log('[AuthContext] Redirect URL for auth:', redirectUrl);
    
    const authUrl = `${AUTH_URL}/?redirect=${encodeURIComponent(redirectUrl)}`;
    console.log('[AuthContext] Opening auth URL:', authUrl);
    
    // Open auth URL in browser
    Linking.openURL(authUrl);
  };

  const logout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`);
      await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear token even if request fails
      await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
    }
  };

  const updatePremiumStatus = (isPremium: boolean) => {
    if (user) {
      setUser({ ...user, isPremium });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updatePremiumStatus }}>
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

// Default export to prevent Expo Router from treating this module as a route
export default function AuthContextRoute() {
  return null;
}
