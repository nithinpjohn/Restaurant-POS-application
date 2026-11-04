# Contributing to Kans Resto

Thanks for helping! This guide gets you from clone to pull request.

## Find something to work on

- Browse [issues labelled `good first issue`](https://github.com/nithinpjohn/Restaurant-POS-application/labels/good%20first%20issue) for small tasks.
- Larger pieces are labelled [`help wanted`](https://github.com/nithinpjohn/Restaurant-POS-application/labels/help%20wanted). Comment with your approach before starting.
- Comment on the issue to claim it so two people don't do the same work.
- Have an idea or found a bug? Open an issue first for anything bigger than a small fix.

## Set up

```bash
git clone https://github.com/nithinpjohn/Restaurant-POS-application.git
cd Restaurant-POS-application
npm install
npm run dev        # http://localhost:3000/login
```

Requires Node.js 18+. Demo data (manager PIN, coupons, gift cards) is listed in the [README](README.md#demo-data-to-try).

## How the code is organised

- `app/(dashboard)/` holds the pages. All of them sit inside providers set up in `app/(dashboard)/layout.tsx`.
- `components/<feature>/` holds each feature's provider and UI (`orders`, `shift`, `sync`, `auth`…).
- `lib/` holds pure helpers (money, coupons, allergens, kitchen). Prefer putting logic here so it can be tested.
- State is kept in React context and saved to `localStorage`. Load it in a `useEffect` after mount so server and client render the same HTML.
- Money is handled in integer cents (`lib/money.ts`). Do not do arithmetic on floating-point dollars.

## Code style

- TypeScript, Tailwind v4, shadcn/ui components from `components/ui`, Tabler icons.
- Match the existing look: rounded cards, cream background, Manrope. Reuse components before adding new ones.
- Keep changes focused. One issue per pull request.
- Anything that records a sensitive action (void, refund, delete, shift close) should ask for approval and write to the audit log. Look at how the existing ones do it.
- Mark demo-only shortcuts with a `ponytail:` comment that says what the limit is and when to replace it.

## Before you open a pull request

```bash
npx tsc --noEmit   # must pass with no errors
npm run build      # must succeed
```

Then check your change in the browser, including the empty, loading and error states. For UI changes, add a screenshot to the pull request.

## Commits and pull requests

- Write short, present-tense commit messages, e.g. `Add currency setting to receipts`.
- Link the issue in the description (`Closes #12`).
- Describe what you tested and anything you did not.

## Security

Please do not open a public issue for a vulnerability. Email [info@evalogical.com](mailto:info@evalogical.com) instead.

## Conduct

Be kind and constructive. Harassment or discrimination is not tolerated.
