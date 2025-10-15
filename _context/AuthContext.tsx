import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '../constants/defaultData';

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default user for demo purposes
const DEFAULT_USER: User = {
  id: 'user_001',
  email: 'demo@smarthome.com',
  name: 'Demo User',
  createdAt: new Date().toISOString(),
};

const USERS_STORAGE_KEY = '@smart_home_users';
const CURRENT_USER_KEY = '@smart_home_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize users data in AsyncStorage (for demo purposes)
  const initializeUsers = async () => {
    try {
      const existingUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (!existingUsers) {
        // Create default user
        const users = {
          [DEFAULT_USER.email]: {
            ...DEFAULT_USER,
            password: 'demo123', // In a real app, this would be hashed
          },
        };
        await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
    } catch (error) {
      console.error('Error initializing users:', error);
    }
  };

  // Check if user is authenticated on app start
  const checkAuth = async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      const currentUserData = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (currentUserData) {
        const user: User = JSON.parse(currentUserData);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  // Login function
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      if (!usersData) {
        return {
          success: false,
          message: 'No users found. Please register first.',
        };
      }

      const users = JSON.parse(usersData);

      // Check if user exists and password matches
      if (users[email] && users[email].password === password) {
        const user = {
          id: users[email].id,
          email: users[email].email,
          name: users[email].name,
          createdAt: users[email].createdAt,
        };

        // Save current user
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true, message: 'Login successful!' };
      } else {
        return { success: false, message: 'Invalid email or password.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  // Register function
  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users = usersData ? JSON.parse(usersData) : {};

      // Check if user already exists
      if (users[email]) {
        return {
          success: false,
          message: 'User already exists with this email.',
        };
      }

      // Create new user
      const newUser: User & { password: string } = {
        id: `user_${Date.now()}`,
        email,
        name,
        createdAt: new Date().toISOString(),
        password, // In a real app, this would be hashed
      };

      // Save to users storage
      users[email] = newUser;
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

      // Auto-login after registration
      const user = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt,
      };

      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true, message: 'Registration successful!' };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Initialize on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        await initializeUsers();
        if (isMounted) {
          await checkAuth();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
