import { mockMessage, mockTransmittingUser } from '@/src/mocks/fixtures';
import { server } from '@/src/mocks/server';
import { render, screen, waitFor } from '@/src/test-utils/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ComposePanel } from './ComposePanel';

describe('ComposePanel', () => {
  describe('initial state', () => {
    it('renders the compose textarea', () => {
      render(<ComposePanel />);
      expect(screen.getByPlaceholderText(/Compose your signal/i)).toBeInTheDocument();
    });

    it('shows a hex preview placeholder when text is empty', () => {
      render(<ComposePanel />);
      expect(screen.getByText(/HEX preview/i)).toBeInTheDocument();
    });

    it('starts at 0 / 100 character count', () => {
      render(<ComposePanel />);
      expect(screen.getByText('0 / 100')).toBeInTheDocument();
    });

    it('disables the TRANSMIT button when textarea is empty', () => {
      render(<ComposePanel />);
      expect(screen.getByRole('button', { name: /^TRANSMIT$/i })).toBeDisabled();
    });
  });

  describe('typing', () => {
    it('updates the character count as user types', async () => {
      const user = userEvent.setup();
      render(<ComposePanel />);
      await user.type(screen.getByPlaceholderText(/Compose your signal/i), 'Hello');
      expect(screen.getByText('5 / 100')).toBeInTheDocument();
    });

    it('shows a live hex preview', async () => {
      const user = userEvent.setup();
      render(<ComposePanel />);
      await user.type(screen.getByPlaceholderText(/Compose your signal/i), 'A');
      expect(screen.getByText('41')).toBeInTheDocument();
    });

    it('does not accept input beyond 100 characters', async () => {
      const user = userEvent.setup();
      render(<ComposePanel />);
      await user.type(
        screen.getByPlaceholderText(/Compose your signal/i),
        'a'.repeat(105),
      );
      expect(screen.getByText('100 / 100')).toBeInTheDocument();
    });

    it('enables the TRANSMIT button once text is entered', async () => {
      const user = userEvent.setup();
      render(<ComposePanel />);
      await user.type(screen.getByPlaceholderText(/Compose your signal/i), 'Ready to transmit');
      expect(screen.getByRole('button', { name: /^TRANSMIT$/i })).toBeEnabled();
    });
  });

  describe('when already transmitting', () => {
    it('disables the TRANSMIT button', () => {
      render(<ComposePanel />, { initialUser: mockTransmittingUser, initialMessage: mockMessage });
      expect(screen.getByRole('button', { name: /TRANSMITTING/i })).toBeDisabled();
    });
  });

  describe('confirmation dialog', () => {
    it('opens the dialog when TRANSMIT is clicked', async () => {
      const user = userEvent.setup();
      render(<ComposePanel />);
      await user.type(screen.getByPlaceholderText(/Compose your signal/i), 'Signal from Earth');
      await user.click(screen.getByRole('button', { name: /^TRANSMIT$/i }));
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      expect(screen.getByText('Confirm Transmission')).toBeInTheDocument();
    });

    it('shows the message content in the dialog', async () => {
      const user = userEvent.setup();
      render(<ComposePanel />);
      await user.type(screen.getByPlaceholderText(/Compose your signal/i), 'Signal from Earth');
      await user.click(screen.getByRole('button', { name: /^TRANSMIT$/i }));
      await waitFor(() => screen.getByRole('dialog'));
      expect(screen.getByRole('dialog')).toHaveTextContent('Signal from Earth');
    });

    it('closes the dialog when CANCEL is clicked', async () => {
      const user = userEvent.setup();
      render(<ComposePanel />);
      await user.type(screen.getByPlaceholderText(/Compose your signal/i), 'Signal from Earth');
      await user.click(screen.getByRole('button', { name: /^TRANSMIT$/i }));
      await waitFor(() => screen.getByRole('dialog'));
      await user.click(screen.getByRole('button', { name: /CANCEL/i }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });

  describe('sending', () => {
    it('clears the textarea and closes the dialog after a successful send', async () => {
      const user = userEvent.setup();
      render(<ComposePanel />);
      await user.type(screen.getByPlaceholderText(/Compose your signal/i), 'Signal from Earth');
      await user.click(screen.getByRole('button', { name: /^TRANSMIT$/i }));
      await waitFor(() => screen.getByRole('button', { name: /^CONFIRM$/i }));
      await user.click(screen.getByRole('button', { name: /^CONFIRM$/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText(/Compose your signal/i)).toHaveValue('');
    });

    it('shows an error message when the API returns an error', async () => {
      server.use(
        http.post('http://localhost/api/v1/messages', () =>
          HttpResponse.json({
            data: null,
            error: { code: 'SEND_FAILED', message: 'Transmission channel unavailable' },
            meta: {},
          }),
        ),
      );

      const user = userEvent.setup();
      render(<ComposePanel />);
      await user.type(screen.getByPlaceholderText(/Compose your signal/i), 'Signal from Earth');
      await user.click(screen.getByRole('button', { name: /^TRANSMIT$/i }));
      await waitFor(() => screen.getByRole('button', { name: /^CONFIRM$/i }));
      await user.click(screen.getByRole('button', { name: /^CONFIRM$/i }));

      await waitFor(() => {
        expect(screen.getByText(/Transmission channel unavailable/i)).toBeInTheDocument();
      });
    });

    it('shows a network error when the request fails', async () => {
      server.use(
        http.post('http://localhost/api/v1/messages', () => HttpResponse.error()),
      );

      const user = userEvent.setup();
      render(<ComposePanel />);
      await user.type(screen.getByPlaceholderText(/Compose your signal/i), 'Signal from Earth');
      await user.click(screen.getByRole('button', { name: /^TRANSMIT$/i }));
      await waitFor(() => screen.getByRole('button', { name: /^CONFIRM$/i }));
      await user.click(screen.getByRole('button', { name: /^CONFIRM$/i }));

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });
});
