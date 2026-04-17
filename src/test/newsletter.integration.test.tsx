import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Newsletter from '../components/sections/Newsletter';

describe('Newsletter section', () => {
  it('shows a success message after a valid submission', async () => {
    const user = userEvent.setup();
    render(<Newsletter />);

    await user.type(screen.getByPlaceholderText(/enter your best email/i), 'alex@example.com');
    await user.click(screen.getByRole('button', { name: /join the list/i }));

    expect(
      await screen.findByText(/watch for early access to the next mechashop release/i),
    ).toBeInTheDocument();
  });

  it('shows an error state for the mock failure path', async () => {
    const user = userEvent.setup();
    render(<Newsletter />);

    await user.type(screen.getByPlaceholderText(/enter your best email/i), 'fail@example.com');
    await user.click(screen.getByRole('button', { name: /join the list/i }));

    expect(
      await screen.findByText(/we could not save that address right now/i),
    ).toBeInTheDocument();
  });
});
