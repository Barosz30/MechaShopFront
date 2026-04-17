import { Link } from 'react-router-dom';
import { storefrontSectionRoutes } from '../config/routes';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

function NotFoundPage() {
  useDocumentMeta({
    title: 'Not Found | MechaShop',
    description: 'The requested MechaShop page could not be found.',
  });

  return (
    <main id="main-content" className="section-shell pb-16 pt-10">
      <section className="glass-panel rounded-[2rem] border border-white/10 p-8 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">404</p>
        <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
          This route is not part of the storefront
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          Head back to the MechaShop storefront to browse products, weekly deals, and curated
          collections.
        </p>
        <Link
          to={storefrontSectionRoutes.home}
          className="focus-ring mt-6 inline-flex rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-3 text-sm font-semibold text-slate-950"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}

export default NotFoundPage;
