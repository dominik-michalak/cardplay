// context/AuthContext.tsx
// Kontekst uwierzytelnienia — przechowuje zalogowanego użytkownika i token JWT.
// Zawiera: typ AuthState, AuthContext, AuthProvider oraz hook useAuth.
// Token zapisywany w localStorage pod kluczem 'cardplay_token'.
// Właściciel: Osoba A — implementuje setAuth (po login/register) i clearAuth (logout).

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { PublicUser } from '@cardplay/shared';

type AuthState = {
  user: PublicUser | null;
  accessToken: string | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  setAuth: (user: PublicUser, accessToken: string) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('cardplay_token');
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    // Osoba A: zweryfikuj token przez GET /api/v1/users/me i ustaw user.
    setState((s) => ({ ...s, accessToken: token, isLoading: false }));
  }, []);

  const setAuth = (user: PublicUser, accessToken: string) => {
    localStorage.setItem('cardplay_token', accessToken);
    setState({ user, accessToken, isLoading: false });
  };

  const clearAuth = () => {
    localStorage.removeItem('cardplay_token');
    setState({ user: null, accessToken: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth musi być użyty wewnątrz AuthProvider');
  return ctx;
}
