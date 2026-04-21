import React from 'react';
import userEvent from '@testing-library/user-event';
import { signIn, signOut } from 'next-auth/react';
import { render, screen, waitFor } from '@/src/test-utils/render';
import { LandingOverlay } from './LandingOverlay';

describe('LandingOverlay', () => {
  describe('content', () => {
    it('renders the app title', () => {
      render(<LandingOverlay />, { initialUser: null, backendToken: null });
      expect(screen.getByRole('heading', { name: /THE MARTIAN CALL/i })).toBeInTheDocument();
    });

    it('renders the tagline', () => {
      render(<LandingOverlay />, { initialUser: null, backendToken: null });
      expect(screen.getByText(/Broadcast signals across continents/i)).toBeInTheDocument();
    });

    it('renders the sign-in button', () => {
      render(<LandingOverlay />, { initialUser: null, backendToken: null });
      expect(screen.getByRole('button', { name: /SIGN IN WITH GOOGLE/i })).toBeInTheDocument();
    });
  });

  describe('fresh unauthenticated (no stale session)', () => {
    it('does not show a session-expired message', () => {
      render(<LandingOverlay />, { initialUser: null, backendToken: null });
      expect(screen.queryByText(/Session expired/i)).not.toBeInTheDocument();
    });

    it('calls signIn("google") when the button is clicked', async () => {
      const user = userEvent.setup();
      render(<LandingOverlay />, { initialUser: null, backendToken: null });
      await user.click(screen.getByRole('button', { name: /SIGN IN WITH GOOGLE/i }));
      expect(signIn).toHaveBeenCalledWith('google');
      expect(signOut).not.toHaveBeenCalled();
    });
  });

  describe('stale session', () => {
    it('shows the session-expired message', () => {
      render(<LandingOverlay hasStaleSession />, { initialUser: null, backendToken: null });
      expect(screen.getByText(/Session expired/i)).toBeInTheDocument();
    });

    it('signs out first then signs in with Google', async () => {
      const user = userEvent.setup();
      render(<LandingOverlay hasStaleSession />, { initialUser: null, backendToken: null });
      await user.click(screen.getByRole('button', { name: /SIGN IN WITH GOOGLE/i }));
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({ redirect: false });
        expect(signIn).toHaveBeenCalledWith('google');
      });
    });
  });
});
