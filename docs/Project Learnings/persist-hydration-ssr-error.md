# `useAuthStore.persist` undefined during SSR — the `RequireAuth` hydration bug

**Date:** 2026-05-09
**Affected files:** `src/components/RequireAuth/index.tsx`
**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · zustand 5.0.13 with `persist` middleware

---

## Summary

The `RequireAuth` client-side auth gate crashed on first render with:

```
TypeError: Cannot read properties of undefined (reading 'hasHydrated')
    at <unknown> (src/components/RequireAuth/index.tsx:16:26)
```

The cause was a **lazy `useState` initializer that touched `useAuthStore.persist.hasHydrated()` during the server pre-render of a `'use client'` component**, at a moment when the persist middleware's `.persist` namespace wasn't attached to the store. Fix: defer persist-API access into `useEffect`, which runs only after the component mounts on the client.

---

## Symptom

After signing in and visiting any gated route under `(account)/` (e.g. `/account`, `/orders`), the dev server printed:

```
⨯ TypeError: Cannot read properties of undefined (reading 'hasHydrated')
    at <unknown> (src/components/RequireAuth/index.tsx:16:26)
    at RequireAuth (src/components/RequireAuth/index.tsx:15:43)
  14 |   const router = useRouter()
  15 |   const [hydrated, setHydrated] = useState<boolean>(() =>
> 16 |     useAuthStore.persist.hasHydrated(),
     |                          ^
  17 |   )
  digest: '568495462'
```

The `⨯` glyph and the absence of a browser stack trace were the giveaway: this was a **server-render** error, not a client error. Next.js was throwing while building the initial HTML for the page.

---

## Root cause

Three things had to coincide:

1. **`'use client'` components still render on the server in Next.js App Router.**
   `'use client'` is a *boundary* directive — it tells Next where to split the bundle for hydration. The component itself still executes during the server pre-render that produces the initial HTML. Anything that runs synchronously in the component body (including `useState` lazy initializers) runs on the server.

2. **Lazy `useState` initializers run during render.**
   `useState(() => …)` calls the function immediately during the first render — both server and client.

3. **`useAuthStore.persist` was `undefined` during the server pass.**
   Although the store is created with the `persist` middleware:
   ```ts
   export const useAuthStore = create<AuthState>()(
     persist((set) => ({ ... }), { name: 'auth-storage' }),
   )
   ```
   …the middleware only attaches its `.persist` namespace (`hasHydrated`, `onFinishHydration`, `rehydrate`, etc.) once the storage backend is reachable. On the server there's no `localStorage`, and in this combination of Next 16 + zustand 5.0.13 + Turbopack the namespace was simply absent during the server pre-render. So `useAuthStore.persist` was `undefined`, and reading `.hasHydrated` on it threw.

The original code:

```tsx
const [hydrated, setHydrated] = useState<boolean>(() =>
  useAuthStore.persist.hasHydrated(),   // ← runs during render → server crash
)

useEffect(() => {
  if (useAuthStore.persist.hasHydrated()) { setHydrated(true); return }
  const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
  return unsub
}, [])
```

The `useEffect` block was correct — effects don't run on the server. The bug was the **synchronous** use of `useAuthStore.persist` in the `useState` lazy initializer.

---

## Fix

Defer every read of `useAuthStore.persist` into a `useEffect`. The component now starts with `hydrated: false` on both server and client, and the post-mount effect flips it to `true` once the persist API is reachable.

```tsx
'use client'

export const RequireAuth: React.FC<Props> = ({ children }) => {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  // Same value on server and client → no SSR/CSR mismatch warning.
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const persistApi = useAuthStore.persist
    if (!persistApi) {
      // No persist middleware (or not yet attached) — treat as ready.
      setHydrated(true)
      return
    }
    if (persistApi.hasHydrated()) {
      setHydrated(true)
      return
    }
    const unsub = persistApi.onFinishHydration(() => setHydrated(true))
    return unsub
  }, [])

  useEffect(() => {
    if (hydrated && !user) router.replace('/sign-in')
  }, [hydrated, user, router])

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <CircularProgress aria-label="Loading" />
      </div>
    )
  }

  return <>{children}</>
}
```

