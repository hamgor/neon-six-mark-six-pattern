# Neon Six — Mark Six Pattern Studio

[cloudflarebutton]

Neon Six is a visually outstanding, retro-styled Mark Six analyzer and candidate-generator that helps analysts and hobbyists explore recent draw history and produce 3 high-probability candidate sets using heuristic rules (frequency, co-occurrence, overdue, last-digit, range balance, sum-range, and even/odd balance). It is not a magic predictor; it produces plausible high-probability sets using explainable heuristics and presents the rules and visual analytics in a refined UI.

## Features

- **Interactive Analysis Dashboard**: View recent draws, frequency visualizations, and co-occurrence patterns with responsive, neon-themed UI.
- **Heuristic-Based Prediction**: Generates three candidate sets (Conservative, Spread, Exploratory) using weighted rules for 70-80% historical coverage, tunable via sliders.
- **Rules Panel**: Interactive sheet for adjusting heuristic weights (e.g., frequency: 0.28, recency: 0.18) with live regeneration of sets.
- **Visual Excellence**: Retro neon gradients, smooth micro-interactions, and responsive design across devices using shadcn/ui and Tailwind CSS.
- **Detail Modals**: Deep-dive analytics for numbers, including timelines, pair tables, and distributions.
- **Standalone Python Script**: Replicates the analysis logic for offline experimentation (no external dependencies).
- **Persistence (Phase 2+)**: Save/load presets via Cloudflare Durable Objects for cross-session use.
- **Export & Share**: Generate CSV exports and shareable links (upcoming phases).

The app uses mock data from recent Hong Kong Mark Six draws for immediate demo purposes, with client-side computation for fast interactions.

## Tech Stack

- **Frontend**: React 18, React Router, TypeScript, Tailwind CSS v3, shadcn/ui, Framer Motion (animations), Recharts (visualizations), Lucide React (icons), Zustand (state), TanStack Query (caching), Sonner (toasts).
- **Backend**: Hono (routing), Cloudflare Workers (serverless), Durable Objects (persistence).
- **Build Tools**: Vite (bundler), Bun (package manager), Wrangler (deployment).
- **Other**: Zod (validation), Immer (immutability), Python 3.9+ (standalone script).

## Installation

This project uses Bun as the package manager. Ensure you have Bun installed (version 1.0+).

1. Clone the repository:
   ```
   git clone <repository-url>
   cd neon-six
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. (Optional) Generate TypeScript types from Wrangler bindings:
   ```
   bun run cf-typegen
   ```

The project is pre-configured with shadcn/ui components—no additional setup needed for UI primitives.

## Usage

### Local Development

Start the development server:
```
bun run dev
```

The app runs at `http://localhost:3000` (or the port specified in `PORT`). The frontend serves via Vite, with backend routes handled by the integrated Cloudflare Worker simulation.

- **Home/Analysis View**: Load the app to see the retro dashboard. Tune rules in the panel and click "Generate" to produce candidate sets.
- **Rules Tuning**: Open the sheet to adjust sliders (e.g., boost frequency for "hot" numbers). Sets regenerate instantly.
- **Detail Modal**: Click a number in a set for occurrence history and pair analysis.
- **Regenerate**: Click to shuffle variants while respecting constraints.

### Python Script

For offline analysis, run the standalone script:

1. Ensure Python 3.9+ is installed.
2. Save the script from `scripts/generate_sets.py` (included in the blueprint).
3. Run:
   ```
   python scripts/generate_sets.py
   ```

Output includes top pool, scores, and three candidate sets based on the provided draws.

### API Endpoints (via Worker)

- `GET /api/draws`: Fetch recent draws (mocked client-side initially; backend in Phase 2).
- `POST /api/presets`: Save rule presets to Durable Object (Phase 2+).
- `GET /api/counter`: Example Durable Object interaction (for testing persistence).

Use tools like curl or Postman for testing:
```
curl http://localhost:3000/api/health
```

## Development

### Project Structure

- `src/`: React frontend (pages, components, hooks).
- `worker/`: Hono-based Cloudflare Worker (routes in `userRoutes.ts`, DO logic in `durableObject.ts`).
- `shared/`: Shared types and mock data.
- `scripts/`: Standalone Python analysis (add as needed).

### Adding Features

- **Frontend**: Use shadcn/ui components (e.g., `import { Card } from '@/components/ui/card'`). Follow UI non-negotiables for layout (max-w-7xl wrappers).
- **Backend Routes**: Add to `worker/userRoutes.ts` using Durable Object patterns (e.g., `c.env.GlobalDurableObject.get(...)`).
- **State Management**: Use Zustand for local state; select primitives only to avoid re-render loops.
- **Visual Polish**: Leverage Tailwind animations and Framer Motion for neon glows/hovers. Ensure responsive design with mobile-first breakpoints.

### Linting and Formatting

- Run ESLint: `bun run lint`.
- TypeScript is configured strictly; use `bun tsc` for type-checking.

### Testing

Unit/integration tests can be added with Vitest (not pre-configured). For E2E, use Playwright. Focus on UI interactions and API responses.

## Deployment

Deploy to Cloudflare Workers for global, edge-based hosting with Durable Objects for state.

1. Install Wrangler CLI (if not already): Follow [Cloudflare docs](https://developers.cloudflare.com/workers/wrangler/install-and-update/).
2. Authenticate: `wrangler login`.
3. Build and deploy:
   ```
   bun run deploy
   ```
   This builds the frontend (Vite) and deploys the Worker, serving static assets via Assets bundling.

The deployment URL will be `https://neon-six-<account-id>.workers.dev`. Custom domains can be configured via Wrangler.

[cloudflarebutton]

### Environment Variables

No secrets are required initially. For production, add via Wrangler secrets:
```
wrangler secret put MY_SECRET
```

### CI/CD

Integrate with GitHub Actions or Cloudflare Pages for automated deploys. Use `wrangler deploy` in workflows.

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit changes: `git commit -m 'Add amazing feature'`.
4. Push: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

Follow the code style (ESLint, Prettier via shadcn setup). Ensure no runtime errors and visual polish.

## License

This project is MIT licensed. See [LICENSE](LICENSE) for details (add if needed).

## Support

For issues, open a GitHub issue. For Cloudflare-specific help, refer to [Workers docs](https://developers.cloudflare.com/workers/). Note: This tool is for entertainment/analysis; lotteries are random—no guarantees on predictions.