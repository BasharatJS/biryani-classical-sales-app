'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthUser {
  uid: string;
  email: string;
  name: string;
  isActive: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      const result: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user exists in authorized_sales_manager collection
      const userDoc = await getDoc(doc(db, 'authorized_sales_manager', result.user.uid));
      
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error('User not authorized');
      }
      
      const userData = userDoc.data();
      if (!userData.isActive) {
        await signOut(auth);
        throw new Error('Account is deactivated');
      }
      
      setUser({
        uid: result.user.uid,
        email: result.user.email || '',
        name: userData.name || 'Sales Manager',
        isActive: userData.isActive
      });
      
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email format');
      } else if (error.message === 'User not authorized' || error.message === 'Account is deactivated') {
        throw error;
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'authorized_sales_manager', firebaseUser.uid));
          
          if (userDoc.exists() && userDoc.data().isActive) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || 'Sales Manager',
              isActive: userData.isActive
            });
          } else {
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}