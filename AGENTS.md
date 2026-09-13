# gian-portfolio

Personal developer portfolio for Gian Angelo Tongzon. Single-page React + Vite +
Tailwind CSS v4 site with smooth-scroll anchor navigation and a dark neon aesthetic.

## Development

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # -> dist/
pnpm preview    # serve the production build locally
pnpm typecheck  # tsc --noEmit
```

If you host the build from a subfolder (for example XAMPP at
`http://localhost/portfolio/`), set the base path at build time:

```bash
BASE_PATH=/portfolio/ pnpm build
```

## Project structure

- `index.html` — Vite HTML shell; holds the real `<title>`, meta description, and
  Open Graph tags. Add `og:url` and `og:image` once the site has a live domain.
- `src/main.tsx` — React entrypoint; imports `src/index.css` and mounts `src/App.tsx`
  into `#root`
- `src/App.tsx` — the entire site. Section content lives in the data constants at the
  top of the file (`NAV_ITEMS`, `EXPERIENCE`, `PROJECTS`, `SKILLS`); edit those rather
  than the JSX to change copy
- `src/index.css` — Tailwind import, CSS custom properties (`--font-display`,
  `--card`, `--border`), and the scroll/fade animation classes
- `public/favicon.svg` — gradient monogram favicon
- `vite.config.ts` — React, Tailwind v4, and the `@` alias for `src`
- `docs/design-spec.md` — the original design brief the site was built from
- `.mise.toml` — Node and pnpm versions (optional; only used if you run mise)

## Styling

Tailwind CSS v4 via the `@tailwindcss/vite` plugin. `src/index.css` imports Tailwind
with `@import 'tailwindcss';`. No `tailwind.config.js` or PostCSS config is needed —
put theme customization and global CSS in `src/index.css`.

Note that `src/App.tsx` mixes Tailwind utility classes with inline `style` objects for
the gradient and accent colors. Follow the surrounding convention when editing.

## Known placeholders

These are intentionally unfinished — real values still need to be filled in:

- Social links are `href="#"` (GitHub, LinkedIn, in hero / contact / footer)
- Email is `gianangelo@example.com`
- "View Resume" does not link to a PDF
- Project cards use Unsplash stock photos, not real screenshots
- Per-project GitHub and demo links are `#`

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or
  escape them in single-quoted strings.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
