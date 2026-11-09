# React + TypeScript + Vite

## Local API origin

The backend CORS allowlist currently permits `http://localhost:5173`. The Vite
development server is therefore pinned to that host and port and will fail
instead of silently selecting another port. Before production go-live, add the
deployed frontend origin to the backend CORS allowlist.

## Backend integration

See [backend handoff and verification status](docs/backend-integration.md) for current API coverage, enabled screens, and remaining backend dependencies.

```sh
npm run dev   # http://localhost:5173
npm test      # API contract tests using the captured OpenAPI document (no live writes)
npm run build
npm run lint
```

Copy `.env.example` to `.env.local` only if you need to override the default API origin.
Student verification sends the original JPEG/PNG with the entered name and student number to the backend. There is no frontend OCR or barcode comparison.

## Frontend-first feature contracts (2026-11-09)

- [Backend request and policies](docs/backend-api-request.md)
- [Complete field dictionary](contracts/FIELDS.md)
- [Proposed OpenAPI 3.0.3 JSON](contracts/proposed.openapi.json) — 36 additional REST operations; proposals, not deployed endpoints.

```sh
npm run dev:preview  # http://localhost:5174, isolated local fixtures; no backend writes
npm run dev          # http://localhost:5173, deployed APIs
```

Preview includes discovery, community creation/edit/join/leave/close/member management,
review eligibility/create/update/delete/summary, chat events/read indicators/participants,
schedule editing and home calendar, reports, notices/FAQ/inquiries/feedback, and account forms.
A visible preview banner and reset control identify synthetic data. The preview server lives
only in development; a production build cannot activate it. Preview verification is distinct
from authenticated backend integration.

`VITE_ENABLED_FEATURES` enables individual proposed live contracts after deployment;
see `.env.example`. Chat uses a configurable WebSocket adapter with reconnect and REST
catch-up/fallback. The actual WebSocket URL and raw JSON/STOMP protocol still require
backend confirmation; the frontend does not guess a route.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
