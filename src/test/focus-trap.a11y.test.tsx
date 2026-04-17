import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState, type RefObject } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface TrapHarnessProps {
  active: boolean;
  restoreFocus?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

function TrapHarness({ active, restoreFocus = true, initialFocusRef }: TrapHarnessProps) {
  const trapRef = useRef<HTMLDivElement>(null);
  useFocusTrap(trapRef, active, { restoreFocus, initialFocusRef });

  return (
    <div ref={trapRef} role="dialog" aria-label="Focus trap dialog" tabIndex={-1}>
      <button type="button">First</button>
      <button type="button">Last</button>
    </div>
  );
}

function TrapWithToggle({ restoreFocus = true }: { restoreFocus?: boolean }) {
  const [active, setActive] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <button ref={openerRef} type="button" onClick={() => setActive(true)}>
        Open trap
      </button>
      <button type="button">Outside action</button>
      {active ? (
        <div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setActive(false)}
            aria-label="Close trap"
          >
            Close trap
          </button>
          <TrapHarness
            active={active}
            restoreFocus={restoreFocus}
            initialFocusRef={closeRef as RefObject<HTMLElement | null>}
          />
        </div>
      ) : null}
    </div>
  );
}

describe('useFocusTrap accessibility behavior', () => {
  it('cycles focus within trap on Tab and Shift+Tab', async () => {
    const user = userEvent.setup();
    render(<TrapHarness active />);

    const [firstButton, lastButton] = screen.getAllByRole('button');
    await waitFor(() => {
      expect(firstButton).toHaveFocus();
    });

    await user.tab();
    expect(lastButton).toHaveFocus();

    await user.tab();
    expect(firstButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(lastButton).toHaveFocus();
  });

  it('restores focus to opener on close by default', async () => {
    const user = userEvent.setup();
    render(<TrapWithToggle />);

    const openButton = screen.getByRole('button', { name: /open trap/i });
    await user.click(openButton);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close trap/i })).toHaveFocus();
    });

    await user.click(screen.getByRole('button', { name: /close trap/i }));
    expect(openButton).toHaveFocus();
  });

  it('does not force restore focus when restoreFocus is false', async () => {
    const user = userEvent.setup();
    render(<TrapWithToggle restoreFocus={false} />);

    const openButton = screen.getByRole('button', { name: /open trap/i });
    await user.click(openButton);
    await user.click(screen.getByRole('button', { name: /close trap/i }));

    expect(openButton).not.toHaveFocus();
  });
});
