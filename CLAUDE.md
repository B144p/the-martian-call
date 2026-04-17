# Frontend — Next.js Context

## Stack
- Next.js 16 (App Router)
- TypeScript (strict)
- Tailwind CSS
- shadcn/ui (component library)
- Zod (validation)
- usehooks-ts (utility hooks)
- socket.io-client — real-time WebSocket connection to NestJS gateway

## Component Rules
- **Server components by default** — only add `"use client"` when you need:
  - useState / useEffect
  - Browser APIs
  - Event listeners
- Functional components only — no class components
- Named exports over default exports (exception: page.tsx and layout.tsx)
- One component per file
- Build features using shadcn/ui primitives — do not build base UI from scratch

## shadcn/ui Rules
- Install components via CLI: `npx shadcn@latest add <component>`
- Never manually edit files inside `components/ui/` — these are auto-generated
- Extend or wrap shadcn components inside `components/features/` instead
- Use shadcn's `cn()` helper (already in `lib/utils.ts`) for all conditional classes
- Prefer shadcn's built-in variants over writing custom Tailwind for common patterns

## Form Rules
- Use shadcn `<Form>` component with Zod for all forms
- shadcn Form is built on native HTML — no external form library needed
- Always validate schema with Zod before submitting
- Use shadcn `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormMessage>` for consistent form UI
- Validate on client AND rely on server validation too — never trust client alone

## usehooks-ts Rules
- Prefer usehooks-ts hooks over writing custom implementations for common patterns
- Common hooks to use:
  - `useDebounce` — for search inputs, avoid calling API on every keystroke
  - `useEventListener` — for all DOM event listeners, never use raw addEventListener
  - `useLocalStorage` — for persisting non-sensitive UI state
  - `useMediaQuery` — for responsive logic in client components
  - `useOnClickOutside` — for dropdowns and modals
  - `useIsClient` — to avoid SSR hydration mismatch
- Only write a custom hook if usehooks-ts doesn't cover the use case

## Data Fetching Rules
- Fetch data in **Server Components** or **Server Actions** — never in client components
- Use `fetch` with `cache` and `revalidate` options appropriately
- All API calls go through `src/lib/api/` — never call fetch directly in components
- Handle loading and error states for every async operation

## Styling Rules
- Tailwind utility classes only — no custom CSS unless absolutely necessary
- Use `cn()` from `lib/utils.ts` for all conditional classes
- Mobile-first responsive design
- Follow shadcn's design tokens — use CSS variables (`bg-background`, `text-foreground`, etc.) not hardcoded Tailwind colors

## TypeScript Rules
- No `any` — use `unknown` or proper types
- Define API response types in `src/types/` and match them to server DTOs
- Use Zod schemas to infer types where possible: `type MyType = z.infer<typeof MySchema>`

## WebSocket Rules
- Use `socket.io-client` for all real-time connections — never use pusher-js
- Create the socket instance in a context or custom hook — never directly inside a component
- Pass the JWT Bearer token as `auth: { token }` in the socket options for server-side authentication
- Use `NEXT_PUBLIC_API_URL` as the socket endpoint — never hardcode the URL
- Always call `socket.disconnect()` in the cleanup function of the effect that created it
- Listen for events with `socket.on(event, handler)` and clean up with `socket.off(event, handler)` on unmount
- Continent rooms are joined server-side on connection — the client does not call `socket.join()`

## Error Handling
- Always wrap API calls in try/catch
- Show user-friendly error messages using shadcn `<Toast>` or `<Alert>` — never expose raw error objects to UI
- Use Next.js `error.tsx` for route-level error boundaries

## Do NOT
- Do not use Pages Router — App Router only
- Do not use `next/legacy/image` — use `next/image`
- Do not store sensitive data in localStorage
- Do not hardcode API URLs — always use `process.env.NEXT_PUBLIC_API_URL`
- Do not add event listeners with `addEventListener` — use `useEventListener` from usehooks-ts
- Do not write debounce logic from scratch — use `useDebounce` from usehooks-ts
- Do not install React Hook Form — use shadcn Form + Zod instead
- Do not edit files inside `components/ui/` directly
- Do not use pusher-js — use socket.io-client for all real-time features
- Do not call `socket.join()` from the client — room assignment is server-side only

@AGENTS.md
