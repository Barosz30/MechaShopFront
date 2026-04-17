import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchProfile, signIn, signInWithGoogle, signUp } from '../api/mechanicalShopRestApi';

const authStorageKey = 'mechashop-auth-token';

interface AuthUser {
  id: number;
  username: string;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithCredentials: (username: string, password: string) => Promise<void>;
  signInWithGoogleCredential: (credential: string) => Promise<void>;
  signUpWithCredentials: (username: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(authStorageKey);
}

function writeStoredToken(token: string | null) {
  if (typeof window === 'undefined') {
    return;
  }
  if (!token) {
    window.localStorage.removeItem(authStorageKey);
    return;
  }
  window.localStorage.setItem(authStorageKey, token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolveProfile = useCallback(async (activeToken: string | null) => {
    if (!activeToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await fetchProfile(activeToken);
      setUser({ id: profile.sub, username: profile.username });
    } catch {
      writeStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void resolveProfile(token);
  }, [resolveProfile, token]);

  const signInWithCredentials = useCallback(async (username: string, password: string) => {
    const response = await signIn(username, password);
    writeStoredToken(response.access_token);
    setToken(response.access_token);
    const profile = await fetchProfile(response.access_token);
    setUser({ id: profile.sub, username: profile.username });
  }, []);

  const signUpWithCredentials = useCallback(async (username: string, password: string) => {
    await signUp(username, password);
    const response = await signIn(username, password);
    writeStoredToken(response.access_token);
    setToken(response.access_token);
    const profile = await fetchProfile(response.access_token);
    setUser({ id: profile.sub, username: profile.username });
  }, []);

  const signInWithGoogleCredential = useCallback(async (credential: string) => {
    const response = await signInWithGoogle(credential);
    writeStoredToken(response.access_token);
    setToken(response.access_token);
    const profile = await fetchProfile(response.access_token);
    setUser({ id: profile.sub, username: profile.username });
  }, []);

  const signOut = useCallback(() => {
    writeStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: Boolean(token && user),
      signInWithCredentials,
      signInWithGoogleCredential,
      signUpWithCredentials,
      signOut,
    }),
    [
      isLoading,
      signInWithCredentials,
      signInWithGoogleCredential,
      signOut,
      signUpWithCredentials,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
