import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface UseScrollRevealOptions {
  delayMs?: number;
  threshold?: number;
  rootMargin?: string;
}

export function useScrollReveal<T extends HTMLElement>({
  delayMs = 0,
  threshold = 0,
  rootMargin = '0px 0px -8% 0px',
}: UseScrollRevealOptions = {}) {
  const ref = useRef<T>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isRevealed, setIsRevealed] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const element = ref.current;

    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        setIsRevealed(true);
        observer.disconnect();
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [prefersReducedMotion, rootMargin, threshold]);

  const style = useMemo<CSSProperties | undefined>(() => {
    if (prefersReducedMotion) {
      return undefined;
    }

    return {
      '--reveal-delay': `${delayMs}ms`,
    } as CSSProperties;
  }, [delayMs, prefersReducedMotion]);

  return {
    ref,
    isRevealed,
    prefersReducedMotion,
    style,
  };
}
