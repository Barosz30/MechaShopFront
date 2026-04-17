import { useEffect, type RefObject } from 'react';

const focusableSelectors = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface UseFocusTrapOptions {
  initialFocusRef?: RefObject<HTMLElement | null>;
  restoreFocus?: boolean;
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean,
  options?: UseFocusTrapOptions,
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const restoreFocus = options?.restoreFocus ?? true;

    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors),
    );

    const firstElement = focusableElements[0];
    const preferredElement = options?.initialFocusRef?.current ?? firstElement ?? container;

    const frameId = window.requestAnimationFrame(() => {
      preferredElement?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const currentFocusable = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors),
      );
      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];

      if (!first || !last) {
        event.preventDefault();
        container.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      container.removeEventListener('keydown', handleKeyDown);

      const activeElement = document.activeElement as HTMLElement | null;
      const focusAlreadyMoved =
        activeElement !== null &&
        activeElement !== document.body &&
        !container.contains(activeElement);

      if (restoreFocus && !focusAlreadyMoved && previousActiveElement?.isConnected) {
        previousActiveElement.focus();
      }
    };
  }, [containerRef, isActive, options?.initialFocusRef, options?.restoreFocus]);
}
