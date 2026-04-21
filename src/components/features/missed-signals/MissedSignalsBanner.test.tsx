import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@/src/test-utils/render';
import { MissedSignalsBanner } from './MissedSignalsBanner';

describe('MissedSignalsBanner', () => {
  describe('with zero missed signals', () => {
    it('renders nothing', () => {
      const { container } = render(<MissedSignalsBanner initialCount={0} />, {
        initialUser: null,
        backendToken: null,
      });
      expect(container.firstChild).toBeNull();
    });
  });

  describe('with missed signals', () => {
    it('shows the missed signal count', () => {
      render(<MissedSignalsBanner initialCount={3} />, { initialUser: null, backendToken: null });
      expect(screen.getByText(/3 missed signal/i)).toBeInTheDocument();
    });

    it('uses singular form for one missed signal', () => {
      render(<MissedSignalsBanner initialCount={1} />, { initialUser: null, backendToken: null });
      expect(screen.getByText('1 missed signal')).toBeInTheDocument();
    });

    it('shows an expand button', () => {
      render(<MissedSignalsBanner initialCount={2} />, { initialUser: null, backendToken: null });
      expect(screen.getByRole('button', { name: /expand/i })).toBeInTheDocument();
    });

    it('shows a dismiss button', () => {
      render(<MissedSignalsBanner initialCount={2} />, { initialUser: null, backendToken: null });
      expect(screen.getByRole('button', { name: /✕/ })).toBeInTheDocument();
    });
  });

  describe('expand flow', () => {
    it('shows loading state while fetching', async () => {
      const user = userEvent.setup();
      render(<MissedSignalsBanner initialCount={2} />, { initialUser: null, backendToken: null });

      // Click but don't await the full data load
      const click = user.click(screen.getByRole('button', { name: /expand/i }));
      expect(await screen.findByText(/loading/i)).toBeInTheDocument();
      await click;
    });

    it('renders signal entries with continent and direction after expanding', async () => {
      const user = userEvent.setup();
      render(<MissedSignalsBanner initialCount={2} />, { initialUser: null, backendToken: null });
      await user.click(screen.getByRole('button', { name: /expand/i }));

      await waitFor(() => {
        expect(screen.getByText('Europe')).toBeInTheDocument();
      });
      expect(screen.getByText(/270/)).toBeInTheDocument();
      expect(screen.getByText('Asia')).toBeInTheDocument();
    });

    it('collapses when expand button is clicked again', async () => {
      const user = userEvent.setup();
      render(<MissedSignalsBanner initialCount={2} />, { initialUser: null, backendToken: null });

      await user.click(screen.getByRole('button', { name: /expand/i }));
      await waitFor(() => screen.getByText('Europe'));

      await user.click(screen.getByRole('button', { name: /collapse/i }));
      expect(screen.queryByText('Europe')).not.toBeInTheDocument();
    });
  });

  describe('dismiss flow', () => {
    it('hides the banner when dismiss is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<MissedSignalsBanner initialCount={2} />, {
        initialUser: null,
        backendToken: null,
      });

      await user.click(screen.getByRole('button', { name: /✕/ }));
      expect(container.firstChild).toBeNull();
    });
  });
});
