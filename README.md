# Currency Converter

A live currency converter built on the [CurrencyBeacon](https://currencybeacon.com) API. Type an amount, pick two currencies, and the result updates as you type.

**Stack:** React 19 (with the React Compiler) · TypeScript · Vite · TanStack Query · react-hook-form + Zod · Tailwind CSS v4 with shadcn/ui components on Base UI · Vitest + Testing Library + MSW.

## Getting started

Requires Node `^22.13.0 || >=24` (see `.nvmrc`).

```bash
nvm use
yarn install
cp .env.example .env   # then add your CurrencyBeacon API key
yarn dev
```

| Script         | What it does                                             |
| -------------- | -------------------------------------------------------- |
| `yarn dev`     | Dev server with HMR                                      |
| `yarn test`    | Vitest (watch mode locally, single run in CI)            |
| `yarn lint`    | ESLint, including import order                           |
| `yarn format`  | Format with Prettier (`yarn format:check` to verify)     |
| `yarn build`   | Type-check and build to `dist/`                          |
| `yarn preview` | Serve the built `dist/` locally (run `yarn build` first) |

## Keeping the API key secret

`CURRENCYBEACON_API_KEY` is deliberately not prefixed with `VITE_`, so it is never bundled into the browser code. The app calls `/api/currencybeacon/*`, and the proxy in `vite.config.ts` adds the key on the server side. Both `yarn dev` and `yarn preview` use this proxy.

To host the built app elsewhere, the host needs an equivalent rewrite that forwards `/api/currencybeacon/*` to `https://api.currencybeacon.com/v1/*` with an `Authorization: Bearer <key>` header.

## How it works

- **Caching:** conversions are cached by `{ from, to, amount }` and stay fresh for 60s, so revisiting a recent amount makes no request. The currency list is fetched once per session. Window-focus refetching is off to save API quota.
- **Debouncing:** the amount is debounced by 400ms, so typing "250" sends one request, not three. The spinner appears on the first keystroke.
- **Smooth updates:** while a new amount loads, the previous result stays visible (dimmed), but only for the same currency pair.
- **Cancellation:** outdated requests are aborted, so slow responses can't overwrite newer ones.
- **Retries:** only network errors and 5xx responses are retried (twice, with backoff). Auth, quota (429) and bad-request errors fail straight away.
- **Error messages:** users only see plain messages (connection problem, too many requests, or service unavailable), never setup details such as the API key. On the dev server, the full error is logged to the browser console.
- **Validation:** one Zod schema drives both the form errors and whether a request may be sent. Amounts are parsed in the user's locale, matching how results are formatted (`1,000.5` in en-US, `1.000,5` in de-DE). Each currency list leaves out the currency picked on the other side, so a currency can't be converted into itself.
- **API responses:** every response is validated with Zod, including CurrencyBeacon quirks such as error codes inside HTTP 200 responses and the numeric ISO `code` field.

## Project structure

```
src/
  api/currency-beacon/   fetch client, endpoints, response schemas, typed errors
  components/            converter UI; ui/ holds the shadcn primitives
  hooks/                 useCurrencyConverter (converter state and actions),
                         useCurrencies, useConversion, useDebouncedValue
  lib/                   query client, number and date formatting
  schemas/               converter form schema
test/                    MSW handlers and fixtures, render helpers
```
