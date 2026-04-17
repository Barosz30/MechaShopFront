import { AlertCircle, MailCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

type NewsletterState = 'idle' | 'success' | 'error';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [submissionState, setSubmissionState] = useState<NewsletterState>('idle');
  const sectionReveal = useScrollReveal<HTMLElement>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (email.trim().toLowerCase().includes('fail')) {
      setSubmissionState('error');
      return;
    }

    setSubmissionState('success');
    setEmail('');
  };

  return (
    <section
      id="newsletter"
      ref={sectionReveal.ref}
      data-reveal="true"
      data-revealed={sectionReveal.isRevealed}
      style={sectionReveal.style}
      className="section-shell pt-20"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(14,28,48,0.88),rgba(7,12,22,0.98))] px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
              Inbox access
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Join the drop list for early access to restocks, limited bundles, and desk-ready picks.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Get launch alerts, build inspiration, and subscriber-only bundle notices before they hit the front page.
            </p>
          </div>

          <form className="w-full max-w-xl space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (submissionState !== 'idle') {
                    setSubmissionState('idle');
                  }
                }}
                placeholder="Enter your best email"
                aria-describedby="newsletter-helper"
                className="focus-ring w-full rounded-full border border-white/10 bg-white/[0.05] px-5 py-4 text-sm text-white placeholder:text-slate-500"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="focus-ring rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Join the list
              </button>
              <p id="newsletter-helper" className="text-sm text-slate-400">
                No noise, just restocks, drops, and setup notes worth opening.
              </p>
            </div>

            {submissionState === 'success' ? (
              <div
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200"
                role="status"
              >
                <MailCheck className="h-4 w-4" />
                You are in. Watch for early access to the next MechaShop release.
              </div>
            ) : null}

            {submissionState === 'error' ? (
              <div
                className="inline-flex items-center gap-2 rounded-full border border-rose-400/25 bg-rose-400/10 px-4 py-2 text-sm text-rose-100"
                role="alert"
              >
                <AlertCircle className="h-4 w-4" />
                We could not save that address right now. Try another email or retry in a moment.
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}

export default Newsletter;
