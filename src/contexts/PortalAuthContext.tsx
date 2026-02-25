import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from '@/firebase/config';
import {
  getPortalCustomerByEmail,
  updatePortalLastLogin,
  linkPortalCustomer,
  PortalCustomer,
} from '@/firebase/portalCustomerService';

interface PortalAuthContextType {
  currentUser: FirebaseUser | null;
  portalCustomer: PortalCustomer | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextType>({
  currentUser: null,
  portalCustomer: null,
  loading: true,
  signOut: async () => {},
});

export function usePortalAuth() {
  return useContext(PortalAuthContext);
}

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [portalCustomer, setPortalCustomer] = useState<PortalCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  function signOut() {
    const auth = getFirebaseAuth();
    if (!auth) return Promise.resolve();
    setPortalCustomer(null);
    return import('firebase/auth').then(({ signOut: firebaseSignOut }) => firebaseSignOut(auth));
  }

  const fetchPortalCustomer = async (firebaseUser: FirebaseUser) => {
    try {
      if (!firebaseUser.email) {
        setPortalCustomer(null);
        return;
      }

      // Try to link pending portal customer to real UID
      const linked = await linkPortalCustomer(firebaseUser.uid, firebaseUser.email);
      if (linked && linked.isActive) {
        setPortalCustomer(linked);
        return;
      }

      // Fallback: look up by email
      const customer = await getPortalCustomerByEmail(firebaseUser.email);
      if (customer && customer.isActive) {
        setPortalCustomer(customer);
        await updatePortalLastLogin(customer.id);
      } else {
        setPortalCustomer(null);
      }
    } catch {
      setPortalCustomer(null);
    }
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
            await fetchPortalCustomer(user);
          } else {
            setPortalCustomer(null);
          }
          setLoading(false);
        });
      })
      .catch(() => {
        setLoading(false);
      });

    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, []);

  const value = {
    currentUser,
    portalCustomer,
    loading,
    signOut,
  };

  return (
    <PortalAuthContext.Provider value={value}>
      {children}
    </PortalAuthContext.Provider>
  );
}
