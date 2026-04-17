import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const googleIdentityScriptId = 'google-identity-script';

function loadGoogleIdentityScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(true);
  }

  const existingScript = document.getElementById(googleIdentityScriptId) as HTMLScriptElement | null;
  if (existingScript) {
    return new Promise<boolean>((resolve) => {
      existingScript.addEventListener('load', () => resolve(Boolean(window.google?.accounts?.id)), {
        once: true,
      });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
    });
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.id = googleIdentityScriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(Boolean(window.google?.accounts?.id));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme?: 'outline' | 'filled_blue' | 'filled_black'; size?: 'large' | 'medium' | 'small'; width?: string | number },
          ) => void;
        };
      };
    };
  }
}

function LoginPage() {
  const { signInWithCredentials, signInWithGoogleCredential, signUpWithCredentials } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const isGoogleInitializedRef = useRef(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleScriptReady, setIsGoogleScriptReady] = useState(false);
  const from = (location.state as { from?: string } | undefined)?.from ?? '/';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    let isMounted = true;

    if (!googleClientId || mode !== 'login') {
      setIsGoogleScriptReady(false);
      return;
    }

    void loadGoogleIdentityScript().then((isLoaded) => {
      if (isMounted) {
        setIsGoogleScriptReady(isLoaded);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [googleClientId, mode]);

  useEffect(() => {
    if (
      mode !== 'login' ||
      !googleClientId ||
      !googleButtonRef.current ||
      !window.google ||
      !isGoogleScriptReady
    ) {
      return;
    }

    googleButtonRef.current.innerHTML = '';
    if (!isGoogleInitializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) {
            setErrorMessage('Google sign-in failed.');
            return;
          }

          setErrorMessage(null);
          setIsSubmitting(true);
          try {
            await signInWithGoogleCredential(response.credential);
            navigate(from, { replace: true });
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Google sign-in failed.');
          } finally {
            setIsSubmitting(false);
          }
        },
      });
      isGoogleInitializedRef.current = true;
    }

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      width: '320',
    });
  }, [from, googleClientId, isGoogleScriptReady, mode, navigate, signInWithGoogleCredential]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await signInWithCredentials(username.trim(), password);
      } else {
        await signUpWithCredentials(username.trim(), password);
      }
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[72vh] w-[min(100%-1.5rem,30rem)] items-center py-16">
      <section className="w-full rounded-[1.8rem] border border-white/10 bg-slate-950/65 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Account access</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {mode === 'login' ? 'Sign in to continue checkout' : 'Create your account'}
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Use your existing Mechanical Shop backend credentials.
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-200">Email / Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="focus-ring rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-slate-100"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="focus-ring rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-slate-100"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring w-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {isSubmitting
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        {mode === 'login' ? (
          <>
            <div className="my-5 text-center text-xs uppercase tracking-[0.28em] text-slate-500">Or</div>
            {googleClientId ? (
              <div className="flex justify-center">
                <div ref={googleButtonRef} />
              </div>
            ) : (
              <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-center text-sm text-amber-100">
                Google sign-in is not configured. Set `VITE_GOOGLE_CLIENT_ID` in your `.env`.
              </p>
            )}
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setMode((current) => (current === 'login' ? 'register' : 'login'))}
          className="mt-5 text-sm text-cyan-200 underline-offset-4 hover:underline"
        >
          {mode === 'login'
            ? 'No account yet? Create one now.'
            : 'Already have an account? Sign in.'}
        </button>

        <p className="mt-5 text-xs text-slate-400">
          You can return to the storefront anytime.{' '}
          <Link to="/" className="text-cyan-300 hover:text-cyan-200">
            Continue browsing
          </Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
