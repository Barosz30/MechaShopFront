import { Link } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { footerLinks } from '../../data/siteContent';

function Footer() {
  const footerReveal = useScrollReveal<HTMLElement>();

  return (
    <footer
      ref={footerReveal.ref}
      data-reveal="true"
      data-revealed={footerReveal.isRevealed}
      style={footerReveal.style}
      className="section-shell pt-8"
    >
      <div className="glass-panel overflow-hidden rounded-[2rem] border border-white/10 px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
              MechaShop
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
              Built for keyboard enthusiasts who care about acoustics, finish, and a smoother path to checkout.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Browse curated drops, compare essentials, and bundle the small details that bring a desk setup together.
            </p>
          </div>

          <nav className="flex flex-wrap gap-3" aria-label="Footer navigation">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="focus-ring rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-300/30 hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Curated keyboards, components, and setup essentials shipped from the MechaShop warehouse.</p>
          <p>React, TypeScript, Vite, Tailwind CSS v4.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
