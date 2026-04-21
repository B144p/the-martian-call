import React from 'react';
import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import { UserProvider } from '@/src/contexts/UserContext';
import { mockUser } from '@/src/mocks/fixtures';
import type { User, Message } from '@/src/types/api';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialUser?: User | null;
  initialMessage?: Message | null;
  backendToken?: string | null;
}

function render(
  ui: React.ReactElement,
  {
    initialUser = mockUser,
    initialMessage = null,
    backendToken = 'mock-backend-jwt',
    ...renderOptions
  }: CustomRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <UserProvider
        initialUser={initialUser}
        initialMessage={initialMessage}
        backendToken={backendToken}
      >
        {children}
      </UserProvider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

export { render };
export * from '@testing-library/react';
