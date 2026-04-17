import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  buildResponsiveImageUrl,
  buildResponsiveSrcSet,
  freeShippingThreshold,
  heroImageHeight,
  heroImageWidth,
} from '../../data/products';
import { storefrontSectionRoutes } from '../../config/routes';
import { useLocale } from '../../context/LocaleContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import ResponsiveImage from '../ui/ResponsiveImage';

function Hero() {
  const heroReveal = useScrollReveal<HTMLElement>();
  const { formatCurrency } = useLocale();
  const stats = [
    { label: 'Products ready', value: '12' },
    { label: 'Average rating', value: '4.8/5' },
    { label: 'Free shipping threshold', value: formatCurrency(freeShippingThreshold) },
  ];

  return (
    <section
      id="hero"
      ref={heroReveal.ref}
      data-reveal="true"
      data-revealed={heroReveal.isRevealed}
      style={heroReveal.style}
      className="section-shell pt-6 sm:pt-10"
    >
      <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(145deg,rgba(14,28,48,0.88),rgba(6,12,24,0.96))] px-6 py-16 shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:px-10 lg:px-12 lg:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(34,211,238,0.2),transparent_24%),radial-gradient(circle_at_80%_12%,rgba(168,85,247,0.18),transparent_28%)]" />
          <div className="absolute left-[6%] top-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl orb-float" />
          <div className="absolute right-[9%] top-16 h-52 w-52 rounded-full bg-violet-400/15 blur-3xl orb-float-delayed" />
          <div className="absolute bottom-6 right-[18%] h-24 w-24 rounded-full border border-white/10 bg-white/5 pulse-soft" />
          <div className="absolute left-[10%] top-[55%] h-px w-28 bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        </div>

        <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-200">
              <Sparkles className="h-4 w-4" />
              New arrivals curated for fast builds and clean desk setups
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl lg:leading-[1.02]">
              Mechanical keyboard essentials, tuned for feel, sound, and standout setups.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Shop limited boards, switch packs, keycap drops, and desk accessories chosen to work
              together, whether you are finishing a first build or refining a daily driver.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={storefrontSectionRoutes.shop}
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Shop featured products
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={storefrontSectionRoutes.categories}
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-white/10"
              >
                Browse categories
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {['Hot-swap favorites', 'Free shipping at $250', 'Fast-moving weekly drops'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px]">
            <article className="glass-panel absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10">
              <ResponsiveImage
                src={buildResponsiveImageUrl(
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
                  1200,
                )}
                srcSet={buildResponsiveSrcSet(
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
                  [720, 960, 1200, 1600],
                )}
                sizes="(min-width: 1024px) 42vw, 100vw"
                alt="A premium mechanical keyboard workstation with moody lighting"
                fallbackLabel="Flagship setup"
                width={heroImageWidth}
                height={heroImageHeight}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">Flagship setup</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                  Designed for deep acoustics, buttery travel, and a desk setup that feels finished.
                </h2>
              </div>
            </article>

            <div className="glass-panel absolute -left-2 top-8 max-w-[14rem] rounded-[1.5rem] border border-white/10 p-4 sm:-left-8">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">Drop this week</p>
              <p className="mt-2 text-lg font-semibold text-white">Aurora TKL Pro</p>
              <p className="mt-2 text-sm text-slate-400">Gasket mount, tri-mode, and tuned for a deeper signature.</p>
            </div>

            <div className="glass-panel absolute -bottom-3 right-2 rounded-[1.5rem] border border-white/10 p-4 sm:right-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-300/12 text-amber-300">
                  <Star className="h-5 w-5 fill-current" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">4.8 average shopper rating</p>
                  <p className="text-sm text-slate-400">Praised for sound, finish quality, and fast packing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
