The Dormitory Management Platform uses a standard Node.js/npm dependency management system with the following characteristics:

## Package Manager & Lockfile Strategy
- **Package Manager**: npm (Node Package Manager)
- **Lockfile**: `package-lock.json` (lockfileVersion 3) ensures deterministic builds and reproducible dependency resolution across environments.
- **Private Project**: The `package.json` declares `"private": true`, preventing accidental publication to public registries.

## Core Dependency Categories

### Production Dependencies (`dependencies`)
- **Framework**: Next.js 16.2.6, React 19.2.4, React DOM 19.2.4
- **Database ORM**: Prisma Client ^7.8.0 with PostgreSQL adapter (`@prisma/adapter-pg`)
- **Authentication**: next-auth ^4.24.14
- **UI Components**: @radix-ui/react-tabs ^1.1.15, lucide-react ^1.16.0, recharts ^3.8.1
- **Utilities**: bcrypt ^6.0.0 (password hashing), cloudinary ^2.10.0 (image hosting), xlsx ^0.18.5 (Excel export), html2pdf.js ^0.14.0 (PDF generation), clsx ^2.1.1, tailwind-merge ^3.6.0
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`

### Development Dependencies (`devDependencies`)
- **TypeScript**: ^5 with type definitions for Node, React, pg, bcrypt, ws
- **Linting**: ESLint ^9 with `eslint-config-next` 16.2.6
- **Build Tools**: tsx ^4.22.4 (TypeScript execution engine for scripts)

## Key Configuration Files

### `package.json`
- Defines all project dependencies with semantic versioning ranges (^ for minor/patch updates, exact versions for framework core).
- Includes a `postinstall` script that runs `prisma generate` automatically after `npm install`, ensuring the Prisma client is always up-to-date with the schema.

### `prisma.config.ts`
- Configures Prisma CLI behavior, pointing to `prisma/schema.prisma` and migration directory.
- Seed script configured to run via `ts-node` with CommonJS module compilation.
- Relies on `dotenv` for environment variable loading (DATABASE_URL).

### `next.config.ts`
- Minimal Next.js configuration with image remote pattern allowance for Cloudinary (`res.cloudinary.com`).
- Enables compression and disables the `X-Powered-By` header for security.

### `eslint.config.mjs`
- Extends `eslint-config-next` core web vitals and TypeScript rules.
- Explicitly ignores build artifacts (`.next/**`, `out/**`) and database maintenance scripts (`delete_data.js`, `drop.js`, etc.).

## Versioning Conventions
- **Exact pinning** for framework core: `next: "16.2.6"`, `react: "19.2.4"`, `react-dom: "19.2.4"`, `eslint-config-next: "16.2.6"` — ensures consistency across deployments.
- **Caret ranges** (^) for most libraries allowing automatic minor and patch updates while preventing breaking major version changes.
- **Prisma ecosystem** kept in sync: `@prisma/client`, `@prisma/adapter-pg`, and `prisma` all use `^7.8.0`.

## Developer Rules & Conventions
1. **Always commit `package-lock.json`** to ensure consistent dependency resolution across team members and CI/CD pipelines.
2. **Run `npm install`** after pulling changes that modify `package.json` to update the lockfile and install new dependencies.
3. **Prisma client regeneration** happens automatically via `postinstall` hook; no manual `prisma generate` needed after dependency installation.
4. **Use `npm audit`** periodically to check for known vulnerabilities in dependencies.
5. **Update dependencies cautiously**: Framework packages (Next.js, React) are pinned to exact versions — coordinate upgrades across the team to avoid compatibility issues.
6. **No vendoring**: All dependencies are fetched from the public npm registry (`registry.npmjs.org`); no private registries or GOPRIVATE-equivalent configurations are present.
7. **Environment variables**: Database connection (`DATABASE_URL`) and other secrets are managed via `.env` files (not committed; `.env.example` provides template).