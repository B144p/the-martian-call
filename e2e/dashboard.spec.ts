import { test, expect } from '@playwright/test';

const mockUser = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  callsign: 'W1AW',
  continent_id: 'na',
  antenna_direction: 90,
  is_transmitting: false,
  last_seen_at: new Date().toISOString(),
};

const mockSignals = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    sender_callsign: 'DL1ABC',
    sender_continent: 'eu',
    sender_direction: 270,
    content: 'Transmission from the old world. Copy?',
    transmitted_at: new Date(Date.now() - 600_000).toISOString(),
    is_interrupted: false,
  },
];

async function setupAuthenticatedRoutes(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { name: 'W1AW Operator', email: 'w1aw@example.com' },
        backendJwt: 'mock-backend-jwt',
      }),
    }),
  );
  await page.route('**/api/v1/stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: { online_count: 12, total_users: 248, online_continents: ['na', 'eu', 'as'] },
        error: null,
        meta: {},
      }),
    }),
  );
  await page.route('**/api/v1/users/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { user: mockUser, activeMessage: null }, error: null, meta: {} }),
    }),
  );
  await page.route('**/api/v1/signals/feed', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: mockSignals, error: null, meta: {} }),
    }),
  );
  await page.route('**/api/v1/signals/missed/count', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { count: 0 }, error: null, meta: {} }),
    }),
  );
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedRoutes(page);
  });

  test('renders the status bar with callsign and online count', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('W1AW')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/12 online/i)).toBeVisible();
  });

  test('shows the signal feed with existing messages', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('W1AW')).toBeVisible({ timeout: 10_000 });
    // Open the signal feed on desktop (it should already be visible)
    await expect(page.getByText('DL1ABC')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Transmission from the old world. Copy?')).toBeVisible();
  });

  test('missed signals banner is hidden when count is zero', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('W1AW')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/missed signal/i)).not.toBeVisible();
  });
});

test.describe('Compose panel', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedRoutes(page);
    await page.route('**/api/v1/messages', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'new-message-uuid-001',
            content: 'Calling CQ from North America',
            hex_sequence: '43 61 6C 6C 69 6E 67 20 43 51 20 66 72 6F 6D 20 4E 6F 72 74 68 20 41 6D 65 72 69 63 61',
            status: 'transmitting',
            chars_sent: 0,
            transmission_started_at: new Date().toISOString(),
            transmission_ends_at: new Date(Date.now() + 15000).toISOString(),
          },
          error: null,
          meta: {},
        }),
      }),
    );
  });

  test('compose textarea is visible on desktop', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('W1AW')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder(/Compose your signal/i)).toBeVisible();
  });

  test('typing shows character count and hex preview', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('W1AW')).toBeVisible({ timeout: 10_000 });

    const textarea = page.getByPlaceholder(/Compose your signal/i);
    await textarea.fill('Hello from Earth');
    await expect(page.getByText('16 / 100')).toBeVisible();
    // Hex for 'H' is '48'
    await expect(page.getByText(/48/)).toBeVisible();
  });

  test('confirmation dialog appears and can be cancelled', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('W1AW')).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder(/Compose your signal/i).fill('Calling CQ from North America');
    await page.getByRole('button', { name: /^TRANSMIT$/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Confirm Transmission')).toBeVisible();

    await page.getByRole('button', { name: /CANCEL/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('successful transmission opens the hex dial overlay', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('W1AW')).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder(/Compose your signal/i).fill('Calling CQ from North America');
    await page.getByRole('button', { name: /^TRANSMIT$/i }).click();
    await page.getByRole('button', { name: /^CONFIRM$/i }).click();

    await expect(page.getByText(/TRANSMITTING/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /INTERRUPT TRANSMISSION/i })).toBeVisible();
  });
});

test.describe('Missed signals banner', () => {
  test('shows missed signals banner when count > 0', async ({ page }) => {
    await setupAuthenticatedRoutes(page);
    // Override the count endpoint
    await page.route('**/api/v1/signals/missed/count', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { count: 3 }, error: null, meta: {} }),
      }),
    );
    await page.route('**/api/v1/signals/missed', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'ms-001', sender_continent: 'eu', sender_direction: 270, transmitted_at: new Date().toISOString() },
          ],
          error: null,
          meta: {},
        }),
      }),
    );

    await page.goto('/');
    await expect(page.getByText('W1AW')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/3 missed signals/i)).toBeVisible();

    await page.getByRole('button', { name: /expand/i }).click();
    await expect(page.getByText('Europe')).toBeVisible({ timeout: 3_000 });
  });
});
