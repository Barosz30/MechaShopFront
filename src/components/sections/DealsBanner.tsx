import { BadgePercent, Clock3 } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const countdownCards = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
] as const;

function DealsBanner() {
  const { weeklyDeal } = useShop();
  const sectionReveal = useScrollReveal<HTMLElement>();
  const isOfferActive = weeklyDeal.phase === 'active';
  const bannerTitle = isOfferActive
    ? 'Save 18% on selected starter boards, switch bundles, and matching caps before the timer ends.'
    : 'Offer ended. The weekly spotlight returns on the next scheduled cycle with a fresh discounted lineup.';
  const bannerDescription = isOfferActive
    ? 'This week’s edit is built for first-time customizers who want a fast route to a refined setup. Add eligible items before the timer ends to lock spotlight pricing in cart and checkout.'
    : 'Regular pricing is back for new adds. Eligible products already added during the spotlight keep their locked price through checkout.';
  const timerLabel = isOfferActive ? 'Offer ends in' : 'Next spotlight starts in';

  return (
    <section
      id="deals"
      ref={sectionReveal.ref}
      data-reveal="true"
      data-revealed={sectionReveal.isRevealed}
      style={sectionReveal.style}
      className="section-shell pt-20"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-amber-300/15 bg-[linear-gradient(135deg,rgba(255,180,85,0.18),rgba(168,85,247,0.12),rgba(8,15,28,0.96))] px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.3)] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100">
              <BadgePercent className="h-4 w-4" />
              {isOfferActive ? 'Weekly spotlight live' : 'Weekly spotlight paused'}
            </div>
            <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
              {bannerTitle}
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-200/90">
              {bannerDescription}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-right text-xs font-semibold uppercase tracking-[0.28em] text-amber-100/85">
              {timerLabel}
            </p>
            <div className="grid gap-3 sm:grid-cols-4">
            {countdownCards.map(({ key, label }) => (
              <div
                key={key}
                className="rounded-[1.4rem] border border-white/12 bg-slate-950/55 px-4 py-4 text-center backdrop-blur"
              >
                <p className="text-3xl font-semibold text-white">
                  {String(weeklyDeal[key]).padStart(2, '0')}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
              </div>
            ))}
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex items-center gap-2 text-sm text-amber-100/90">
          <Clock3 className="h-4 w-4" />
          {isOfferActive
            ? 'Discounted prices can still be locked in by adding eligible items to cart before the timer ends.'
            : 'New adds use regular rates for now, while already locked cart prices stay intact until checkout.'}
        </div>
      </div>
    </section>
  );
}

export default DealsBanner;
