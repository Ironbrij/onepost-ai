import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClientOnlyFn } from "@tanstack/react-start";

import type { User } from "@/lib/firebase.client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signUpWithEmail: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const loadFirebaseClient = createClientOnlyFn(() => import("@/lib/firebase.client"));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    loadFirebaseClient()
      .then(({ auth, onAuthStateChanged }) => {
        if (cancelled) return;
        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        });
      })
      .catch((error) => {
        console.error("Failed to load Firebase auth", error);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signInWithGoogle: async () => {
      const mod = await loadFirebaseClient();
      const credential = await mod.signInWithGoogle();
      return credential.user;
    },
    signInWithEmail: async (email, password) => {
      const mod = await loadFirebaseClient();
      const credential = await mod.signInWithEmail(email, password);
      return credential.user;
    },
    signUpWithEmail: async (email, password) => {
      const mod = await loadFirebaseClient();
      const credential = await mod.signUpWithEmail(email, password);
      return credential.user;
    },
    signOut: async () => {
      const mod = await loadFirebaseClient();
      await mod.signOut();
    },
    resetPassword: async (email) => {
      const mod = await loadFirebaseClient();
      await mod.resetPassword(email);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
