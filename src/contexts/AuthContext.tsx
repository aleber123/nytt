import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from '@/firebase/config';
import { getAdminUserByEmail, updateLastLogin, linkPendingAdminUser, AdminUser, UserRole, ROLE_PERMISSIONS } from '@/firebase/userService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  adminUser: AdminUser | null;
  userRole: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasPermission: (permission: keyof typeof ROLE_PERMISSIONS['super_admin']) => boolean;
  refreshAdminUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  adminUser: null,
  userRole: null,
  loading: true,
  signOut: async () => {},
  hasPermission: () => false,
  refreshAdminUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  function signOut() {
    const auth = getFirebaseAuth();
    if (!auth) {
      return Promise.resolve();
    }
    setAdminUser(null);
    return import('firebase/auth').then(({ signOut: firebaseSignOut }) => firebaseSignOut(auth));
  }

  const fetchAdminUser = async (firebaseUser: FirebaseUser) => {
    try {
      if (!firebaseUser.email) {
        setAdminUser(null);
        return;
      }

      // Try to link pending admin user to real UID (handles first-time login)
      const linked = await linkPendingAdminUser(firebaseUser.uid, firebaseUser.email);
      if (linked) {
        setAdminUser(linked);
        return;
      }

      // Fallback: look up by email (for users added directly in Firebase)
      const user = await getAdminUserByEmail(firebaseUser.email);
      setAdminUser(user);
      if (user) {
        await updateLastLogin(user.id);
      }
    } catch {
      setAdminUser(null);
    }
  };

  const refreshAdminUser = async () => {
    if (currentUser) {
      await fetchAdminUser(currentUser);
    }
  };

  const hasPermission = (permission: keyof typeof ROLE_PERMISSIONS['super_admin']): boolean => {
    if (!adminUser?.role) return false;
    if (permission === 'label' || permission === 'description') return true;
    return ROLE_PERMISSIONS[adminUser.role]?.[permission] ?? false;
  };

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
        unsub = onAuthStateChanged(auth, async (user) => {
          setCurrentUser(user);
          if (user?.email) {
            await fetchAdminUser(user);
          } else {
            setAdminUser(null);
          }
          setLoading(false);
        });
      })
      .catch((e) => {
        setLoading(false);
      });

    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, []);

  const value = {
    currentUser,
    adminUser,
    userRole: adminUser?.role || null,
    loading,
    signOut,
    hasPermission,
    refreshAdminUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