### Why this is also correct on the client

Zustand's `persist` middleware (with the default localStorage backend) hydrates **synchronously** during module evaluation. By the time React schedules `useEffect`, `persistApi.hasHydrated()` is already `true`, so the effect flips `hydrated` immediately on first commit. There's no perceptible delay.

If a future change switches to an async storage backend (IndexedDB, server-side cache), the `onFinishHydration` subscription handles it without further changes.

### Defensive `if (!persistApi)` branch

Even though we know `persistApi` exists in production builds, treating it as optional means a subsequent refactor that drops the persist middleware (e.g. moves the token to an httpOnly cookie) won't silently break the gate — `RequireAuth` will just fall through to "ready" and proceed with the auth check.

---

## Lessons

1. **Anything synchronous in a `'use client'` component body runs on the server during pre-render.** That includes `useState` lazy initializers, `useReducer` initializers, top-of-component `useMemo`, and module-level side effects. Treat them like SSR-safe code.

2. **`useEffect` is the SSR escape hatch.** Anything that touches a browser-only API (localStorage, `window`, `document`) — or anything that depends on libraries that have an SSR/CSR split — should be deferred into `useEffect`.

3. **`'use client'` ≠ "client-only".** It marks the *hydration boundary*, not where the code runs. To get true client-only behavior, wrap with a `useEffect`-set boolean (the pattern above), or use `dynamic(() => import(...), { ssr: false })` for an entire component tree.

4. **Persisted-store hydration deserves a dedicated "is hydrated" flag in any code that gates rendering on user state.** Without it, server-rendered HTML shows the logged-out state and the client flashes the logged-in state on rehydration (FOUC), or vice versa. The `hydrated` flag here doubles as both the "store ready" signal and the "don't render yet" signal.

5. **Stack-trace shape is the SSR tell.** `⨯` in the dev terminal + a server file path + no browser console error usually means the error was thrown during pre-render, not during client interaction.

---

## How we got here (timeline)

The bug was introduced during the route-group rework (`(account)/layout.tsx` wrapping all four account routes with `<RequireAuth>`). Before that, `RequireAuth` was called from individual page components, but those `<Suspense>`-wrapped pages happened to defer the render in a way that hid the SSR crash. Putting the gate in a layout meant it ran during the first server pre-render of every account-section URL, which surfaced the issue.

---

## Verifying the fix

Manual:

1. With a signed-in user, visit `/account`, `/orders`, `/wishlist`, `/addresses` and `/account/change-password` — no 500 in the dev terminal, no React error overlay.
2. Sign out, visit `/account` directly — brief spinner, then `router.replace('/sign-in')` redirects without server error.
3. Hard-refresh `/account` while signed in — spinner, then content. No flash of the unauthenticated UI.

Automated (worth adding):

- A Vitest test for `RequireAuth` that mocks `useAuthStore.persist` as `undefined` and asserts the component renders the spinner without throwing.
- A second test where `persist.hasHydrated()` returns `false` initially, then `onFinishHydration` is fired, asserting the component transitions from spinner → children.

---

## Related code

- `src/components/RequireAuth/index.tsx` — the gate.
- `src/stores/useAuthStore.ts` — store + `persist({ name: 'auth-storage' })`.
- `src/app/(account)/layout.tsx` — route-group layout that wraps every account route with `<RequireAuth>`.

## Related external references

- Next.js: ["Use Client" Directive](https://nextjs.org/docs/app/building-your-application/rendering/client-components#using-client-components-in-nextjs)
- Zustand: [persist middleware — `hasHydrated` / `onFinishHydration`](https://zustand.docs.pmnd.rs/integrations/persisting-store-data#api)
