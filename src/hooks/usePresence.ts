import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function usePresence(isOpen: boolean, durationMs = 280) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);

      const frameId = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    setIsVisible(false);

    if (!isMounted) {
      return;
    }

    if (prefersReducedMotion) {
      setIsMounted(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsMounted(false);
    }, durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [durationMs, isMounted, isOpen, prefersReducedMotion]);

  return {
    isMounted,
    isVisible,
    prefersReducedMotion,
  };
}
