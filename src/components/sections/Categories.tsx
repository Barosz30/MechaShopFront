import { ArrowRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { storefrontSectionRoutes } from '../../config/routes';
import { useShop } from '../../context/ShopContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import SectionHeading from '../ui/SectionHeading';

function Categories() {
  const { categories, setActiveCategory } = useShop();
  const sectionReveal = useScrollReveal<HTMLElement>();

  return (
    <section
      id="categories"
      ref={sectionReveal.ref}
      data-reveal="true"
      data-revealed={sectionReveal.isRevealed}
      style={sectionReveal.style}
      className="section-shell pt-20"
    >
      <SectionHeading
        eyebrow="Categories"
        title="Shop by category to build a setup that sounds right, feels right, and looks finished."
        description="Start with a board, fine-tune the switch feel, then finish the build with caps, mats, and accessories that match your desk."
      />

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {categories.map((category, index) => (
          <article
            key={category.slug}
            data-reveal="true"
            data-revealed={sectionReveal.isRevealed}
            style={
              !sectionReveal.prefersReducedMotion
                ? ({ '--reveal-delay': `${index * 70}ms` } as CSSProperties)
                : undefined
            }
            className="glass-panel group rounded-[1.8rem] border border-white/10 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25"
          >
            <div className={`h-2 rounded-full bg-gradient-to-r ${category.accent}`} />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              {category.slug}
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">{category.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{category.description}</p>
            <p className="mt-4 text-sm text-cyan-200/80">{category.featured}</p>

            <Link
              to={storefrontSectionRoutes.shop}
              onClick={() => setActiveCategory(category.slug)}
              className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition group-hover:border-cyan-300/30 group-hover:bg-white/10"
            >
              Browse picks
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Categories;
