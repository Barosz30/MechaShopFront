import { Quote } from 'lucide-react';
import type { CSSProperties } from 'react';
import { testimonials } from '../../data/siteContent';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import SectionHeading from '../ui/SectionHeading';

function Testimonials() {
  const sectionReveal = useScrollReveal<HTMLElement>();

  return (
    <section
      id="testimonials"
      ref={sectionReveal.ref}
      data-reveal="true"
      data-revealed={sectionReveal.isRevealed}
      style={sectionReveal.style}
      className="section-shell pt-20"
    >
      <SectionHeading
        eyebrow="Testimonials"
        title="Why enthusiasts come back to MechaShop for their next board, switch pack, or finishing touch."
        description="Recent buyers call out the product curation, smooth ordering flow, and the way every collection feels ready to mix into a complete setup."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <article
            key={testimonial.name}
            data-reveal="true"
            data-revealed={sectionReveal.isRevealed}
            style={
              !sectionReveal.prefersReducedMotion
                ? ({ '--reveal-delay': `${index * 85}ms` } as CSSProperties)
                : undefined
            }
            className="glass-panel rounded-[1.8rem] border border-white/10 p-6"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-300">
              <Quote className="h-5 w-5" />
            </span>
            <p className="mt-5 text-lg leading-8 text-slate-100">"{testimonial.quote}"</p>
            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="font-semibold text-white">{testimonial.name}</p>
              <p className="mt-1 text-sm text-slate-400">{testimonial.title}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
