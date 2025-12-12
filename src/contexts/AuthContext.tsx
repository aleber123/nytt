import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from '@/firebase/config';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  function signOut() {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.warn('Cannot sign out: Firebase auth not available');
      return Promise.resolve();
    }
    return import('firebase/auth').then(({ signOut: firebaseSignOut }) => firebaseSignOut(auth));
  }

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;
    let active = true;

    import('firebase/auth')
      .then(({ onAuthStateChanged }) => {
        if (!active) return;
        unsub = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
          setLoading(false);
        });
      })
      .catch((e) => {
        console.error('Failed to load firebase/auth for AuthProvider:', e);
        setLoading(false);
      });

    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, []);

  const value = {
    currentUser,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
