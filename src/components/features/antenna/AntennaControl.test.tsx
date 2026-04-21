import { VALID_DIRECTIONS } from '@/src/lib/constants';
import { mockTransmittingUser } from '@/src/mocks/fixtures';
import { server } from '@/src/mocks/server';
import { render, screen, waitFor } from '@/src/test-utils/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { AntennaControl } from './AntennaControl';

describe('AntennaControl', () => {
  describe('rendering', () => {
    it('renders all 12 direction buttons', () => {
      render(<AntennaControl />);
      VALID_DIRECTIONS.forEach((dir) => {
        expect(
          screen.getAllByRole('button', { name: new RegExp(`${dir}°`) })[0],
        ).toBeInTheDocument();
      });
    });

    it('shows the current direction label in the center', () => {
      render(<AntennaControl />);
      // mockUser has antenna_direction: 90 → 'E'
      expect(screen.getByText(/90.*E/)).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables all direction buttons when user is transmitting', () => {
      render(<AntennaControl />, { initialUser: mockTransmittingUser });
      VALID_DIRECTIONS.forEach((dir) => {
        const buttons = screen.getAllByRole('button', { name: new RegExp(`${dir}°`) });
        buttons.forEach((btn) => expect(btn).toBeDisabled());
      });
    });

    it('disables all direction buttons when there is no user', () => {
      render(<AntennaControl />, { initialUser: null, backendToken: null });
      VALID_DIRECTIONS.forEach((dir) => {
        const buttons = screen.getAllByRole('button', { name: new RegExp(`${dir}°`) });
        buttons.forEach((btn) => expect(btn).toBeDisabled());
      });
    });
  });

  describe('direction change', () => {
    it('does not call the API when clicking the already-active direction', async () => {
      const user = userEvent.setup();
      let apiCalled = false;
      server.use(
        http.patch('http://localhost/api/v1/users/me/antenna', () => {
          apiCalled = true;
          return HttpResponse.json({ data: { antenna_direction: 90 }, error: null, meta: {} });
        }),
      );

      render(<AntennaControl />);
      // mockUser is at 90°; click the 90° button
      await user.click(screen.getAllByRole('button', { name: /90°/i })[0]);
      expect(apiCalled).toBe(false);
    });

    it('updates the active direction label after a successful rotate', async () => {
      const user = userEvent.setup();
      render(<AntennaControl />);

      // Click 120° (one step clockwise from 90°)
      await user.click(screen.getAllByRole('button', { name: /120°/i })[0]);

      await waitFor(() => {
        expect(screen.getByText(/120.*SE/)).toBeInTheDocument();
      });
    });

    it('rolls back to original direction when the API returns an error', async () => {
      server.use(
        http.patch('http://localhost/api/v1/users/me/antenna', () =>
          HttpResponse.json({
            data: null,
            error: { code: 'ROTATE_FAILED', message: 'Antenna jammed' },
            meta: {},
          }),
        ),
      );

      const user = userEvent.setup();
      render(<AntennaControl />);
      await user.click(screen.getAllByRole('button', { name: /120°/i })[0]);

      await waitFor(() => {
        // Should revert to the original 90° direction
        expect(screen.getByText(/90.*E/)).toBeInTheDocument();
      });
    });
  });
});
