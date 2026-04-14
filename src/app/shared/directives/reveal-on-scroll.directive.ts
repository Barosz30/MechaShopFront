import { Directive, ElementRef, OnDestroy, OnInit, Renderer2, inject, input } from '@angular/core';

@Directive({
  selector: '[appRevealOnScroll]',
  standalone: true
})
export class RevealOnScrollDirective implements OnInit, OnDestroy {
  delayMs = input(0);
  threshold = input(0.16);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    const element = this.el.nativeElement;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderer.addClass(element, 'reveal-on-scroll');

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      this.reveal();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.reveal();
            this.observer?.disconnect();
            this.observer = null;
          }
        });
      },
      { threshold: this.threshold(), rootMargin: '0px 0px -4% 0px' }
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private reveal(): void {
    const delay = Math.max(0, Number(this.delayMs()) || 0);
    this.renderer.setStyle(this.el.nativeElement, '--reveal-delay', `${delay}ms`);
    this.renderer.addClass(this.el.nativeElement, 'is-revealed');
  }
}
