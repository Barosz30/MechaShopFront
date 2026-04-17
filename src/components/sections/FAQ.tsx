import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { faqs } from '../../data/siteContent';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import SectionHeading from '../ui/SectionHeading';

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  const sectionReveal = useScrollReveal<HTMLElement>();

  return (
    <section
      id="faq"
      ref={sectionReveal.ref}
      data-reveal="true"
      data-revealed={sectionReveal.isRevealed}
      style={sectionReveal.style}
      className="section-shell pt-20"
    >
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <SectionHeading
          eyebrow="FAQ"
          title="Answers on shipping, stock, returns, and how MechaShop handles custom gear."
          description="Find the details customers usually check before checkout, from packing times to bundle eligibility and support expectations."
        />

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = index === openIndex;
            const answerId = `faq-answer-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
              <article
                key={faq.question}
                className="glass-panel overflow-hidden rounded-[1.6rem] border border-white/10"
              >
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                  >
                    <span className="text-lg font-semibold text-white">{faq.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-cyan-300 transition ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </h3>
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={buttonId}
                  aria-hidden={!isOpen}
                  className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-white/10 px-5 py-4">
                      <p className="text-sm leading-7 text-slate-300">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
