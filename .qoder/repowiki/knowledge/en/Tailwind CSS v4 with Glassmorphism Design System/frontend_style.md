## Styling System Overview

This repository uses **Tailwind CSS v4** as its primary styling framework, configured via the new `@tailwindcss/postcss` plugin and CSS-first configuration approach. The design system emphasizes a modern glassmorphism aesthetic with dark mode support.

### Core Technology Stack

- **CSS Framework**: Tailwind CSS v4 (using CSS-native configuration via `@theme` blocks)
- **PostCSS Plugin**: `@tailwindcss/postcss` for build-time processing
- **Utility Helpers**: `clsx` + `tailwind-merge` combined into a `cn()` utility function for className composition
- **Component Primitives**: Radix UI (`@radix-ui/react-tabs`) for accessible unstyled components
- **Icons**: Lucide React (`lucide-react`)
- **Fonts**: Google Fonts (Geist Sans, Geist Mono) via `next/font`
- **Toast Notifications**: `react-hot-toast`

### Key Files

- `src/app/globals.css` — Central stylesheet defining custom theme tokens, dark mode variant, and reusable utility classes
- `postcss.config.mjs` — PostCSS configuration wiring Tailwind v4's plugin
- `public/theme.js` — Client-side theme persistence script (reads from `localStorage`, applies `.dark` class to `<html>`)
- `src/lib/utils.ts` — Exports the `cn()` helper combining `clsx` and `tailwind-merge`
- `src/components/ui/tabs.tsx` — Example of a shadcn/ui-style component built on Radix primitives with Tailwind styling
- `src/app/layout.tsx` — Root layout applying fonts, theme script, and base body classes

### Design Tokens & Theme Configuration

Defined in `globals.css` using Tailwind v4's `@theme` directive:

**Primary Color Palette:**
- `--color-primary-50`: #eff6ff
- `--color-primary-100`: #dbeafe
- `--color-primary-500`: #3b82f6 (blue-500)
- `--color-primary-600`: #2563eb (blue-600)
- `--color-primary-700`: #1d4ed8 (blue-700)

**Accent Colors:**
- `--color-accent-500`: #10b981 (emerald-500)
- `--color-accent-600`: #059669 (emerald-600)

**Glass Effect Tokens:**
- `--color-glass`: rgba(17, 24, 39, 0.7)
- `--color-glass-border`: rgba(255, 255, 255, 0.1)

**Base Layer Variables:**
- `--background` / `--foreground` for light/dark mode switching

### Dark Mode Strategy

Dark mode is implemented via a **class-based strategy**:

1. A custom variant is defined: `@custom-variant dark (&:where(.dark, .dark *))`
2. The `public/theme.js` script runs after page load, reading `localStorage.getItem('theme')` (defaults to `'dark'`) and toggling the `.dark` class on `<html>`
3. All dark-mode styles use the `dark:` prefix throughout the codebase
4. Base layer defines `:root.dark` overrides for CSS variables

The root layout injects the theme script with `strategy="afterInteractive"` to prevent flash-of-unstyled-content.

### Glassmorphism Utility

A custom `.glass` utility class is defined in `@layer utilities`:

```css
.glass {
  @apply bg-white/75 dark:bg-black/45 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/80 shadow-lg shadow-zinc-200/30 dark:shadow-none;
}
```

This class is used extensively across cards, sidebars, modals, and the login form to create frosted-glass panel effects.

### Component Styling Conventions

**UI Components (`src/components/ui/`):**
- Follow shadcn/ui patterns: Radix UI primitives wrapped with Tailwind classes
- Use the `cn()` utility for className merging with proper conflict resolution
- Support both light and dark variants via `dark:` prefixes
- Include focus-visible ring styles for accessibility

**Page/Layout Components:**
- Consistent rounded corners: `rounded-xl`, `rounded-2xl`
- Standard spacing: `p-4`, `p-5`, `p-6`, `p-8`
- Border styling: `border border-zinc-200 dark:border-zinc-800`
- Background transitions: `transition-colors duration-300`
- Active navigation states use `bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/25`

**Sidebar Navigation Patterns:**
- Inactive links: `text-zinc-500 dark:text-zinc-400 hover:bg-zinc-150 dark:hover:bg-zinc-800/50`
- Active links: `bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/25`
- Dropdown sub-menus use left border indicators: `border-l-2 border-zinc-200 dark:border-zinc-800`

**Login Page Specifics:**
- Uses radial gradient background: `bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]`
- Animated dot-grid background pattern via inline styles
- Form inputs: `bg-zinc-900/50 border border-zinc-800 rounded-xl`
- Primary button: `bg-gradient-to-r from-primary-600 to-primary-500`

### Typography

- **Sans-serif**: Geist (via `--font-geist-sans` CSS variable)
- **Mono**: Geist Mono (via `--font-geist-mono` CSS variable)
- **Fallback**: Arial, Helvetica, sans-serif (defined in globals.css base layer)
- Brand text uses gradient clipping: `bg-clip-text text-transparent bg-gradient-to-br from-emerald-600 to-teal-500`

### Responsive Strategy

The codebase uses Tailwind's mobile-first responsive prefixes (`md:`, `lg:`). Key patterns:
- Sidebar hidden on mobile: `hidden md:flex`
- Padding adjustments: `p-4 md:p-8`
- No explicit breakpoint configuration found — relies on Tailwind defaults

### Rules for Developers

1. **Always use the `cn()` utility** when composing conditional classNames to ensure proper Tailwind class merging
2. **Support dark mode** for all new components using `dark:` prefixes
3. **Use semantic color tokens** (`primary-500`, `accent-600`) rather than raw hex values when possible
4. **Apply `.glass` utility** for card/panel surfaces requiring the frosted effect
5. **Maintain consistent border radius**: `rounded-xl` for small elements, `rounded-2xl` for cards/modals
6. **Use zinc scale** for neutral colors (`zinc-50` through `zinc-950`) instead of gray/slate for consistency
7. **Include transition classes** (`transition-all`, `transition-colors duration-300`) for interactive elements
8. **Follow shadcn/ui patterns** when building new UI components — use Radix primitives where available
9. **Theme persistence** is handled by `public/theme.js` — do not duplicate theme-toggle logic elsewhere without coordinating with this script
10. **Avoid inline styles** except for dynamic values (e.g., animated backgrounds); prefer Tailwind utility classes